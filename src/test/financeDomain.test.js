import { describe, it, expect } from 'vitest'
import { calculateExpenseSplit } from '../features/finance/domain/calculateExpenseSplit'
import { calculateTripTotals } from '../features/finance/domain/calculateTripTotals'
import { calculateBalances } from '../features/finance/domain/calculateBalances'
import {
  FinanceValidationError,
  SplitMismatchError,
} from '../features/finance/domain/financeErrors'
import { sumMinorUnits } from '../utils/money'

describe('calculateExpenseSplit Domain Engine', () => {
  const participants = [
    { id: 'p1', name: 'Alice', tripId: 'trip-1' },
    { id: 'p2', name: 'Bob', tripId: 'trip-1' },
    { id: 'p3', name: 'Charlie', tripId: 'trip-1' },
  ]

  describe('Equal Split & Deterministic Remainder Rule', () => {
    it('splits evenly when divisible', () => {
      const expense = {
        amount: 600,
        amountInMinorUnits: 60000,
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'equal',
      }
      const split = calculateExpenseSplit(expense, participants)
      expect(split.p1).toBe(20000)
      expect(split.p2).toBe(20000)
      expect(split.p3).toBe(20000)
      expect(sumMinorUnits(Object.values(split))).toBe(60000)
    })

    it('distributes remainder deterministically when splitting ₹100 among 3 people (10000 paise / 3)', () => {
      const expense = {
        amount: 100,
        amountInMinorUnits: 10000,
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'equal',
      }
      // 10000 / 3 = 3333 with remainder 1.
      // Deterministic rule: First participant gets 3334, rest get 3333.
      const split = calculateExpenseSplit(expense, participants)
      expect(split.p1).toBe(3334)
      expect(split.p2).toBe(3333)
      expect(split.p3).toBe(3333)
      expect(sumMinorUnits(Object.values(split))).toBe(10000)
    })

    it('distributes remainder deterministically for ₹100 among 6 people (10000 paise / 6)', () => {
      const sixParticipants = [
        { id: 'a', tripId: 'trip-1' },
        { id: 'b', tripId: 'trip-1' },
        { id: 'c', tripId: 'trip-1' },
        { id: 'd', tripId: 'trip-1' },
        { id: 'e', tripId: 'trip-1' },
        { id: 'f', tripId: 'trip-1' },
      ]
      const expense = {
        amount: 100,
        amountInMinorUnits: 10000,
        participantIds: ['a', 'b', 'c', 'd', 'e', 'f'],
        splitType: 'equal',
      }
      // 10000 / 6 = 1666 quotient, remainder 4.
      // First 4 get 1667, last 2 get 1666.
      const split = calculateExpenseSplit(expense, sixParticipants)
      expect(split.a).toBe(1667)
      expect(split.b).toBe(1667)
      expect(split.c).toBe(1667)
      expect(split.d).toBe(1667)
      expect(split.e).toBe(1666)
      expect(split.f).toBe(1666)
      expect(sumMinorUnits(Object.values(split))).toBe(10000)
    })

    it('handles minimal 1 rupee split (100 paise / 3)', () => {
      const expense = {
        amount: 1,
        amountInMinorUnits: 100,
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'equal',
      }
      const split = calculateExpenseSplit(expense, participants)
      expect(split.p1).toBe(34)
      expect(split.p2).toBe(33)
      expect(split.p3).toBe(33)
      expect(sumMinorUnits(Object.values(split))).toBe(100)
    })

    it('handles minimal 1 paisa edge case (1 paise / 2 people)', () => {
      const expense = {
        amount: 0.01,
        amountInMinorUnits: 1,
        participantIds: ['p1', 'p2'],
        splitType: 'equal',
      }
      const split = calculateExpenseSplit(expense, participants)
      expect(split.p1).toBe(1)
      expect(split.p2).toBe(0)
      expect(sumMinorUnits(Object.values(split))).toBe(1)
    })
  })

  describe('Selected People Split', () => {
    it('restricts obligation strictly to selected participants', () => {
      const expense = {
        amount: 1200,
        amountInMinorUnits: 120000,
        participantIds: ['p1', 'p3'], // only p1 and p3
        splitType: 'equal',
      }
      const split = calculateExpenseSplit(expense, participants)
      expect(split.p1).toBe(60000)
      expect(split.p3).toBe(60000)
      expect(split.p2).toBeUndefined()
      expect(sumMinorUnits(Object.values(split))).toBe(120000)
    })
  })

  describe('Custom Amounts Split', () => {
    it('accepts valid custom amounts that exactly match the expense total', () => {
      const expense = {
        amount: 1500,
        amountInMinorUnits: 150000,
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'custom',
        splitData: {
          customAmounts: {
            p1: 700,
            p2: 500,
            p3: 300,
          },
        },
      }
      const split = calculateExpenseSplit(expense, participants)
      expect(split.p1).toBe(70000)
      expect(split.p2).toBe(50000)
      expect(split.p3).toBe(30000)
      expect(sumMinorUnits(Object.values(split))).toBe(150000)
    })

    it('rejects custom split when amounts do not equal total', () => {
      const expense = {
        amount: 1500,
        amountInMinorUnits: 150000,
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'custom',
        splitData: {
          customAmounts: {
            p1: 700,
            p2: 500,
            p3: 200, // total 1400 instead of 1500
          },
        },
      }
      expect(() => calculateExpenseSplit(expense, participants)).toThrow(SplitMismatchError)
    })

    it('rejects negative custom amounts or missing participant entry', () => {
      const expense = {
        amount: 500,
        amountInMinorUnits: 50000,
        participantIds: ['p1', 'p2'],
        splitType: 'custom',
        splitData: {
          customAmounts: {
            p1: -100,
            p2: 600,
          },
        },
      }
      expect(() => calculateExpenseSplit(expense, participants)).toThrow(FinanceValidationError)
    })
  })

  describe('Percentage Split', () => {
    it('accurately converts percentages to integer minor units', () => {
      const expense = {
        amount: 1000,
        amountInMinorUnits: 100000,
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'percentage',
        splitData: {
          percentages: {
            p1: 50,
            p2: 30,
            p3: 20,
          },
        },
      }
      const split = calculateExpenseSplit(expense, participants)
      expect(split.p1).toBe(50000)
      expect(split.p2).toBe(30000)
      expect(split.p3).toBe(20000)
      expect(sumMinorUnits(Object.values(split))).toBe(100000)
    })

    it('distributes rounding remainder for percentage split (33.33% / 33.33% / 33.34%)', () => {
      const expense = {
        amount: 100,
        amountInMinorUnits: 10000,
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'percentage',
        splitData: {
          percentages: {
            p1: 33.33,
            p2: 33.33,
            p3: 33.34,
          },
        },
      }
      const split = calculateExpenseSplit(expense, participants)
      expect(sumMinorUnits(Object.values(split))).toBe(10000)
    })

    it('rejects percentage total != 100', () => {
      const expense = {
        amount: 500,
        amountInMinorUnits: 50000,
        participantIds: ['p1', 'p2'],
        splitType: 'percentage',
        splitData: {
          percentages: {
            p1: 60,
            p2: 30, // 90% total
          },
        },
      }
      expect(() => calculateExpenseSplit(expense, participants)).toThrow(SplitMismatchError)
    })
  })

  describe('Shares Split', () => {
    it('splits based on share ratios', () => {
      const expense = {
        amount: 1000,
        amountInMinorUnits: 100000,
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'shares',
        splitData: {
          shares: {
            p1: 1,
            p2: 2,
            p3: 1,
          },
        },
      }
      // Total shares = 4. p1 -> 250, p2 -> 500, p3 -> 250.
      const split = calculateExpenseSplit(expense, participants)
      expect(split.p1).toBe(25000)
      expect(split.p2).toBe(50000)
      expect(split.p3).toBe(25000)
      expect(sumMinorUnits(Object.values(split))).toBe(100000)
    })

    it('distributes rounding remainder when shares do not divide cleanly', () => {
      const expense = {
        amount: 100,
        amountInMinorUnits: 10000,
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'shares',
        splitData: {
          shares: {
            p1: 1,
            p2: 1,
            p3: 1,
          },
        },
      }
      const split = calculateExpenseSplit(expense, participants)
      expect(sumMinorUnits(Object.values(split))).toBe(10000)
    })

    it('rejects shares total <= 0', () => {
      const expense = {
        amount: 100,
        amountInMinorUnits: 10000,
        participantIds: ['p1', 'p2'],
        splitType: 'shares',
        splitData: {
          shares: {
            p1: 0,
            p2: 0,
          },
        },
      }
      expect(() => calculateExpenseSplit(expense, participants)).toThrow(FinanceValidationError)
    })
  })

  describe('Validation & Edge Cases', () => {
    it('rejects foreign participant ID not belonging to trip', () => {
      const expense = {
        amount: 500,
        amountInMinorUnits: 50000,
        participantIds: ['p1', 'unknown-stranger'],
        splitType: 'equal',
      }
      expect(() => calculateExpenseSplit(expense, participants)).toThrow(FinanceValidationError)
    })

    it('rejects empty participant list', () => {
      const expense = {
        amount: 500,
        amountInMinorUnits: 50000,
        participantIds: [],
        splitType: 'equal',
      }
      expect(() => calculateExpenseSplit(expense, participants)).toThrow(FinanceValidationError)
    })

    it('rejects non-positive amount', () => {
      const expense = {
        amount: 0,
        amountInMinorUnits: 0,
        participantIds: ['p1'],
        splitType: 'equal',
      }
      expect(() => calculateExpenseSplit(expense, participants)).toThrow(FinanceValidationError)
    })
  })
})

describe('calculateTripTotals & calculateBalances Engine', () => {
  const participants = [
    { id: 'p1', name: 'Alice', tripId: 'trip-1' },
    { id: 'p2', name: 'Bob', tripId: 'trip-1' },
    { id: 'p3', name: 'Charlie', tripId: 'trip-1' },
  ]

  it('calculates total spent and paid by each participant', () => {
    const expenses = [
      {
        id: 'e1',
        tripId: 'trip-1',
        amount: 1000,
        amountInMinorUnits: 100000,
        paidBy: 'p1',
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'equal',
      },
      {
        id: 'e2',
        tripId: 'trip-1',
        amount: 500,
        amountInMinorUnits: 50000,
        paidBy: 'p2',
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'equal',
      },
    ]

    const totals = calculateTripTotals('trip-1', expenses, participants)
    expect(totals.totalSpent).toBe(1500)
    expect(totals.totalSpentMinor).toBe(150000)
    expect(totals.paidByParticipant.p1).toBe(1000)
    expect(totals.paidByParticipant.p2).toBe(500)
    expect(totals.paidByParticipant.p3).toBe(0)
  })

  it('isolates expenses between trips in calculateTripTotals', () => {
    const expenses = [
      {
        id: 'e1',
        tripId: 'trip-1',
        amount: 1000,
        amountInMinorUnits: 100000,
        paidBy: 'p1',
        participantIds: ['p1'],
        splitType: 'equal',
      },
      {
        id: 'e2',
        tripId: 'trip-OTHER',
        amount: 9999,
        amountInMinorUnits: 999900,
        paidBy: 'p1',
        participantIds: ['p1'],
        splitType: 'equal',
      },
    ]

    const totals = calculateTripTotals('trip-1', expenses, participants)
    expect(totals.totalSpent).toBe(1000)
    expect(totals.totalSpentMinor).toBe(100000)
  })

  it('calculates paid, owed, and net balance with zero-sum invariant', () => {
    // Expense: Alice pays ₹900, shared equally by Alice, Bob, Charlie (₹300 each)
    const expenses = [
      {
        id: 'e1',
        tripId: 'trip-1',
        amount: 900,
        amountInMinorUnits: 90000,
        paidBy: 'p1',
        participantIds: ['p1', 'p2', 'p3'],
        splitType: 'equal',
      },
    ]

    const { totalSpent, balances } = calculateBalances('trip-1', expenses, participants)

    expect(totalSpent).toBe(900)

    // Alice: paid 900, owes 300 -> net +600 (receives)
    expect(balances.p1.paid).toBe(900)
    expect(balances.p1.owed).toBe(300)
    expect(balances.p1.net).toBe(600)
    expect(balances.p1.status).toBe('receives')

    // Bob: paid 0, owes 300 -> net -300 (owes)
    expect(balances.p2.paid).toBe(0)
    expect(balances.p2.owed).toBe(300)
    expect(balances.p2.net).toBe(-300)
    expect(balances.p2.status).toBe('owes')

    // Charlie: paid 0, owes 300 -> net -300 (owes)
    expect(balances.p3.paid).toBe(0)
    expect(balances.p3.owed).toBe(300)
    expect(balances.p3.net).toBe(-300)
    expect(balances.p3.status).toBe('owes')

    // Sum of net balances MUST equal 0
    const netSum = balances.p1.netMinor + balances.p2.netMinor + balances.p3.netMinor
    expect(netSum).toBe(0)
  })

  it('handles scenario where participant paid but owes nothing', () => {
    // Alice pays ₹500 for Bob and Charlie (Alice does not share)
    const expenses = [
      {
        id: 'e1',
        tripId: 'trip-1',
        amount: 500,
        amountInMinorUnits: 50000,
        paidBy: 'p1',
        participantIds: ['p2', 'p3'],
        splitType: 'equal',
      },
    ]

    const { balances } = calculateBalances('trip-1', expenses, participants)
    expect(balances.p1.paid).toBe(500)
    expect(balances.p1.owed).toBe(0)
    expect(balances.p1.net).toBe(500)
    expect(balances.p1.status).toBe('receives')
  })

  it('handles scenario where trip has zero expenses', () => {
    const { totalSpent, totalSpentMinor, balancesList } = calculateBalances(
      'trip-1',
      [],
      participants,
    )
    expect(totalSpent).toBe(0)
    expect(totalSpentMinor).toBe(0)
    expect(balancesList).toHaveLength(3)
    balancesList.forEach((b) => {
      expect(b.paid).toBe(0)
      expect(b.owed).toBe(0)
      expect(b.net).toBe(0)
      expect(b.status).toBe('settled')
    })
  })
})

