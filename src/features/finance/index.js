import { calculateExpenseSplit } from './domain/calculateExpenseSplit'
import { calculateTripTotals } from './domain/calculateTripTotals'
import { calculateBalances } from './domain/calculateBalances'
import { calculateSettlements } from './domain/calculateSettlements'
import { FinanceValidationError, SplitMismatchError } from './domain/financeErrors'
import { useTripFinancialSummary } from './hooks/useTripFinancialSummary'
import { useParticipantStore } from '../../store/useParticipantStore'
import { useExpenseStore } from '../../store/useExpenseStore'

export {
  calculateExpenseSplit,
  calculateTripTotals,
  calculateBalances,
  calculateSettlements,
  useTripFinancialSummary,
  FinanceValidationError,
  SplitMismatchError,
}

/**
 * Convenience query that reads the current store state for a trip,
 * executes the pure financial calculation pipeline, and returns the
 * complete financial summary.
 *
 * @param {string} tripId
 * @returns {{
 *   tripId: string,
 *   totalSpent: number,
 *   totalSpentMinor: number,
 *   paidByParticipant: Record<string, number>,
 *   balances: Record<string, Object>,
 *   balancesList: Array<Object>,
 *   settlements: Array<Object>,
 *   invariantsHold: boolean
 * }}
 */
export function getTripFinancialSummary(tripId) {
  if (!tripId) {
    return {
      tripId: '',
      totalSpent: 0,
      totalSpentMinor: 0,
      paidByParticipant: {},
      balances: {},
      balancesList: [],
      settlements: [],
      invariantsHold: true,
    }
  }

  const participants = useParticipantStore.getState().getParticipantsByTrip(tripId)
  const expenses = useExpenseStore.getState().getExpensesByTrip(tripId)

  try {
    const { totalSpent, totalSpentMinor, paidByParticipant } = calculateTripTotals(
      tripId,
      expenses,
      participants,
    )

    const { balances, balancesList } = calculateBalances(tripId, expenses, participants)
    const settlements = calculateSettlements(balancesList)

    return {
      tripId,
      totalSpent,
      totalSpentMinor,
      paidByParticipant,
      balances,
      balancesList,
      settlements,
      invariantsHold: true,
    }
  } catch {
    return {
      tripId,
      totalSpent: 0,
      totalSpentMinor: 0,
      paidByParticipant: {},
      balances: {},
      balancesList: [],
      settlements: [],
      invariantsHold: false,
    }
  }
}
