import { describe, it, expect, beforeEach } from 'vitest'
import { useTripStore } from '../store/useTripStore'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import { validateTripInput, createTripModel } from '../features/trips/models/tripModel'

describe('Trip Domain Model & Validation', () => {
  it('validates required fields: name, destination, startDate, endDate, currency', () => {
    const res = validateTripInput({})
    expect(res.isValid).toBe(false)
    expect(res.errors.name).toBeDefined()
    expect(res.errors.destination).toBeDefined()
    expect(res.errors.startDate).toBeDefined()
    expect(res.errors.endDate).toBeDefined()
  })

  it('rejects empty or whitespace-only name and destination', () => {
    const res = validateTripInput({
      name: '   ',
      destination: '   ',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      currency: 'INR',
    })
    expect(res.isValid).toBe(false)
    expect(res.errors.name).toBe('Every grand adventure needs a name!')
    expect(res.errors.destination).toBe('Where are you heading?')
  })

  it('rejects end dates that fall before start date', () => {
    const res = validateTripInput({
      name: 'Shimla Trip',
      destination: 'Shimla',
      startDate: '2026-10-10',
      endDate: '2026-10-05',
      currency: 'INR',
    })
    expect(res.isValid).toBe(false)
    expect(res.errors.endDate).toMatch(/cannot be before start date/i)
  })

  it('rejects unsupported currencies', () => {
    const res = validateTripInput({
      name: 'Mars Trip',
      destination: 'Mars',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      currency: 'XYZ_UNKNOWN',
    })
    expect(res.isValid).toBe(false)
    expect(res.errors.currency).toMatch(/unsupported currency/i)
  })

  it('accepts valid input and creates normalized trip model', () => {
    const input = {
      name: '  Kochi Beach Vacation  ',
      destination: '  Kochi, Kerala  ',
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      currency: 'INR',
      description: '  Fresh backwaters and seafood.  ',
    }
    const res = validateTripInput(input)
    expect(res.isValid).toBe(true)

    const model = createTripModel(input)
    expect(model.id).toBeDefined()
    expect(model.name).toBe('Kochi Beach Vacation')
    expect(model.destination).toBe('Kochi, Kerala')
    expect(model.description).toBe('Fresh backwaters and seafood.')
    expect(model.status).toBe('active')
    expect(model.createdAt).toBeDefined()
    expect(model.updatedAt).toBeDefined()
  })
})

describe('TripStore CRUD & Lifecycle Actions', () => {
  beforeEach(() => {
    useTripStore.getState().resetStore()
  })

  it('creates a new trip, stores it in state, and sets activeTripId', () => {
    const trip = useTripStore.getState().createTrip({
      name: 'Manali Expedition',
      destination: 'Manali, HP',
      startDate: '2026-12-01',
      endDate: '2026-12-08',
      currency: 'INR',
      description: 'Snowboarding trip',
    })

    expect(trip.id).toBeDefined()
    expect(trip.name).toBe('Manali Expedition')

    const state = useTripStore.getState()
    expect(state.trips).toHaveLength(1)
    expect(state.activeTripId).toBe(trip.id)
    expect(state.getTripById(trip.id)).toEqual(trip)
  })

  it('updates an existing trip while preserving id and createdAt', () => {
    const created = useTripStore.getState().createTrip({
      name: 'Initial Name',
      destination: 'Goa',
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      currency: 'INR',
    })

    const originalCreatedAt = created.createdAt

    const updated = useTripStore.getState().updateTrip(created.id, {
      name: 'Updated Goa Trip',
      destination: 'North Goa',
      startDate: '2026-09-02',
      endDate: '2026-09-06',
      currency: 'USD',
      description: 'Updated description',
    })

    expect(updated.id).toBe(created.id)
    expect(updated.name).toBe('Updated Goa Trip')
    expect(updated.destination).toBe('North Goa')
    expect(updated.currency).toBe('USD')
    expect(updated.createdAt).toBe(originalCreatedAt)
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(originalCreatedAt).getTime(),
    )
  })

  it('archives and unarchives a trip', () => {
    const trip = useTripStore.getState().createTrip({
      name: 'Pondicherry Tour',
      destination: 'Pondicherry',
      startDate: '2026-08-10',
      endDate: '2026-08-15',
      currency: 'INR',
    })

    expect(useTripStore.getState().getActiveTrips()).toHaveLength(1)
    expect(useTripStore.getState().getArchivedTrips()).toHaveLength(0)

    // Archive
    useTripStore.getState().archiveTrip(trip.id)
    expect(useTripStore.getState().getTripById(trip.id).status).toBe('archived')
    expect(useTripStore.getState().getActiveTrips()).toHaveLength(0)
    expect(useTripStore.getState().getArchivedTrips()).toHaveLength(1)

    // Unarchive
    useTripStore.getState().unarchiveTrip(trip.id)
    expect(useTripStore.getState().getTripById(trip.id).status).toBe('active')
    expect(useTripStore.getState().getActiveTrips()).toHaveLength(1)
    expect(useTripStore.getState().getArchivedTrips()).toHaveLength(0)
  })

  it('deletes a trip permanently and adjusts activeTripId', () => {
    const trip1 = useTripStore.getState().createTrip({
      name: 'Trip 1',
      destination: 'Dest 1',
      startDate: '2026-01-01',
      endDate: '2026-01-05',
      currency: 'INR',
    })
    const trip2 = useTripStore.getState().createTrip({
      name: 'Trip 2',
      destination: 'Dest 2',
      startDate: '2026-02-01',
      endDate: '2026-02-05',
      currency: 'INR',
    })

    expect(useTripStore.getState().trips).toHaveLength(2)

    useTripStore.getState().deleteTrip(trip2.id)
    expect(useTripStore.getState().trips).toHaveLength(1)
    expect(useTripStore.getState().getTripById(trip2.id)).toBeNull()
    expect(useTripStore.getState().activeTripId).toBe(trip1.id)
  })
})

describe('TripStore Persistence Layer', () => {
  beforeEach(() => {
    useTripStore.getState().resetStore()
  })

  it('persists trips to storageAdapter on create, edit, archive, and delete', () => {
    const trip = useTripStore.getState().createTrip({
      name: 'Persistence Trip',
      destination: 'Jaipur',
      startDate: '2026-11-10',
      endDate: '2026-11-15',
      currency: 'INR',
    })

    let stored = storageAdapter.get('trips')
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Persistence Trip')

    // Edit
    useTripStore.getState().updateTrip(trip.id, { name: 'Pink City Tour' })
    stored = storageAdapter.get('trips')
    expect(stored[0].name).toBe('Pink City Tour')

    // Archive
    useTripStore.getState().archiveTrip(trip.id)
    stored = storageAdapter.get('trips')
    expect(stored[0].status).toBe('archived')

    // Delete
    useTripStore.getState().deleteTrip(trip.id)
    stored = storageAdapter.get('trips')
    expect(stored).toHaveLength(0)
  })

  it('handles corrupted or non-array persisted storage safely', () => {
    storageAdapter.set('trips', { invalid: 'not-an-array' })

    // When store re-reads from corrupt storage, it must not throw and fallback gracefully
    const raw = storageAdapter.get('trips')
    expect(Array.isArray(raw)).toBe(false)

    // Re-setting safe array
    useTripStore.getState().createTrip({
      name: 'Recovery Trip',
      destination: 'Varanasi',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      currency: 'INR',
    })

    expect(useTripStore.getState().trips).toHaveLength(1)
    expect(Array.isArray(storageAdapter.get('trips'))).toBe(true)
  })
})

