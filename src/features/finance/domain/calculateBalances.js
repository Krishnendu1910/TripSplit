import { fromMinorUnits, sumMinorUnits } from '../../../utils/money'
import { calculateExpenseSplit } from './calculateExpenseSplit'
import { calculateTripTotals } from './calculateTripTotals'
import { FinanceValidationError } from './financeErrors'

/**
 * Pure function that calculates paid, owed, and net balance for every participant
 * in a trip.
 *
 * Mathematical Invariants:
 * Invariant 2: sum(all participant owed amounts) === total trip spending
 * Invariant 3: sum(all participant paid amounts) === total trip spending
 * Invariant 4: sum(all participant net balances) === 0 (Critical zero-sum invariant)
 *
 * @param {string} tripId
 * @param {Array<Object>} expenses - List of trip expenses
 * @param {Array<Object>} participants - List of trip participants
 * @returns {{
 *   totalSpent: number,
 *   totalSpentMinor: number,
 *   balances: Record<string, {
 *     participantId: string,
 *     name: string,
 *     paidMinor: number,
 *     paid: number,
 *     owedMinor: number,
 *     owed: number,
 *     netMinor: number,
 *     net: number,
 *     status: 'receives' | 'owes' | 'settled'
 *   }>,
 *   balancesList: Array<Object>
 * }}
 */
export function calculateBalances(tripId, expenses = [], participants = []) {
  if (!tripId || typeof tripId !== 'string') {
    throw new FinanceValidationError('Valid tripId is required to calculate balances')
  }

  const tripParticipants = participants.filter((p) => !p.tripId || p.tripId === tripId)
  const tripExpenses = expenses.filter((e) => e.tripId === tripId)

  // 1. Calculate trip totals & paid amounts
  const { totalSpent, totalSpentMinor, paidByParticipantMinor } = calculateTripTotals(
    tripId,
    tripExpenses,
    tripParticipants,
  )

  // 2. Initialize owed amounts for every participant
  const owedByParticipantMinor = {}
  for (const p of tripParticipants) {
    owedByParticipantMinor[p.id] = 0
  }

  // 3. Accumulate expense splits
  for (const exp of tripExpenses) {
    const allocations = calculateExpenseSplit(exp, tripParticipants)
    for (const [pId, shareMinor] of Object.entries(allocations)) {
      owedByParticipantMinor[pId] = (owedByParticipantMinor[pId] || 0) + shareMinor
    }
  }

  // 4. Enforce Invariant 2: sum(owed) === totalSpent
  const actualOwedTotalMinor = sumMinorUnits(Object.values(owedByParticipantMinor))
  if (actualOwedTotalMinor !== totalSpentMinor) {
    throw new FinanceValidationError(
      `Internal invariant violated: sum of obligations (${actualOwedTotalMinor}) does not match total spent (${totalSpentMinor})`,
    )
  }

  // 5. Build balance records
  const balances = {}
  const balancesList = []

  for (const p of tripParticipants) {
    const paidMinor = paidByParticipantMinor[p.id] || 0
    const owedMinor = owedByParticipantMinor[p.id] || 0
    const netMinor = paidMinor - owedMinor

    let status = 'settled'
    if (netMinor > 0) {
      status = 'receives'
    } else if (netMinor < 0) {
      status = 'owes'
    }

    const record = {
      participantId: p.id,
      name: p.name || 'Anonymous',
      paidMinor,
      paid: fromMinorUnits(paidMinor),
      owedMinor,
      owed: fromMinorUnits(owedMinor),
      netMinor,
      net: fromMinorUnits(netMinor),
      status,
    }

    balances[p.id] = record
    balancesList.push(record)
  }

  // 6. Enforce Invariant 4: sum(netMinor) === 0
  const netSumMinor = sumMinorUnits(balancesList.map((b) => b.netMinor))
  if (netSumMinor !== 0) {
    throw new FinanceValidationError(
      `Internal invariant violated: sum of net balances (${netSumMinor}) is not zero`,
    )
  }

  // Sort list: creditors first (highest net descending), then debtors (most negative last), tie-break by ID
  balancesList.sort((a, b) => {
    if (b.netMinor !== a.netMinor) {
      return b.netMinor - a.netMinor
    }
    return a.participantId.localeCompare(b.participantId)
  })

  return {
    totalSpent,
    totalSpentMinor,
    balances,
    balancesList,
  }
}

