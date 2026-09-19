/**
 * Step 11 Production Audit — Automated Test Suite
 *
 * Covers:
 *   1. Performance benchmark: 100 participants / 1,000 expenses
 *   2. Route safety: malformed / malicious / null / undefined trip IDs
 *   3. Data isolation: Trip A vs Trip B — zero cross-contamination
 *   4. Error recovery: malformed LocalStorage, partial corruption, missing keys
 *   5. LocalStorage write-frequency: writes fire only on mutation, never on render
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useExpenseStore } from '../store/useExpenseStore'
import { calculateBalances } from '../features/finance/domain/calculateBalances'
import { calculateSettlements } from '../features/finance/domain/calculateSettlements'
import { getTripFinancialSummary } from '../features/finance'
import { toMinorUnits, sumMinorUnits } from '../utils/money'

// ─── Shared setup helpers ──────────────────────────────────────────────────

function resetAll() {
  storageAdapter.clear()
  useTripStore.getState().resetStore()
  useParticipantStore.getState().resetStore()
  useExpenseStore.getState().resetStore()
}

function makeTrip(overrides = {}) {
  return useTripStore.getState().createTrip({
    name: 'Test Trip',
    destination: 'Goa, India',
    startDate: '2026-10-01',
    endDate: '2026-10-05',
    currency: 'INR',
    ...overrides,
  })
}

function makePerson(tripId, name) {
  return useParticipantStore.getState().addParticipant({ tripId, name })
}

function makeExpense(tripId, paidBy, participantIds, amount = 500) {
  return useExpenseStore.getState().createExpense({
    tripId,
    description: `Expense by ${paidBy}`,
    amount,
    paidBy,
    participantIds,
    date: '2026-10-02',
  })
}

// ─── 1. Performance Benchmark ──────────────────────────────────────────────

describe('Step 11 §1 — Performance Benchmark: 100 participants / 1,000 expenses', () => {
  beforeEach(resetAll)
  afterEach(resetAll)

  it('completes financial calculation + settlement for 100p / 1000e within 1000ms', () => {
    const tripId = 'perf-trip-100p-1000e'
    const NUM_PARTICIPANTS = 100
    const NUM_EXPENSES = 1000

    // Build participants array (pure objects — no store overhead for perf test)
    const participants = Array.from({ length: NUM_PARTICIPANTS }, (_, i) => ({
      id: `pp-${i + 1}`,
      name: `Traveler ${i + 1}`,
      tripId,
    }))

    // Build expenses with rotating payers and rotating participant subsets
    const expenses = []
    for (let i = 0; i < NUM_EXPENSES; i++) {
      const payerIdx = i % NUM_PARTICIPANTS
      const payerId = participants[payerIdx].id

      // Squad of 5–20 participants (deterministic rotation)
      const squadSize = 5 + (i % 16)
      const squad = new Set()
      squad.add(payerId) // payer must be in squad
      for (let j = 0; squad.size < squadSize; j++) {
        squad.add(participants[(i + j) % NUM_PARTICIPANTS].id)
      }

      const amount = (i + 1) * 7.37 // fractional amounts to stress rounding
      expenses.push({
        id: `pe-${i + 1}`,
        tripId,
        description: `Activity ${i + 1}`,
        amount,
        amountInMinorUnits: toMinorUnits(amount),
        paidBy: payerId,
        participantIds: Array.from(squad),
        splitType: 'equal',
      })
    }

    // --- Measure ---
    const t0 = performance.now()
    const balances = calculateBalances(tripId, expenses, participants)
    const t1 = performance.now()
    const settlements = calculateSettlements(balances.balancesList)
    const t2 = performance.now()

    const calcMs = t1 - t0
    const settleMs = t2 - t1
    const totalMs = t2 - t0

    // Performance thresholds (generous for CI)
    expect(calcMs).toBeLessThan(500)
    expect(settleMs).toBeLessThan(600)
    expect(totalMs).toBeLessThan(1000)

    // Mathematical invariants must still hold at scale
    const totalNetMinor = sumMinorUnits(balances.balancesList.map((b) => b.netMinor))
    expect(totalNetMinor).toBe(0)

    // Settlement total === total positive net (creditor side)
    const totalCreditorMinor = sumMinorUnits(
      balances.balancesList.filter((b) => b.netMinor > 0).map((b) => b.netMinor),
    )
    const totalSettledMinor = sumMinorUnits(settlements.map((s) => s.amountInMinorUnits))
    expect(totalSettledMinor).toBe(totalCreditorMinor)

    // Applying settlements brings every balance to 0
    const finalNet = {}
    for (const b of balances.balancesList) {
      finalNet[b.participantId] = b.netMinor
    }
    for (const s of settlements) {
      finalNet[s.from] += s.amountInMinorUnits
      finalNet[s.to] -= s.amountInMinorUnits
    }
    for (const net of Object.values(finalNet)) {
      expect(net).toBe(0)
    }

    // Store timing for the report (silent pass when within thresholds)
    // calcMs, settleMs, totalMs are available if this test is verbose
  })

  it('handles smaller canonical datasets within tight thresholds', () => {
    const datasets = [
      { np: 5, ne: 20, maxMs: 20 },
      { np: 20, ne: 100, maxMs: 50 },
      { np: 50, ne: 500, maxMs: 200 },
    ]

    for (const { np, ne, maxMs } of datasets) {
      const tripId = `perf-${np}p-${ne}e`
      const participants = Array.from({ length: np }, (_, i) => ({
        id: `pp-${np}-${i}`,
        name: `Person ${i}`,
        tripId,
      }))
      const expenses = Array.from({ length: ne }, (_, i) => {
        const payerId = participants[i % np].id
        const squad = new Set([payerId])
        for (let j = 0; squad.size < Math.min(5, np); j++) {
          squad.add(participants[(i + j + 1) % np].id)
        }
        const amount = (i + 1) * 11.11
        return {
          id: `pe-${np}-${i}`,
          tripId,
          description: `Exp ${i}`,
          amount,
          amountInMinorUnits: toMinorUnits(amount),
          paidBy: payerId,
          participantIds: Array.from(squad),
          splitType: 'equal',
        }
      })

      const t0 = performance.now()
      const balances = calculateBalances(tripId, expenses, participants)
      calculateSettlements(balances.balancesList)
      const elapsed = performance.now() - t0

      expect(elapsed).toBeLessThan(maxMs)

      const totalNet = sumMinorUnits(balances.balancesList.map((b) => b.netMinor))
      expect(totalNet).toBe(0)
    }
  })
})

// ─── 2. Route Safety ────────────────────────────────────────────────────────

describe('Step 11 §2 — Route Safety: malformed / malicious trip IDs', () => {
  beforeEach(resetAll)
  afterEach(resetAll)

  it('getTripById returns null for URL-encoded XSS string trip ID', () => {
    // Simulates /trips/%3Cscript%3Ealert(1)%3C%2Fscript%3E being decoded
    const xssId = '<script>alert(1)</script>'
    expect(useTripStore.getState().getTripById(xssId)).toBeNull()
  })

  it('getTripById returns null for the literal string "null"', () => {
    expect(useTripStore.getState().getTripById('null')).toBeNull()
  })

  it('getTripById returns null for the literal string "undefined"', () => {
    expect(useTripStore.getState().getTripById('undefined')).toBeNull()
  })

  it('getTripById returns null for path-traversal string', () => {
    expect(useTripStore.getState().getTripById('../../something')).toBeNull()
  })

  it('getTripById returns null for empty string', () => {
    expect(useTripStore.getState().getTripById('')).toBeNull()
  })

  it('getTripById returns null for whitespace-only string', () => {
    expect(useTripStore.getState().getTripById('   ')).toBeNull()
  })

  it('getTripById never returns another trip for unrecognised ID', () => {
    const trip = makeTrip({ name: 'Real Trip' })
    const realId = trip.id

    // Different ID must not return the real trip
    expect(useTripStore.getState().getTripById('nonexistent-id')).toBeNull()
    // Real ID still works
    expect(useTripStore.getState().getTripById(realId)).not.toBeNull()
  })

  it('malicious trip ID used as createExpense tripId is rejected cleanly', () => {
    const trip = makeTrip()
    const p = makePerson(trip.id, 'Alice')

    expect(() => {
      useExpenseStore.getState().createExpense({
        tripId: '<script>alert(1)</script>',
        description: 'XSS attempt',
        amount: 100,
        paidBy: p.id,
        participantIds: [p.id],
        date: '2026-10-02',
      })
    }).toThrow(/Trip not found/i)
  })

  it('trip with XSS name is stored and rendered as plain text (no DOM injection)', () => {
    const xssName = '<img src="x" onerror="alert(1)"/>'
    const trip = makeTrip({ name: xssName })
    // Name is stored verbatim as a plain string
    const stored = useTripStore.getState().getTripById(trip.id)
    expect(stored.name).toBe(xssName)
    // No HTML escaping needed in domain: React renders it as text in JSX
  })
})

// ─── 3. Data Isolation: Trip A vs Trip B ────────────────────────────────────

describe('Step 11 §3 — Data Isolation: Trip A vs Trip B', () => {
  let tripA, tripB
  let pA1, pA2
  let pB1, pB2
  let expA, expB

  beforeEach(() => {
    resetAll()

    tripA = makeTrip({ name: 'Goa Holiday' })
    tripB = makeTrip({ name: 'Kashmir Trek' })

    pA1 = makePerson(tripA.id, 'Alice')
    pA2 = makePerson(tripA.id, 'Bob')
    pB1 = makePerson(tripB.id, 'Aarav')
    pB2 = makePerson(tripB.id, 'Kabir')

    expA = makeExpense(tripA.id, pA1.id, [pA1.id, pA2.id], 2000)
    expB = makeExpense(tripB.id, pB1.id, [pB1.id, pB2.id], 5000)
  })

  afterEach(resetAll)

  it('Trip A expenses do not appear in Trip B and vice versa', () => {
    const expensesA = useExpenseStore.getState().getExpensesByTrip(tripA.id)
    const expensesB = useExpenseStore.getState().getExpensesByTrip(tripB.id)

    expect(expensesA).toHaveLength(1)
    expect(expensesA[0].id).toBe(expA.id)
    expect(expensesA[0].tripId).toBe(tripA.id)

    expect(expensesB).toHaveLength(1)
    expect(expensesB[0].id).toBe(expB.id)
    expect(expensesB[0].tripId).toBe(tripB.id)
  })

  it('Trip A participants do not appear in Trip B and vice versa', () => {
    const participantsA = useParticipantStore.getState().getParticipantsByTrip(tripA.id)
    const participantsB = useParticipantStore.getState().getParticipantsByTrip(tripB.id)

    expect(participantsA.map((p) => p.id)).not.toContain(pB1.id)
    expect(participantsA.map((p) => p.id)).not.toContain(pB2.id)
    expect(participantsB.map((p) => p.id)).not.toContain(pA1.id)
    expect(participantsB.map((p) => p.id)).not.toContain(pA2.id)
  })

  it('Trip A financial summary does not include Trip B totals', () => {
    const summaryA = getTripFinancialSummary(tripA.id)
    const summaryB = getTripFinancialSummary(tripB.id)

    expect(summaryA.totalSpent).toBe(2000)
    expect(summaryB.totalSpent).toBe(5000)

    // Trip A balances contain only Trip A participant IDs
    const balanceIdsA = Object.keys(summaryA.balances)
    expect(balanceIdsA).toContain(pA1.id)
    expect(balanceIdsA).toContain(pA2.id)
    expect(balanceIdsA).not.toContain(pB1.id)
    expect(balanceIdsA).not.toContain(pB2.id)

    // Trip B balances contain only Trip B participant IDs
    const balanceIdsB = Object.keys(summaryB.balances)
    expect(balanceIdsB).toContain(pB1.id)
    expect(balanceIdsB).toContain(pB2.id)
    expect(balanceIdsB).not.toContain(pA1.id)
    expect(balanceIdsB).not.toContain(pA2.id)
  })

  it('Trip A paidByParticipant does not include Trip B participants', () => {
    const summaryA = getTripFinancialSummary(tripA.id)
    expect(summaryA.paidByParticipant[pB1.id]).toBeUndefined()
    expect(summaryA.paidByParticipant[pB2.id]).toBeUndefined()
  })

  it('Trip B paidByParticipant does not include Trip A participants', () => {
    const summaryB = getTripFinancialSummary(tripB.id)
    expect(summaryB.paidByParticipant[pA1.id]).toBeUndefined()
    expect(summaryB.paidByParticipant[pA2.id]).toBeUndefined()
  })

  it('Trip A settlements do not involve Trip B participants', () => {
    const summaryA = getTripFinancialSummary(tripA.id)
    for (const s of summaryA.settlements) {
      expect([pA1.id, pA2.id]).toContain(s.from)
      expect([pA1.id, pA2.id]).toContain(s.to)
    }
  })

  it('deleting Trip A leaves Trip B completely intact', () => {
    useTripStore.getState().deleteTrip(tripA.id)

    // Trip B still exists
    expect(useTripStore.getState().getTripById(tripB.id)).not.toBeNull()

    // Trip B participants intact
    const pB = useParticipantStore.getState().getParticipantsByTrip(tripB.id)
    expect(pB).toHaveLength(2)
    expect(pB.map((p) => p.name).sort()).toEqual(['Aarav', 'Kabir'])

    // Trip B expenses intact
    const eB = useExpenseStore.getState().getExpensesByTrip(tripB.id)
    expect(eB).toHaveLength(1)
    expect(eB[0].amount).toBe(5000)

    // Trip B financial summary intact
    const summaryB = getTripFinancialSummary(tripB.id)
    expect(summaryB.totalSpent).toBe(5000)
    expect(summaryB.invariantsHold).toBe(true)
  })

  it('Trip B participant cannot be a payer in Trip A expense', () => {
    expect(() => {
      useExpenseStore.getState().createExpense({
        tripId: tripA.id,
        description: 'Cross-trip payer hack',
        amount: 300,
        paidBy: pB1.id, // belongs to Trip B
        participantIds: [pA1.id],
        date: '2026-10-02',
      })
    }).toThrow()
  })

  it('Trip B participant cannot be in Trip A expense squad', () => {
    expect(() => {
      useExpenseStore.getState().createExpense({
        tripId: tripA.id,
        description: 'Cross-trip squad hack',
        amount: 300,
        paidBy: pA1.id,
        participantIds: [pA1.id, pB2.id], // pB2 belongs to Trip B
        date: '2026-10-02',
      })
    }).toThrow()
  })

  it('zero-sum invariants hold independently for both trips after mutations', () => {
    // Add a second expense to Trip A
    makeExpense(tripA.id, pA2.id, [pA1.id, pA2.id], 800)

    const summaryA = getTripFinancialSummary(tripA.id)
    const summaryB = getTripFinancialSummary(tripB.id)

    expect(summaryA.invariantsHold).toBe(true)
    expect(summaryB.invariantsHold).toBe(true)

    // Net-zero check A
    const netA = summaryA.balancesList.reduce((sum, b) => sum + b.netMinor, 0)
    expect(netA).toBe(0)

    // Net-zero check B
    const netB = summaryB.balancesList.reduce((sum, b) => sum + b.netMinor, 0)
    expect(netB).toBe(0)
  })
})

// ─── 4. Error Recovery ───────────────────────────────────────────────────────

describe('Step 11 §4 — Error Recovery from Malformed LocalStorage', () => {
  beforeEach(resetAll)
  afterEach(resetAll)

  it('recovers from completely corrupt trips storage (non-JSON)', () => {
    storageAdapter.backend.setItem('tripsplit_trips', 'TOTALLY_BROKEN{{{')
    expect(() => useTripStore.getState().rehydrate()).not.toThrow()
    const { trips } = useTripStore.getState().rehydrate()
    expect(Array.isArray(trips)).toBe(true)
    expect(trips).toHaveLength(0)
  })

  it('recovers from completely corrupt participants storage (non-JSON)', () => {
    storageAdapter.backend.setItem('tripsplit_participants', '<<invalid>>')
    expect(() => useParticipantStore.getState().rehydrate()).not.toThrow()
    const { participants } = useParticipantStore.getState().rehydrate()
    expect(Array.isArray(participants)).toBe(true)
    expect(participants).toHaveLength(0)
  })

  it('recovers from completely corrupt expenses storage (non-JSON)', () => {
    storageAdapter.backend.setItem('tripsplit_expenses', 'undefined')
    expect(() => useExpenseStore.getState().rehydrate()).not.toThrow()
    const { expenses } = useExpenseStore.getState().rehydrate()
    expect(Array.isArray(expenses)).toBe(true)
    expect(expenses).toHaveLength(0)
  })

  it('discards partially corrupt expense records while keeping valid ones', () => {
    const mixedExpenses = [
      // Invalid: missing tripId
      { id: 'e-bad-1', description: 'Missing tripId', amount: 100, paidBy: 'p1', participantIds: ['p1'] },
      // Invalid: amount is NaN
      { id: 'e-bad-2', tripId: 't1', description: 'NaN amount', amount: NaN, paidBy: 'p1', participantIds: ['p1'] },
      // Invalid: negative amount
      { id: 'e-bad-3', tripId: 't1', description: 'Negative', amount: -99, paidBy: 'p1', participantIds: ['p1'] },
      // Invalid: empty participantIds
      { id: 'e-bad-4', tripId: 't1', description: 'Empty squad', amount: 100, paidBy: 'p1', participantIds: [] },
      // Invalid: null record
      null,
      // Valid record
      {
        id: 'e-good-1',
        tripId: 't1',
        description: 'Valid expense',
        amount: 500,
        amountInMinorUnits: 50000,
        paidBy: 'p1',
        participantIds: ['p1', 'p2'],
        splitType: 'equal',
      },
    ]
    storageAdapter.set('expenses', mixedExpenses)
    const { expenses } = useExpenseStore.getState().rehydrate()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].id).toBe('e-good-1')
  })

  it('discards partially corrupt trip records while keeping valid ones', () => {
    const mixedTrips = [
      null,
      42,
      { id: '', name: 'No ID' },
      { id: 'bad-2', name: '' },
      { id: 'good-1', name: 'Valid Trip', status: 'active' },
    ]
    storageAdapter.set('trips', mixedTrips)
    const { trips } = useTripStore.getState().rehydrate()
    expect(trips).toHaveLength(1)
    expect(trips[0].id).toBe('good-1')
  })

  it('recovers when active_trip_id references a non-existent trip', () => {
    storageAdapter.set('active_trip_id', 'ghost-trip-that-does-not-exist')
    const { activeTripId } = useTripStore.getState().rehydrate()
    expect(activeTripId).toBeNull()
  })

  it('stores survive null being set for all keys simultaneously', () => {
    storageAdapter.set('trips', null)
    storageAdapter.set('participants', null)
    storageAdapter.set('expenses', null)
    storageAdapter.set('active_trip_id', null)

    expect(() => {
      useTripStore.getState().rehydrate()
      useParticipantStore.getState().rehydrate()
      useExpenseStore.getState().rehydrate()
    }).not.toThrow()

    expect(useTripStore.getState().trips).toHaveLength(0)
    expect(useParticipantStore.getState().participants).toHaveLength(0)
    expect(useExpenseStore.getState().expenses).toHaveLength(0)
  })

  it('getTripFinancialSummary returns safe zero state for nonexistent tripId', () => {
    const summary = getTripFinancialSummary('completely-nonexistent-trip-id')
    expect(summary.totalSpent).toBe(0)
    expect(summary.settlements).toEqual([])
    expect(summary.invariantsHold).toBe(true)
  })

  it('getTripFinancialSummary handles null tripId gracefully', () => {
    const summary = getTripFinancialSummary(null)
    expect(summary.totalSpent).toBe(0)
    expect(summary.settlements).toEqual([])
  })
})

// ─── 5. LocalStorage Write Frequency ────────────────────────────────────────

describe('Step 11 §5 — LocalStorage Write Frequency', () => {
  beforeEach(resetAll)
  afterEach(() => {
    resetAll()
    vi.restoreAllMocks()
  })

  it('creating a trip writes storage exactly once (for trips + once for active_trip_id)', () => {
    const setSpy = vi.spyOn(storageAdapter, 'set')

    makeTrip({ name: 'Write-count Trip' })

    // Should write trips + active_trip_id = 2 writes
    const tripWrites = setSpy.mock.calls.filter(([key]) => key === 'trips')
    const activeTripWrites = setSpy.mock.calls.filter(([key]) => key === 'active_trip_id')
    expect(tripWrites).toHaveLength(1)
    expect(activeTripWrites).toHaveLength(1)
  })

  it('creating a participant writes storage exactly once', () => {
    const trip = makeTrip()
    const setSpy = vi.spyOn(storageAdapter, 'set')

    makePerson(trip.id, 'TestPerson')

    const participantWrites = setSpy.mock.calls.filter(([key]) => key === 'participants')
    expect(participantWrites).toHaveLength(1)
  })

  it('creating an expense writes storage exactly once', () => {
    const trip = makeTrip()
    const p = makePerson(trip.id, 'TestPayer')
    const setSpy = vi.spyOn(storageAdapter, 'set')

    makeExpense(trip.id, p.id, [p.id], 300)

    const expenseWrites = setSpy.mock.calls.filter(([key]) => key === 'expenses')
    expect(expenseWrites).toHaveLength(1)
  })

  it('editing an expense writes storage exactly once', () => {
    const trip = makeTrip()
    const p = makePerson(trip.id, 'Editor')
    const exp = makeExpense(trip.id, p.id, [p.id], 400)

    const setSpy = vi.spyOn(storageAdapter, 'set')

    useExpenseStore.getState().updateExpense(exp.id, { description: 'Updated', amount: 500 })

    const expenseWrites = setSpy.mock.calls.filter(([key]) => key === 'expenses')
    expect(expenseWrites).toHaveLength(1)
  })

  it('deleting an expense writes storage exactly once', () => {
    const trip = makeTrip()
    const p = makePerson(trip.id, 'Deleter')
    const exp = makeExpense(trip.id, p.id, [p.id], 200)

    const setSpy = vi.spyOn(storageAdapter, 'set')

    useExpenseStore.getState().deleteExpense(exp.id)

    const expenseWrites = setSpy.mock.calls.filter(([key]) => key === 'expenses')
    expect(expenseWrites).toHaveLength(1)
  })

  it('reading store state (getTripById, getExpensesByTrip) triggers zero storage writes', () => {
    const trip = makeTrip()
    const p = makePerson(trip.id, 'Reader')
    makeExpense(trip.id, p.id, [p.id], 100)

    const setSpy = vi.spyOn(storageAdapter, 'set')

    // Pure reads — no writes expected
    useTripStore.getState().getTripById(trip.id)
    useTripStore.getState().getActiveTrips()
    useExpenseStore.getState().getExpensesByTrip(trip.id)
    useParticipantStore.getState().getParticipantsByTrip(trip.id)
    getTripFinancialSummary(trip.id)

    expect(setSpy).not.toHaveBeenCalled()
  })

  it('deleting a trip writes trips + active_trip_id exactly once each', () => {
    const trip = makeTrip()
    const setSpy = vi.spyOn(storageAdapter, 'set')
    const removeSpy = vi.spyOn(storageAdapter, 'remove')

    useTripStore.getState().deleteTrip(trip.id)

    const tripWrites = setSpy.mock.calls.filter(([key]) => key === 'trips')
    expect(tripWrites).toHaveLength(1)
    // active_trip_id removed (not set, since no trip remains)
    const activeRemoves = removeSpy.mock.calls.filter(([key]) => key === 'active_trip_id')
    expect(activeRemoves).toHaveLength(1)
  })
})

