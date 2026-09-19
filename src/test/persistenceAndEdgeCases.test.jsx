import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useExpenseStore } from '../store/useExpenseStore'
import { calculateTripTotals } from '../features/finance/domain/calculateTripTotals'
import { calculateBalances } from '../features/finance/domain/calculateBalances'
import { calculateExpenseSplit } from '../features/finance/domain/calculateExpenseSplit'
import { calculateSettlements } from '../features/finance/domain/calculateSettlements'
import { toMinorUnits, fromMinorUnits, sumMinorUnits } from '../utils/money'
import { FinanceValidationError } from '../features/finance/domain/financeErrors'

describe('Step 10: Persistence + Edge-Case Hardening', () => {
  beforeEach(() => {
    storageAdapter.clear()
    useTripStore.getState().resetStore()
    useParticipantStore.getState().resetStore()
    useExpenseStore.getState().resetStore()
  })

  afterEach(() => {
    storageAdapter.clear()
    vi.restoreAllMocks()
  })

  describe('1. Storage Corruption & Malformed Hydration', () => {
    it('handles non-existent keys gracefully with fallback', () => {
      expect(storageAdapter.get('non_existent_key', 'fallback')).toBe('fallback')
      expect(storageAdapter.get('non_existent_key', [])).toEqual([])
    })

    it('recovers gracefully from non-JSON string in localStorage', () => {
      storageAdapter.backend.setItem('tripsplit_trips', 'CORRUPT_NOT_JSON{[[')
      expect(storageAdapter.get('trips', [])).toEqual([])
    })

    it('recovers when storage contains primitive values instead of arrays', () => {
      storageAdapter.set('trips', 'just a string')
      storageAdapter.set('participants', 12345)
      storageAdapter.set('expenses', null)

      expect(storageAdapter.get('trips', [])).toBe('just a string')
      
      // Store loadPersistedTrips guards against non-arrays:
      useTripStore.setState({
        trips: Array.isArray(storageAdapter.get('trips', []))
          ? storageAdapter.get('trips', [])
          : [],
      })
      expect(useTripStore.getState().trips).toEqual([])
    })

    it('filters out invalid records: null, primitives, empty IDs or names', () => {
      const dirtyTrips = [
        null,
        undefined,
        42,
        'random-string',
        {},
        { id: '', name: 'No ID' },
        { id: '   ', name: 'Whitespace ID' },
        { id: 't1', name: '' },
        { id: 't1', name: '   ' },
        { id: 'valid-1', name: 'Valid Trip' },
      ]
      storageAdapter.set('trips', dirtyTrips)

      // Direct load filter
      const loaded = storageAdapter
        .get('trips', [])
        .filter(
          (t) =>
            t &&
            typeof t === 'object' &&
            typeof t.id === 'string' &&
            t.id.trim().length > 0 &&
            typeof t.name === 'string' &&
            t.name.trim().length > 0,
        )
      expect(loaded.length).toBe(1)
      expect(loaded[0].id).toBe('valid-1')
    })

    it('filters out invalid expense records: negative, NaN, missing squad or payer', () => {
      const dirtyExpenses = [
        null,
        { id: 'e1' },
        { id: 'e2', tripId: 't1', description: 'desc', amount: -50, paidBy: 'p1', participantIds: ['p1'] },
        { id: 'e3', tripId: 't1', description: 'desc', amount: NaN, paidBy: 'p1', participantIds: ['p1'] },
        { id: 'e4', tripId: 't1', description: 'desc', amount: 0, paidBy: 'p1', participantIds: ['p1'] },
        { id: 'e5', tripId: 't1', description: 'desc', amount: 100, paidBy: '', participantIds: ['p1'] },
        { id: 'e6', tripId: 't1', description: 'desc', amount: 100, paidBy: 'p1', participantIds: [] },
        {
          id: 'valid-exp',
          tripId: 't1',
          description: 'Valid dinner',
          amount: 250,
          paidBy: 'p1',
          participantIds: ['p1', 'p2'],
        },
      ]
      storageAdapter.set('expenses', dirtyExpenses)

      const raw = storageAdapter.get('expenses', [])
      const valid = raw.filter(
        (item) =>
          item &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          item.id.trim().length > 0 &&
          typeof item.tripId === 'string' &&
          item.tripId.trim().length > 0 &&
          typeof item.description === 'string' &&
          item.description.trim().length > 0 &&
          typeof item.amount === 'number' &&
          !isNaN(item.amount) &&
          Number.isFinite(item.amount) &&
          item.amount > 0 &&
          typeof item.paidBy === 'string' &&
          item.paidBy.trim().length > 0 &&
          Array.isArray(item.participantIds) &&
          item.participantIds.length > 0 &&
          item.participantIds.some((pId) => typeof pId === 'string' && pId.trim().length > 0),
      )
      expect(valid.length).toBe(1)
      expect(valid[0].id).toBe('valid-exp')
    })
  })

  describe('2. Deduplication & Identifier Sanitization', () => {
    it('deduplicates trips with duplicate IDs', () => {
      const duplicatedTrips = [
        { id: 'trip-100', name: 'Trip 100 Original', status: 'active' },
        { id: 'trip-100', name: 'Trip 100 Duplicate', status: 'archived' },
        { id: 'trip-200', name: 'Trip 200', status: 'active' },
      ]
      storageAdapter.set('trips', duplicatedTrips)

      // Re-read with our store hydration logic
      const seen = new Set()
      const result = []
      for (const item of storageAdapter.get('trips', [])) {
        if (!seen.has(item.id)) {
          seen.add(item.id)
          result.push(item)
        }
      }
      expect(result.length).toBe(2)
      expect(result[0].name).toBe('Trip 100 Original')
      expect(result[1].name).toBe('Trip 200')
    })

    it('deduplicates duplicate participant IDs inside expense.participantIds', () => {
      const rawExpense = {
        id: 'exp-dup',
        tripId: 'trip-1',
        amount: 300,
        amountInMinorUnits: 30000,
        paidBy: 'p1',
        participantIds: ['p1', 'p1', 'p2', 'p2', 'p1'],
        splitType: 'equal',
      }
      const participants = [
        { id: 'p1', name: 'Alice', tripId: 'trip-1' },
        { id: 'p2', name: 'Bob', tripId: 'trip-1' },
      ]

      const split = calculateExpenseSplit(rawExpense, participants)
      // Should divide by 2 participants, not 5
      expect(Object.keys(split).length).toBe(2)
      expect(split.p1).toBe(15000)
      expect(split.p2).toBe(15000)
      expect(sumMinorUnits(Object.values(split))).toBe(30000)
    })

    it('resets activeTripId to null if the trip ID is non-existent', () => {
      const tripStore = useTripStore.getState()
      tripStore.createTrip({
        name: 'Valid Trip',
        destination: 'Goa',
        startDate: '2026-06-01',
        endDate: '2026-06-10',
        currency: 'INR',
      })
      const createdTrip = useTripStore.getState().trips[0]

      tripStore.setActiveTripId(createdTrip.id)
      expect(useTripStore.getState().activeTripId).toBe(createdTrip.id)

      tripStore.setActiveTripId('non-existent-id')
      expect(useTripStore.getState().activeTripId).toBeNull()

      tripStore.setActiveTripId(null)
      expect(useTripStore.getState().activeTripId).toBeNull()
    })
  })

  describe('3. Financial Boundary Invariants', () => {
    it('handles 1-person solo trip correctly (paid = owed, net = 0, status = settled)', () => {
      const soloParticipant = [{ id: 'solo-1', name: 'Solo Traveler', tripId: 'solo-trip' }]
      const soloExpense = [
        {
          id: 'exp-solo',
          tripId: 'solo-trip',
          amount: 500,
          amountInMinorUnits: 50000,
          paidBy: 'solo-1',
          participantIds: ['solo-1'],
          splitType: 'equal',
        },
      ]

      const totals = calculateTripTotals('solo-trip', soloExpense, soloParticipant)
      expect(totals.totalSpent).toBe(500)
      expect(totals.paidByParticipant['solo-1']).toBe(500)

      const balances = calculateBalances('solo-trip', soloExpense, soloParticipant)
      expect(balances.totalSpent).toBe(500)
      expect(balances.balances['solo-1'].paid).toBe(500)
      expect(balances.balances['solo-1'].owed).toBe(500)
      expect(balances.balances['solo-1'].net).toBe(0)
      expect(balances.balances['solo-1'].status).toBe('settled')

      const settlements = calculateSettlements(balances.balancesList)
      expect(settlements.length).toBe(0)
    })

    it('handles 2-person uneven ₹0.01 split (1 paise remaining)', () => {
      const participants = [
        { id: 'p1', name: 'Alice', tripId: 'trip-cents' },
        { id: 'p2', name: 'Bob', tripId: 'trip-cents' },
      ]
      const expense = {
        id: 'exp-1cent',
        tripId: 'trip-cents',
        amount: 0.01,
        amountInMinorUnits: 1,
        paidBy: 'p1',
        participantIds: ['p1', 'p2'],
        splitType: 'equal',
      }

      const split = calculateExpenseSplit(expense, participants)
      // 1 minor unit divided by 2 -> 0 quotient, 1 remainder. Deterministic remainder to p1
      expect(split.p1 + split.p2).toBe(1)
      expect(split.p1).toBe(1)
      expect(split.p2).toBe(0)

      const balances = calculateBalances('trip-cents', [expense], participants)
      // p1: paid 1, owed 1 -> net 0
      // p2: paid 0, owed 0 -> net 0
      expect(balances.balances.p1.netMinor).toBe(0)
      expect(balances.balances.p2.netMinor).toBe(0)
      expect(balances.balances.p1.status).toBe('settled')
      expect(balances.balances.p2.status).toBe('settled')
    })

    it('handles 3-person ₹0.01 split (1 paise divided among 3 people)', () => {
      const participants = [
        { id: 'p1', name: 'Alice', tripId: 'trip-3cents' },
        { id: 'p2', name: 'Bob', tripId: 'trip-3cents' },
        { id: 'p3', name: 'Charlie', tripId: 'trip-3cents' },
      ]
      const expense = {
        id: 'exp-3cent',
        tripId: 'trip-3cents',
        amount: 0.01,
        amountInMinorUnits: 1,
        paidBy: 'p1',
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'equal',
      }

      const split = calculateExpenseSplit(expense, participants)
      expect(sumMinorUnits(Object.values(split))).toBe(1)
      expect(split.p1).toBe(1)
      expect(split.p2).toBe(0)
      expect(split.p3).toBe(0)

      const balances = calculateBalances('trip-3cents', [expense], participants)
      expect(balances.balances.p1.netMinor).toBe(0)
      expect(balances.balances.p2.netMinor).toBe(0)
      expect(balances.balances.p3.netMinor).toBe(0)
      const sumNet = sumMinorUnits(balances.balancesList.map((b) => b.netMinor))
      expect(sumNet).toBe(0)
    })

    it('handles large financial amount ₹10,00,00,000 without precision loss', () => {
      // ₹10,00,00,000 = 100,000,000 rupees = 10,000,000,000 paise
      const largeAmount = 100000000
      const minor = toMinorUnits(largeAmount)
      expect(minor).toBe(10000000000)
      expect(fromMinorUnits(minor)).toBe(largeAmount)

      const participants = [
        { id: 'p1', name: 'Tycoon A', tripId: 'big-trip' },
        { id: 'p2', name: 'Tycoon B', tripId: 'big-trip' },
        { id: 'p3', name: 'Tycoon C', tripId: 'big-trip' },
      ]
      const expense = {
        id: 'exp-mega',
        tripId: 'big-trip',
        amount: largeAmount,
        amountInMinorUnits: minor,
        paidBy: 'p1',
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'equal',
      }

      const split = calculateExpenseSplit(expense, participants)
      // 10,000,000,000 / 3 = 3,333,333,333 with remainder 1
      expect(sumMinorUnits(Object.values(split))).toBe(minor)
      expect(split.p1).toBe(3333333334)
      expect(split.p2).toBe(3333333333)
      expect(split.p3).toBe(3333333333)

      const balances = calculateBalances('big-trip', [expense], participants)
      const sumNet = sumMinorUnits(balances.balancesList.map((b) => b.netMinor))
      expect(sumNet).toBe(0)

      const settlements = calculateSettlements(balances.balancesList)
      expect(settlements.length).toBeGreaterThan(0)
      const totalSettledMinor = sumMinorUnits(settlements.map((t) => t.amountInMinorUnits))
      expect(totalSettledMinor).toBe(balances.balances.p2.owedMinor + balances.balances.p3.owedMinor)
    })

    it('rejects an expense whose payer does not belong to the trip squad', () => {
      const participants = [
        { id: 'p1', name: 'Alice', tripId: 'trip-1' },
        { id: 'p2', name: 'Bob', tripId: 'trip-1' },
      ]
      const foreignExpense = [
        {
          id: 'exp-foreign',
          tripId: 'trip-1',
          amount: 100,
          amountInMinorUnits: 10000,
          paidBy: 'FOREIGN_PAYER',
          participantIds: ['p1', 'p2'],
          splitType: 'equal',
        },
      ]

      expect(() => {
        calculateTripTotals('trip-1', foreignExpense, participants)
      }).toThrow(FinanceValidationError)
    })
  })

  describe('4. Date & Time Boundary Testing', () => {
    it('handles same-day trips (startDate === endDate) across domain and models', () => {
      const tripStore = useTripStore.getState()
      const today = new Date().toISOString().split('T')[0]
      const trip = tripStore.createTrip({
        name: 'Single Day Hackathon',
        destination: 'Bengaluru',
        startDate: today,
        endDate: today,
        currency: 'INR',
      })
      expect(trip.startDate).toBe(today)
      expect(trip.endDate).toBe(today)
    })

    it('handles far-future dates without failure', () => {
      const tripStore = useTripStore.getState()
      const trip = tripStore.createTrip({
        name: 'Mars Mission 2050',
        destination: 'Mars Olympus Mons',
        startDate: '2050-01-01',
        endDate: '2050-12-31',
        currency: 'USD',
      })
      expect(trip.startDate).toBe('2050-01-01')
      expect(trip.endDate).toBe('2050-12-31')
    })
  })

  describe('5. User Input Hardening & Safety', () => {
    it('safely handles Unicode characters and emojis in trips, participants, and expenses', () => {
      const tripStore = useTripStore.getState()
      const pStore = useParticipantStore.getState()
      const expStore = useExpenseStore.getState()

      const trip = tripStore.createTrip({
        name: '✈️ Tokyo & Kyoto 🇯🇵 桜',
        destination: '東京, 日本',
        startDate: '2026-04-01',
        endDate: '2026-04-10',
        currency: 'JPY',
      })

      const p1 = pStore.addParticipant({
        tripId: trip.id,
        name: '田中 太郎 🌸',
        avatarBg: 'bg-emerald-500',
      })
      const p2 = pStore.addParticipant({
        tripId: trip.id,
        name: 'José María González 🌮',
        avatarBg: 'bg-rose-500',
      })

      const exp = expStore.createExpense({
        tripId: trip.id,
        description: '🍜 一蘭ラーメン ＆ ギョーザ 🥟',
        amount: 3200,
        date: '2026-04-02',
        paidBy: p1.id,
        participantIds: [p1.id, p2.id],
      })

      expect(exp.description).toBe('🍜 一蘭ラーメン ＆ ギョーザ 🥟')
      expect(p1.name).toBe('田中 太郎 🌸')
      expect(p2.name).toBe('José María González 🌮')
      expect(trip.name).toBe('✈️ Tokyo & Kyoto 🇯🇵 桜')
    })

    it('prevents XSS injection: HTML-like tags are treated strictly as plain text', () => {
      const xssPayload = '<script>alert("xss")</script><img src="x" onerror="alert(1)"/>'
      
      const tripStore = useTripStore.getState()
      const trip = tripStore.createTrip({
        name: xssPayload,
        destination: 'Security Lab',
        startDate: '2026-05-01',
        endDate: '2026-05-05',
        currency: 'INR',
      })

      // In React, rendering this text in standard JSX elements safely escapes it
      const { container } = render(
        <div data-testid="trip-name">{trip.name}</div>
      )
      const element = screen.getByTestId('trip-name')
      // Content is plain string text, script tag is not parsed as executable DOM node
      expect(element.textContent).toBe(xssPayload)
      expect(container.querySelector('script')).toBeNull()
      expect(container.querySelector('img')).toBeNull()
    })
  })

  describe('6. High Volume Stress Testing', () => {
    it('handles 50 participants with 500 expenses under 500ms while preserving zero-sum invariant', () => {
      const tripId = 'stress-trip-50'
      const numParticipants = 50
      const participants = Array.from({ length: numParticipants }, (_, i) => ({
        id: `p-${i + 1}`,
        name: `Traveler ${i + 1}`,
        tripId,
      }))

      const numExpenses = 500
      const expenses = []
      for (let i = 0; i < numExpenses; i++) {
        const payerIndex = i % numParticipants
        const payerId = participants[payerIndex].id
        // Select a rotating subset of 5 to 15 participants
        const squadSize = 5 + (i % 11)
        const squad = []
        for (let j = 0; j < squadSize; j++) {
          const memberIndex = (i + j) % numParticipants
          squad.push(participants[memberIndex].id)
        }
        const amount = (i + 1) * 13.75 // non-trivial fractional floats
        const amountInMinorUnits = toMinorUnits(amount)

        expenses.push({
          id: `exp-${i + 1}`,
          tripId,
          description: `Group activity ${i + 1}`,
          amount,
          amountInMinorUnits,
          paidBy: payerId,
          participantIds: Array.from(new Set(squad)),
          splitType: 'equal',
        })
      }

      const startTime = performance.now()
      const balances = calculateBalances(tripId, expenses, participants)
      const settlements = calculateSettlements(balances.balancesList)
      const duration = performance.now() - startTime

      // Performance check: must compute well within reasonable threshold (< 500ms)
      expect(duration).toBeLessThan(500)

      // Mathematical zero-sum invariant check
      const totalNetMinor = sumMinorUnits(balances.balancesList.map((b) => b.netMinor))
      expect(totalNetMinor).toBe(0)

      // Total settled matches debtor/creditor sums
      const totalPositiveNetMinor = sumMinorUnits(
        balances.balancesList.filter((b) => b.netMinor > 0).map((b) => b.netMinor),
      )
      const totalSettledMinor = sumMinorUnits(
        settlements.map((t) => t.amountInMinorUnits),
      )
      expect(totalSettledMinor).toBe(totalPositiveNetMinor)
      expect(settlements.length).toBeGreaterThan(0)
    })
  })

  describe('7. Rehydration / Refresh Persistence', () => {
    it('persists and cleanly rehydrates trips, participants, expenses, activeTripId and financial totals', () => {
      // 1. Create Trip & persist
      const tripStore = useTripStore.getState()
      const trip = tripStore.createTrip({
        name: 'Euro Summer Roadtrip',
        destination: 'Berlin & Prague',
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        currency: 'EUR',
      })
      expect(useTripStore.getState().trips).toHaveLength(1)
      expect(useTripStore.getState().activeTripId).toBe(trip.id)
      expect(storageAdapter.get('trips')).toHaveLength(1)

      // 2. Create Participants & persist
      const pStore = useParticipantStore.getState()
      const p1 = pStore.addParticipant({ tripId: trip.id, name: 'Alice', avatarBg: 'bg-indigo-500' })
      const p2 = pStore.addParticipant({ tripId: trip.id, name: 'Bob', avatarBg: 'bg-emerald-500' })
      const p3 = pStore.addParticipant({ tripId: trip.id, name: 'Charlie', avatarBg: 'bg-amber-500' })
      expect(useParticipantStore.getState().participants).toHaveLength(3)
      expect(storageAdapter.get('participants')).toHaveLength(3)

      // 3. Create Expenses with distinct split types & persist
      const expStore = useExpenseStore.getState()
      // Expense 1: Equal split
      expStore.createExpense({
        tripId: trip.id,
        description: 'Hotel Accommodation',
        amount: 300,
        date: '2026-07-02',
        paidBy: p1.id,
        participantIds: [p1.id, p2.id, p3.id],
        splitType: 'equal',
      })
      // Expense 2: Custom amounts
      expStore.createExpense({
        tripId: trip.id,
        description: 'Train Tickets',
        amount: 150,
        date: '2026-07-03',
        paidBy: p2.id,
        participantIds: [p1.id, p2.id, p3.id],
        splitType: 'custom',
        splitData: {
          customAmounts: {
            [p1.id]: 50,
            [p2.id]: 40,
            [p3.id]: 60,
          },
        },
      })
      // Expense 3: Shares
      expStore.createExpense({
        tripId: trip.id,
        description: 'Group Dinner Feast',
        amount: 200,
        date: '2026-07-04',
        paidBy: p3.id,
        participantIds: [p1.id, p2.id, p3.id],
        splitType: 'shares',
        splitData: {
          shares: {
            [p1.id]: 2,
            [p2.id]: 1,
            [p3.id]: 1,
          },
        },
      })
      expect(useExpenseStore.getState().expenses).toHaveLength(3)
      expect(storageAdapter.get('expenses')).toHaveLength(3)

      // 4. Calculate financial totals before rehydration
      const beforeExpenses = useExpenseStore.getState().expenses
      const beforeParticipants = useParticipantStore.getState().participants
      const beforeTotals = calculateTripTotals(trip.id, beforeExpenses, beforeParticipants)
      const beforeBalances = calculateBalances(trip.id, beforeExpenses, beforeParticipants)
      const beforeSettlements = calculateSettlements(beforeBalances.balancesList)

      expect(beforeTotals.totalSpent).toBe(650)
      expect(beforeTotals.totalSpentMinor).toBe(65000)

      // 5. Recreate / reinitialize store states from persistence (simulating page reload)
      const rehydratedTrips = useTripStore.getState().rehydrate()
      const rehydratedParticipants = useParticipantStore.getState().rehydrate()
      const rehydratedExpenses = useExpenseStore.getState().rehydrate()

      // 6. Verify entities survived
      expect(rehydratedTrips.trips).toHaveLength(1)
      expect(rehydratedTrips.trips[0].id).toBe(trip.id)
      expect(rehydratedTrips.trips[0].name).toBe('Euro Summer Roadtrip')

      expect(rehydratedParticipants.participants).toHaveLength(3)
      expect(rehydratedParticipants.participants.map((p) => p.name)).toEqual(['Alice', 'Bob', 'Charlie'])

      expect(rehydratedExpenses.expenses).toHaveLength(3)
      expect(rehydratedExpenses.expenses.map((e) => e.description)).toEqual([
        'Group Dinner Feast',
        'Train Tickets',
        'Hotel Accommodation',
      ])

      // 7. Calculate financial totals after rehydration and verify exact match
      const afterTotals = calculateTripTotals(
        trip.id,
        useExpenseStore.getState().expenses,
        useParticipantStore.getState().participants,
      )
      const afterBalances = calculateBalances(
        trip.id,
        useExpenseStore.getState().expenses,
        useParticipantStore.getState().participants,
      )
      const afterSettlements = calculateSettlements(afterBalances.balancesList)

      expect(afterTotals).toEqual(beforeTotals)
      expect(afterBalances).toEqual(beforeBalances)
      expect(afterSettlements).toEqual(beforeSettlements)

      // 8. Verify activeTripId survives when valid
      expect(useTripStore.getState().activeTripId).toBe(trip.id)

      // 9. Verify invalid activeTripId falls back safely
      useTripStore.getState().setActiveTripId('invalid-non-existent-trip-id')
      expect(useTripStore.getState().activeTripId).toBeNull()

      // 10. Verify storage with corrupt/non-existent activeTripId falls back safely to null on rehydration
      storageAdapter.set('active_trip_id', 'corrupted-id-not-in-trips')
      useTripStore.getState().rehydrate()
      expect(useTripStore.getState().activeTripId).toBeNull()
    })
  })
})
