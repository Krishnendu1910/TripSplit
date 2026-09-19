import { describe, it, expect, beforeEach } from 'vitest'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useExpenseStore } from '../store/useExpenseStore'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import {
  generateExpenseId,
  validateExpenseInput,
  createExpenseModel,
} from '../features/expenses/models/expenseModel'
import {
  toMinorUnits,
  fromMinorUnits,
  sumMinorUnits,
  isValidMoneyAmount,
} from '../utils/money'

describe('Money Utilities & Precision Correctness', () => {
  it('converts major units to integer minor units accurately', () => {
    expect(toMinorUnits(1689.5)).toBe(168950)
    expect(toMinorUnits('1689.50')).toBe(168950)
    expect(toMinorUnits(0.1)).toBe(10)
    expect(toMinorUnits(0.2)).toBe(20)
    expect(toMinorUnits(100)).toBe(10000)
  })

  it('converts minor units back to major units accurately', () => {
    expect(fromMinorUnits(168950)).toBe(1689.5)
    expect(fromMinorUnits(30)).toBe(0.3)
    expect(fromMinorUnits(10000)).toBe(100)
  })

  it('avoids JavaScript floating-point drift (0.1 + 0.2 = 0.3)', () => {
    const minor1 = toMinorUnits(0.1) // 10 paise
    const minor2 = toMinorUnits(0.2) // 20 paise
    const totalMinor = sumMinorUnits([minor1, minor2]) // 30 paise
    expect(totalMinor).toBe(30)
    expect(fromMinorUnits(totalMinor)).toBe(0.3)
  })

  it('validates monetary amounts strictly', () => {
    expect(isValidMoneyAmount(100)).toBe(true)
    expect(isValidMoneyAmount(100.5)).toBe(true)
    expect(isValidMoneyAmount(100.55)).toBe(true)
    expect(isValidMoneyAmount('450.75')).toBe(true)

    // Invalid amounts
    expect(isValidMoneyAmount(0)).toBe(false)
    expect(isValidMoneyAmount(-50)).toBe(false)
    expect(isValidMoneyAmount(NaN)).toBe(false)
    expect(isValidMoneyAmount(Infinity)).toBe(false)
    expect(isValidMoneyAmount(100.555)).toBe(false) // more than 2 decimals
    expect(isValidMoneyAmount('abc')).toBe(false)
    expect(isValidMoneyAmount('')).toBe(false)
  })
})

describe('Expense Domain Model & Validation', () => {
  it('generates a stable unique expense ID', () => {
    const id1 = generateExpenseId()
    const id2 = generateExpenseId()
    expect(id1).toMatch(/^expense-/)
    expect(id2).toMatch(/^expense-/)
    expect(id1).not.toBe(id2)
  })

  it('rejects empty or whitespace description', () => {
    const res = validateExpenseInput({
      description: '   ',
      amount: 500,
      tripId: 'trip-1',
      paidBy: 'p-1',
      participantIds: ['p-1'],
      date: '2026-10-01',
    })
    expect(res.isValid).toBe(false)
    expect(res.errors.description).toBeDefined()
  })

  it('rejects non-positive or invalid amounts', () => {
    const resZero = validateExpenseInput({
      description: 'Snacks',
      amount: 0,
      tripId: 'trip-1',
      paidBy: 'p-1',
      participantIds: ['p-1'],
      date: '2026-10-01',
    })
    expect(resZero.isValid).toBe(false)
    expect(resZero.errors.amount).toBeDefined()

    const resNegative = validateExpenseInput({
      description: 'Refund',
      amount: -100,
      tripId: 'trip-1',
      paidBy: 'p-1',
      participantIds: ['p-1'],
      date: '2026-10-01',
    })
    expect(resNegative.isValid).toBe(false)
    expect(resNegative.errors.amount).toBeDefined()
  })

  it('validates payer belongs to the trip participants', () => {
    const trip = { id: 'trip-1' }
    const participants = [
      { id: 'p-1', tripId: 'trip-1', name: 'Pritish' },
      { id: 'p-2', tripId: 'trip-1', name: 'Deba' },
    ]

    // Foreign payer from another trip
    const resForeign = validateExpenseInput(
      {
        description: 'Lunch',
        amount: 800,
        tripId: 'trip-1',
        paidBy: 'foreign-user-id',
        participantIds: ['p-1', 'p-2'],
        date: '2026-10-01',
      },
      { trip, participants },
    )
    expect(resForeign.isValid).toBe(false)
    expect(resForeign.errors.paidBy).toMatch(/must be a registered squad member/i)

    // Valid payer
    const resValid = validateExpenseInput(
      {
        description: 'Lunch',
        amount: 800,
        tripId: 'trip-1',
        paidBy: 'p-1',
        participantIds: ['p-1', 'p-2'],
        date: '2026-10-01',
      },
      { trip, participants },
    )
    expect(resValid.isValid).toBe(true)
  })

  it('validates all participants belong to the trip and rejects empty participant list', () => {
    const trip = { id: 'trip-1' }
    const participants = [
      { id: 'p-1', tripId: 'trip-1', name: 'Pritish' },
      { id: 'p-2', tripId: 'trip-1', name: 'Deba' },
    ]

    // Empty participants
    const resEmpty = validateExpenseInput(
      {
        description: 'Snacks',
        amount: 200,
        tripId: 'trip-1',
        paidBy: 'p-1',
        participantIds: [],
        date: '2026-10-01',
      },
      { trip, participants },
    )
    expect(resEmpty.isValid).toBe(false)
    expect(resEmpty.errors.participantIds).toMatch(/select at least one person/i)

    // Foreign participant
    const resForeign = validateExpenseInput(
      {
        description: 'Snacks',
        amount: 200,
        tripId: 'trip-1',
        paidBy: 'p-1',
        participantIds: ['p-1', 'stranger-id'],
        date: '2026-10-01',
      },
      { trip, participants },
    )
    expect(resForeign.isValid).toBe(false)
    expect(resForeign.errors.participantIds).toMatch(/must belong to this trip/i)
  })

  it('creates normalized expense model with minor units and deduplicated participants', () => {
    const model = createExpenseModel({
      tripId: 'trip-1',
      description: '  Dinner at Beachside  ',
      amount: 1680.5,
      paidBy: 'p-1',
      participantIds: ['p-1', 'p-2', 'p-1'], // duplicate p-1
      category: 'food',
      date: '2026-10-02',
      note: '  Cash payment  ',
    })

    expect(model.id).toMatch(/^expense-/)
    expect(model.description).toBe('Dinner at Beachside')
    expect(model.amount).toBe(1680.5)
    expect(model.amountInMinorUnits).toBe(168050)
    expect(model.participantIds).toEqual(['p-1', 'p-2'])
    expect(model.category).toBe('food')
    expect(model.note).toBe('Cash payment')
    expect(model.createdAt).toBeDefined()
    expect(model.updatedAt).toBeDefined()
  })
})

describe('Expense Store Actions & Lifecycle', () => {
  let trip
  let p1, p2, p3

  beforeEach(() => {
    useTripStore.getState().resetStore()
    useParticipantStore.getState().resetStore()
    useExpenseStore.getState().resetStore()

    trip = useTripStore.getState().createTrip({
      name: 'Digha Trip',
      destination: 'Digha, WB',
      startDate: '2026-10-10',
      endDate: '2026-10-12',
      currency: 'INR',
    })

    p1 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Pritish' })
    p2 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Deba' })
    p3 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Rohan' })
  })

  it('creates an expense and calculates trip total spent correctly', () => {
    const expense = useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Petrol',
      amount: 600,
      paidBy: p1.id,
      participantIds: [p1.id, p2.id, p3.id],
      category: 'fuel',
      date: '2026-10-10',
    })

    expect(expense.id).toBeDefined()
    expect(expense.amount).toBe(600)
    expect(expense.amountInMinorUnits).toBe(60000)

    const tripExpenses = useExpenseStore.getState().getExpensesByTrip(trip.id)
    expect(tripExpenses).toHaveLength(1)
    expect(tripExpenses[0].description).toBe('Petrol')

    expect(useExpenseStore.getState().getTotalSpentByTrip(trip.id)).toBe(600)
  })

  it('updates an existing expense while strictly preserving id, tripId, and createdAt', () => {
    const created = useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Lunch',
      amount: 450,
      paidBy: p2.id,
      participantIds: [p1.id, p2.id],
      category: 'food',
      date: '2026-10-10',
    })

    const originalId = created.id
    const originalTripId = created.tripId
    const originalCreatedAt = created.createdAt

    const updated = useExpenseStore.getState().updateExpense(created.id, {
      description: 'Seafood Lunch & Drinks',
      amount: 750.5,
      participantIds: [p1.id, p2.id, p3.id],
    })

    expect(updated.id).toBe(originalId)
    expect(updated.tripId).toBe(originalTripId)
    expect(updated.createdAt).toBe(originalCreatedAt)
    expect(updated.description).toBe('Seafood Lunch & Drinks')
    expect(updated.amount).toBe(750.5)
    expect(updated.amountInMinorUnits).toBe(75050)
    expect(updated.participantIds).toHaveLength(3)

    expect(useExpenseStore.getState().getTotalSpentByTrip(trip.id)).toBe(750.5)
  })

  it('deletes an expense permanently and updates total spent', () => {
    const e1 = useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Snacks',
      amount: 200,
      paidBy: p1.id,
      participantIds: [p1.id],
      date: '2026-10-10',
    })
    const e2 = useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Tea',
      amount: 50,
      paidBy: p2.id,
      participantIds: [p1.id, p2.id],
      date: '2026-10-10',
    })

    expect(useExpenseStore.getState().getTotalSpentByTrip(trip.id)).toBe(250)

    useExpenseStore.getState().deleteExpense(e1.id)

    const remaining = useExpenseStore.getState().getExpensesByTrip(trip.id)
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe(e2.id)
    expect(useExpenseStore.getState().getTotalSpentByTrip(trip.id)).toBe(50)
  })

  it('isolates expenses between multiple trips', () => {
    const tripB = useTripStore.getState().createTrip({
      name: 'Goa Trip',
      destination: 'Goa',
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      currency: 'INR',
    })
    const pB1 = useParticipantStore.getState().addParticipant({ tripId: tripB.id, name: 'Alice' })

    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Digha Hotel',
      amount: 4000,
      paidBy: p1.id,
      participantIds: [p1.id, p2.id],
      date: '2026-10-10',
    })

    useExpenseStore.getState().createExpense({
      tripId: tripB.id,
      description: 'Goa Villa',
      amount: 12000,
      paidBy: pB1.id,
      participantIds: [pB1.id],
      date: '2026-11-01',
    })

    expect(useExpenseStore.getState().getExpensesByTrip(trip.id)).toHaveLength(1)
    expect(useExpenseStore.getState().getTotalSpentByTrip(trip.id)).toBe(4000)

    expect(useExpenseStore.getState().getExpensesByTrip(tripB.id)).toHaveLength(1)
    expect(useExpenseStore.getState().getTotalSpentByTrip(tripB.id)).toBe(12000)
  })

  it('cascades deletion of expenses when a trip is deleted', () => {
    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Expense 1',
      amount: 500,
      paidBy: p1.id,
      participantIds: [p1.id],
      date: '2026-10-10',
    })

    expect(useExpenseStore.getState().getExpensesByTrip(trip.id)).toHaveLength(1)

    // Delete trip through trip store
    useTripStore.getState().deleteTrip(trip.id)

    expect(useExpenseStore.getState().getExpensesByTrip(trip.id)).toHaveLength(0)
    expect(storageAdapter.get('expenses')).toHaveLength(0)
  })

  it('persists expenses across updates and safely handles corrupted storage', () => {
    const exp = useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Beach Chairs',
      amount: 300,
      paidBy: p1.id,
      participantIds: [p1.id, p2.id],
      date: '2026-10-10',
    })

    let stored = storageAdapter.get('expenses')
    expect(stored).toHaveLength(1)
    expect(stored[0].description).toBe('Beach Chairs')

    // Update
    useExpenseStore.getState().updateExpense(exp.id, { description: 'Sun Umbrellas' })
    stored = storageAdapter.get('expenses')
    expect(stored[0].description).toBe('Sun Umbrellas')

    // Corrupted storage test
    storageAdapter.set('expenses', { broken: 'non-array' })
    useExpenseStore.getState().resetStore()
    expect(useExpenseStore.getState().expenses).toEqual([])
  })
})

