import { describe, it, expect, beforeEach } from 'vitest'
import { calculateBalances } from '../features/finance/domain/calculateBalances'
import { calculateSettlements } from '../features/finance/domain/calculateSettlements'
import { getTripFinancialSummary } from '../features/finance/index'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useExpenseStore } from '../store/useExpenseStore'
import {
  DIGHA_TRIP,
  DIGHA_PARTICIPANTS,
  DIGHA_EXPENSES,
} from './fixtures/dighaTrip'
import { sumMinorUnits } from '../utils/money'

describe('calculateSettlements Engine & Debt Minimization', () => {
  it('generates direct minimal settlements for 2 participants', () => {
    // A is +50, B is -50
    const balances = [
      { participantId: 'A', netMinor: 5000, net: 50 },
      { participantId: 'B', netMinor: -5000, net: -50 },
    ]
    const settlements = calculateSettlements(balances)
    expect(settlements).toHaveLength(1)
    expect(settlements[0]).toEqual({
      from: 'B',
      to: 'A',
      amount: 50,
      amountInMinorUnits: 5000,
    })
  })

  it('generates direct settlements with no intermediate hops (A +1000, B -600, C -400)', () => {
    const balances = [
      { participantId: 'A', netMinor: 100000, net: 1000 },
      { participantId: 'B', netMinor: -60000, net: -600 },
      { participantId: 'C', netMinor: -40000, net: -400 },
    ]
    const settlements = calculateSettlements(balances)
    expect(settlements).toHaveLength(2)

    // B pays A 600, C pays A 400
    const bToA = settlements.find((s) => s.from === 'B' && s.to === 'A')
    const cToA = settlements.find((s) => s.from === 'C' && s.to === 'A')

    expect(bToA).toBeDefined()
    expect(bToA.amount).toBe(600)
    expect(cToA).toBeDefined()
    expect(cToA.amount).toBe(400)
  })

  it('returns empty settlements array when everyone is perfectly balanced (net = 0)', () => {
    const balances = [
      { participantId: 'A', netMinor: 0, net: 0 },
      { participantId: 'B', netMinor: 0, net: 0 },
      { participantId: 'C', netMinor: 0, net: 0 },
    ]
    const settlements = calculateSettlements(balances)
    expect(settlements).toEqual([])
  })

  it('enforces that nobody pays themselves and no transaction <= 0', () => {
    const balances = [
      { participantId: 'P1', netMinor: 7500, net: 75 },
      { participantId: 'P2', netMinor: 2500, net: 25 },
      { participantId: 'P3', netMinor: -10000, net: -100 },
    ]
    const settlements = calculateSettlements(balances)

    for (const s of settlements) {
      expect(s.from).not.toBe(s.to)
      expect(s.amountInMinorUnits).toBeGreaterThan(0)
      expect(s.amount).toBeGreaterThan(0)
    }
  })
})

describe('Six Core Mathematical Invariants Verification', () => {
  it('satisfies all 6 invariants across varied split types and participants', () => {
    const tripId = 'trip-invariant-test'
    const participants = [
      { id: 'usr-1', tripId, name: 'Alice' },
      { id: 'usr-2', tripId, name: 'Bob' },
      { id: 'usr-3', tripId, name: 'Charlie' },
      { id: 'usr-4', tripId, name: 'Dana' },
    ]

    const expenses = [
      // 1. Equal split: ₹1000 paid by Alice among all 4
      {
        id: 'exp-1',
        tripId,
        amount: 1000,
        amountInMinorUnits: 100000,
        paidBy: 'usr-1',
        participantIds: ['usr-1', 'usr-2', 'usr-3', 'usr-4'],
        splitType: 'equal',
      },
      // 2. Custom split: ₹550 paid by Bob
      {
        id: 'exp-2',
        tripId,
        amount: 550,
        amountInMinorUnits: 55000,
        paidBy: 'usr-2',
        participantIds: ['usr-1', 'usr-2', 'usr-3'],
        splitType: 'custom',
        splitData: {
          customAmounts: {
            'usr-1': 200,
            'usr-2': 150,
            'usr-3': 200,
          },
        },
      },
      // 3. Percentage split: ₹800 paid by Charlie
      {
        id: 'exp-3',
        tripId,
        amount: 800,
        amountInMinorUnits: 80000,
        paidBy: 'usr-3',
        participantIds: ['usr-1', 'usr-4'],
        splitType: 'percentage',
        splitData: {
          percentages: {
            'usr-1': 60,
            'usr-4': 40,
          },
        },
      },
      // 4. Shares split: ₹300 paid by Dana
      {
        id: 'exp-4',
        tripId,
        amount: 300,
        amountInMinorUnits: 30000,
        paidBy: 'usr-4',
        participantIds: ['usr-2', 'usr-3', 'usr-4'],
        splitType: 'shares',
        splitData: {
          shares: {
            'usr-2': 1,
            'usr-3': 2,
            'usr-4': 3,
          },
        },
      },
    ]

    const { totalSpent, totalSpentMinor, balances, balancesList } = calculateBalances(
      tripId,
      expenses,
      participants,
    )

    expect(balances).toBeDefined()

    // Expected total: 1000 + 550 + 800 + 300 = 2650 (265000 paise)
    expect(totalSpent).toBe(2650)
    expect(totalSpentMinor).toBe(265000)

    // INVARIANT 2: sum(all participant owed) === total trip spending
    const sumOwedMinor = sumMinorUnits(balancesList.map((b) => b.owedMinor))
    expect(sumOwedMinor).toBe(totalSpentMinor)

    // INVARIANT 3: sum(all participant paid) === total trip spending
    const sumPaidMinor = sumMinorUnits(balancesList.map((b) => b.paidMinor))
    expect(sumPaidMinor).toBe(totalSpentMinor)

    // INVARIANT 4: sum(all participant net balances) === 0
    const sumNetMinor = sumMinorUnits(balancesList.map((b) => b.netMinor))
    expect(sumNetMinor).toBe(0)

    // Run settlements
    const settlements = calculateSettlements(balancesList)

    // INVARIANT 5: settlement money paid === settlement money received === total positive creditor balance
    const totalSettledMinor = sumMinorUnits(settlements.map((s) => s.amountInMinorUnits))
    const totalPositiveBalanceMinor = sumMinorUnits(
      balancesList.filter((b) => b.netMinor > 0).map((b) => b.netMinor),
    )
    expect(totalSettledMinor).toBe(totalPositiveBalanceMinor)

    // INVARIANT 6: applying settlements reduces every participant's balance to exactly 0
    const finalNetBalances = {}
    for (const b of balancesList) {
      finalNetBalances[b.participantId] = b.netMinor
    }
    for (const s of settlements) {
      finalNetBalances[s.from] += s.amountInMinorUnits
      finalNetBalances[s.to] -= s.amountInMinorUnits
    }
    for (const net of Object.values(finalNetBalances)) {
      expect(net).toBe(0)
    }
  })
})

describe('Digha Benchmark Spreadsheet Verification', () => {
  it('accurately reconciles the real-world Digha trip scenario', () => {
    const { totalSpent, totalSpentMinor, balances, balancesList } = calculateBalances(
      DIGHA_TRIP.id,
      DIGHA_EXPENSES,
      DIGHA_PARTICIPANTS,
    )

    // Total Digha Trip Spending: 600 + 4000 + 850 + 420 + 150 + 1200 = ₹7,220
    expect(totalSpent).toBe(7220)
    expect(totalSpentMinor).toBe(722000)

    // Paid amounts:
    // Pritish (p1): 600 + 850 + 150 = ₹1600
    expect(balances['digha-p1'].paid).toBe(1600)
    // Deba (p2): 4000 + 1200 = ₹5200
    expect(balances['digha-p2'].paid).toBe(5200)
    // Rohan (p3): 420 = ₹420
    expect(balances['digha-p3'].paid).toBe(420)
    // Sibashis (p4): ₹0
    expect(balances['digha-p4'].paid).toBe(0)
    // Sayantan (p5): ₹0
    expect(balances['digha-p5'].paid).toBe(0)
    // Krishnendu (p6): ₹0
    expect(balances['digha-p6'].paid).toBe(0)

    // Invariant 4: Zero-sum balance check
    const netSumMinor = sumMinorUnits(balancesList.map((b) => b.netMinor))
    expect(netSumMinor).toBe(0)

    // Generate settlements
    const settlements = calculateSettlements(balancesList)
    expect(settlements.length).toBeGreaterThan(0)

    // Verify Invariant 6: All balances resolved to exactly 0
    const reconciled = {}
    for (const b of balancesList) {
      reconciled[b.participantId] = b.netMinor
    }
    for (const s of settlements) {
      reconciled[s.from] += s.amountInMinorUnits
      reconciled[s.to] -= s.amountInMinorUnits
    }
    for (const net of Object.values(reconciled)) {
      expect(net).toBe(0)
    }
  })
})

describe('getTripFinancialSummary Store Integration', () => {
  beforeEach(() => {
    useTripStore.getState().resetStore()
    useParticipantStore.getState().resetStore()
    useExpenseStore.getState().resetStore()
  })

  it('runs complete financial pipeline from store data and returns summary', () => {
    const trip = useTripStore.getState().createTrip({
      name: 'Weekend Getaway',
      destination: 'Lonavala',
      startDate: '2026-11-01',
      endDate: '2026-11-03',
      currency: 'INR',
    })

    const pA = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Alice' })
    const pB = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Bob' })

    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Villa Stay',
      amount: 2000,
      paidBy: pA.id,
      participantIds: [pA.id, pB.id],
      splitType: 'equal',
      date: '2026-11-01',
    })

    const summary = getTripFinancialSummary(trip.id)

    expect(summary.totalSpent).toBe(2000)
    expect(summary.paidByParticipant[pA.id]).toBe(2000)
    expect(summary.paidByParticipant[pB.id]).toBe(0)
    expect(summary.balances[pA.id].net).toBe(1000)
    expect(summary.balances[pB.id].net).toBe(-1000)
    expect(summary.settlements).toHaveLength(1)
    expect(summary.settlements[0]).toEqual({
      from: pB.id,
      to: pA.id,
      amount: 1000,
      amountInMinorUnits: 100000,
    })
    expect(summary.invariantsHold).toBe(true)
  })

  it('handles empty tripId gracefully', () => {
    const summary = getTripFinancialSummary(null)
    expect(summary.totalSpent).toBe(0)
    expect(summary.settlements).toEqual([])
  })
})
