import { useMemo } from 'react'
import { useExpenseStore } from '../../../store/useExpenseStore'
import { useParticipantStore } from '../../../store/useParticipantStore'
import { getTripFinancialSummary } from '../index'

/**
 * Custom React hook that subscribes to trip expense and participant changes
 * in Zustand and returns the memoized financial summary for the trip.
 *
 * Ensures that whenever an expense or participant is added, edited, or deleted,
 * the financial summary recalculates automatically without full page reloads.
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
export function useTripFinancialSummary(tripId) {
  const expenses = useExpenseStore((s) => s.expenses)
  const participants = useParticipantStore((s) => s.participants)

  return useMemo(() => {
    return getTripFinancialSummary(tripId)
    // expenses and participants are required to trigger re-computation on store changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, expenses, participants])
}
