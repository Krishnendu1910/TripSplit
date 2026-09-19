import { toMinorUnits, fromMinorUnits, sumMinorUnits } from '../../../utils/money'
import { FinanceValidationError } from './financeErrors'

/**
 * Pure function that calculates total trip spending and total amount paid
 * by each participant for a given trip.
 *
 * Guarantees Invariant 3:
 * sum(Object.values(paidByParticipantMinor)) === totalSpentMinor
 *
 * @param {string} tripId
 * @param {Array<Object>} expenses - List of expenses (can include multiple trips; will filter)
 * @param {Array<Object>} participants - List of participants belonging to the trip
 * @returns {{
 *   totalSpent: number,
 *   totalSpentMinor: number,
 *   paidByParticipant: Record<string, number>,
 *   paidByParticipantMinor: Record<string, number>
 * }}
 */
export function calculateTripTotals(tripId, expenses = [], participants = []) {
  if (!tripId || typeof tripId !== 'string') {
    throw new FinanceValidationError('Valid tripId is required to calculate trip totals')
  }

  const tripParticipants = participants.filter((p) => !p.tripId || p.tripId === tripId)
  const tripExpenses = expenses.filter((e) => e.tripId === tripId)

  const paidByParticipantMinor = {}
  const paidByParticipant = {}

  // Initialize every participant with 0 paid
  for (const p of tripParticipants) {
    paidByParticipantMinor[p.id] = 0
    paidByParticipant[p.id] = 0
  }

  let totalSpentMinor = 0
  const validParticipantIds = new Set(tripParticipants.map((p) => p.id))

  for (const exp of tripExpenses) {
    const minorUnits =
      typeof exp.amountInMinorUnits === 'number'
        ? exp.amountInMinorUnits
        : toMinorUnits(exp.amount)

    totalSpentMinor += minorUnits

    if (exp.paidBy) {
      if (tripParticipants.length > 0 && !validParticipantIds.has(exp.paidBy)) {
        throw new FinanceValidationError(
          `Expense payer ${exp.paidBy} does not belong to the trip squad`,
          { payerId: exp.paidBy, tripId },
        )
      }
      paidByParticipantMinor[exp.paidBy] =
        (paidByParticipantMinor[exp.paidBy] || 0) + minorUnits
    }
  }

  // Convert to major units
  for (const [id, minor] of Object.entries(paidByParticipantMinor)) {
    paidByParticipant[id] = fromMinorUnits(minor)
  }

  const totalSpent = fromMinorUnits(totalSpentMinor)

  // Enforce Invariant 3: sum(paid) === totalSpent
  const actualPaidTotalMinor = sumMinorUnits(Object.values(paidByParticipantMinor))
  if (actualPaidTotalMinor !== totalSpentMinor) {
    throw new FinanceValidationError(
      `Internal invariant violated: total paid (${actualPaidTotalMinor}) does not match total spent (${totalSpentMinor})`,
    )
  }

  return {
    totalSpent,
    totalSpentMinor,
    paidByParticipant,
    paidByParticipantMinor,
  }
}

