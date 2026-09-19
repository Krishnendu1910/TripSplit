import { describe, it, expect, beforeEach } from 'vitest'
import { useParticipantStore } from '../store/useParticipantStore'
import { useTripStore } from '../store/useTripStore'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import {
  validateParticipantInput,
  createParticipantModel,
  generateParticipantId,
} from '../features/participants/models/participantModel'

describe('Participant Domain Model & Validation', () => {
  it('generates a stable unique participant ID', () => {
    const id1 = generateParticipantId()
    const id2 = generateParticipantId()
    expect(id1).toMatch(/^participant-/)
    expect(id2).toMatch(/^participant-/)
    expect(id1).not.toBe(id2)
  })

  it('rejects missing or empty name', () => {
    const res = validateParticipantInput({ tripId: 'trip-123', name: '   ' }, [])
    expect(res.isValid).toBe(false)
    expect(res.errors.name).toBe('Every squad member needs a name!')
  })

  it('rejects missing tripId', () => {
    const res = validateParticipantInput({ name: 'Rahul' }, [])
    expect(res.isValid).toBe(false)
    expect(res.errors.tripId).toBe('Participant must belong to a trip.')
  })

  it('rejects duplicate names within the same trip (case-insensitive & trimmed)', () => {
    const existing = [
      { id: 'p-1', tripId: 'trip-1', name: 'Alice' },
      { id: 'p-2', tripId: 'trip-1', name: 'Bob' },
    ]

    const res1 = validateParticipantInput({ tripId: 'trip-1', name: 'alice' }, existing)
    expect(res1.isValid).toBe(false)
    expect(res1.errors.name).toBe('Someone with this name is already on this trip!')

    const res2 = validateParticipantInput({ tripId: 'trip-1', name: '  BOB  ' }, existing)
    expect(res2.isValid).toBe(false)
    expect(res2.errors.name).toBe('Someone with this name is already on this trip!')
  })

  it('allows same name across different trips (multi-trip isolation)', () => {
    const existing = [
      { id: 'p-1', tripId: 'trip-1', name: 'Alice' },
    ]

    const res = validateParticipantInput({ tripId: 'trip-2', name: 'Alice' }, existing)
    expect(res.isValid).toBe(true)
  })

  it('allows editing name to the same name when excludeId is provided', () => {
    const existing = [
      { id: 'p-1', tripId: 'trip-1', name: 'Alice' },
    ]

    const res = validateParticipantInput(
      { tripId: 'trip-1', name: 'Alice', excludeId: 'p-1' },
      existing,
    )
    expect(res.isValid).toBe(true)
  })

  it('creates normalized participant model with avatar and timestamps', () => {
    const model = createParticipantModel({ tripId: 'trip-1', name: '  Pkm  ' })
    expect(model.id).toMatch(/^participant-/)
    expect(model.tripId).toBe('trip-1')
    expect(model.name).toBe('Pkm')
    expect(model.avatarBg).toBeDefined()
    expect(model.createdAt).toBeDefined()
    expect(model.updatedAt).toBeDefined()
  })
})

describe('Participant Store Actions & Lifecycle', () => {
  beforeEach(() => {
    useParticipantStore.getState().resetStore()
    useTripStore.getState().resetStore()
  })

  it('adds a participant and retrieves by tripId', () => {
    const participant = useParticipantStore.getState().addParticipant({
      tripId: 'trip-manali',
      name: 'Pkm',
    })

    expect(participant.id).toBeDefined()
    expect(participant.name).toBe('Pkm')

    const tripParticipants = useParticipantStore.getState().getParticipantsByTrip('trip-manali')
    expect(tripParticipants).toHaveLength(1)
    expect(tripParticipants[0].name).toBe('Pkm')
  })

  it('updates participant name while preserving exact ID, tripId, and createdAt', () => {
    const created = useParticipantStore.getState().addParticipant({
      tripId: 'trip-manali',
      name: 'Rohan',
    })

    const originalId = created.id
    const originalTripId = created.tripId
    const originalCreatedAt = created.createdAt

    const updated = useParticipantStore.getState().updateParticipant(created.id, {
      name: 'Rohan Sharma',
    })

    expect(updated.id).toBe(originalId)
    expect(updated.tripId).toBe(originalTripId)
    expect(updated.name).toBe('Rohan Sharma')
    expect(updated.createdAt).toBe(originalCreatedAt)
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(originalCreatedAt).getTime(),
    )

    const fromStore = useParticipantStore.getState().getParticipantById(originalId)
    expect(fromStore.name).toBe('Rohan Sharma')
  })

  it('removes a single participant permanently', () => {
    const p1 = useParticipantStore.getState().addParticipant({ tripId: 'trip-1', name: 'Person 1' })
    const p2 = useParticipantStore.getState().addParticipant({ tripId: 'trip-1', name: 'Person 2' })

    expect(useParticipantStore.getState().getParticipantsByTrip('trip-1')).toHaveLength(2)

    useParticipantStore.getState().removeParticipant(p1.id)

    const remaining = useParticipantStore.getState().getParticipantsByTrip('trip-1')
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe(p2.id)
  })

  it('isolates participants of different trips and cascades delete when trip is deleted', () => {
    const tripA = useTripStore.getState().createTrip({
      name: 'Trip A',
      destination: 'Dest A',
      startDate: '2026-01-01',
      endDate: '2026-01-05',
      currency: 'INR',
    })
    const tripB = useTripStore.getState().createTrip({
      name: 'Trip B',
      destination: 'Dest B',
      startDate: '2026-02-01',
      endDate: '2026-02-05',
      currency: 'INR',
    })

    useParticipantStore.getState().addParticipant({ tripId: tripA.id, name: 'Pkm' })
    useParticipantStore.getState().addParticipant({ tripId: tripA.id, name: 'Deba' })
    useParticipantStore.getState().addParticipant({ tripId: tripB.id, name: 'Pkm' })

    expect(useParticipantStore.getState().getParticipantsByTrip(tripA.id)).toHaveLength(2)
    expect(useParticipantStore.getState().getParticipantsByTrip(tripB.id)).toHaveLength(1)

    // Delete Trip A -> cascading purge of Trip A's participants
    useTripStore.getState().deleteTrip(tripA.id)

    expect(useParticipantStore.getState().getParticipantsByTrip(tripA.id)).toHaveLength(0)
    // Trip B's participants must remain completely intact
    expect(useParticipantStore.getState().getParticipantsByTrip(tripB.id)).toHaveLength(1)
  })

  it('persists participants to storageAdapter across updates', () => {
    const p = useParticipantStore.getState().addParticipant({
      tripId: 'trip-kerala',
      name: 'Sarkar',
    })

    let stored = storageAdapter.get('participants')
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Sarkar')

    useParticipantStore.getState().updateParticipant(p.id, { name: 'Krishnendu Sarkar' })
    stored = storageAdapter.get('participants')
    expect(stored[0].name).toBe('Krishnendu Sarkar')

    useParticipantStore.getState().removeParticipant(p.id)
    stored = storageAdapter.get('participants')
    expect(stored).toHaveLength(0)
  })

  it('handles corrupted storage gracefully', () => {
    storageAdapter.set('participants', 'malformed-string')
    // Reset should handle it cleanly
    useParticipantStore.getState().resetStore()
    expect(useParticipantStore.getState().participants).toEqual([])
  })
})

