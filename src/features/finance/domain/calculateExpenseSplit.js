import {
  toMinorUnits,
  fromMinorUnits,
  divideMinor,
  distributeRemainder,
  sumMinorUnits,
} from '../../../utils/money'
import { FinanceValidationError, SplitMismatchError } from './financeErrors'

/**
 * Pure function that calculates the exact amount owed by each participant
 * for a given expense in integer minor units (paise/cents).
 *
 * DETERMINISTIC REMAINDER RULE:
 * When dividing an amount that does not split evenly, the base integer amount
 * is allocated to everyone, and remaining minor units are distributed 1 unit
 * at a time to participants ordered deterministically by stable ID (or fractional weight).
 *
 * Guaranteed Invariant:
 * sum(Object.values(allocations)) === expense.amountInMinorUnits
 *
 * @param {Object} expense - Normalized expense entity
 * @param {Array<Object>} [participants] - List of registered participants in the trip
 * @returns {Record<string, number>} Map of participantId -> obligation in minor units
 */
export function calculateExpenseSplit(expense, participants = []) {
  if (!expense || typeof expense !== 'object') {
    throw new FinanceValidationError('Invalid expense object provided')
  }

  const amountMinor =
    typeof expense.amountInMinorUnits === 'number'
      ? expense.amountInMinorUnits
      : toMinorUnits(expense.amount)

  if (amountMinor <= 0) {
    throw new FinanceValidationError('Expense amount must be a positive number', {
      amount: expense.amount,
      amountMinor,
    })
  }

  // Deduplicate and stably sort participant IDs
  const rawParticipantIds = Array.isArray(expense.participantIds)
    ? expense.participantIds
    : []
  const sortedParticipantIds = Array.from(
    new Set(rawParticipantIds.filter((id) => typeof id === 'string' && id.trim())),
  ).sort()

  if (sortedParticipantIds.length === 0) {
    throw new FinanceValidationError('Expense must have at least one participating squad member', {
      expenseId: expense.id,
    })
  }

  // Validate that all participants belong to the trip if participants context is provided
  if (Array.isArray(participants) && participants.length > 0) {
    const validIds = new Set(participants.map((p) => p.id))
    for (const pId of sortedParticipantIds) {
      if (!validIds.has(pId)) {
        throw new FinanceValidationError(
          `Participant ${pId} does not belong to the trip squad`,
          { participantId: pId, expenseId: expense.id },
        )
      }
    }
  }

  const splitType = expense.splitType || 'equal'
  let allocations = {}

  switch (splitType) {
    case 'equal': {
      const { quotient, remainder } = divideMinor(
        amountMinor,
        sortedParticipantIds.length,
      )
      allocations = distributeRemainder(quotient, remainder, sortedParticipantIds)
      break
    }

    case 'custom': {
      const customAmounts = expense.splitData?.customAmounts || {}
      let totalCustomMinor = 0

      for (const pId of sortedParticipantIds) {
        const val = customAmounts[pId]
        if (val === undefined || val === null || typeof val !== 'number' || isNaN(val) || val < 0) {
          throw new FinanceValidationError(
            `Invalid custom amount specified for participant ${pId}`,
            { participantId: pId, value: val },
          )
        }
        const pMinor = toMinorUnits(val)
        allocations[pId] = pMinor
        totalCustomMinor += pMinor
      }

      // Check for extraneous participants with positive custom amounts
      for (const [key, val] of Object.entries(customAmounts)) {
        if (!sortedParticipantIds.includes(key) && typeof val === 'number' && val > 0) {
          throw new FinanceValidationError(
            `Custom amount provided for participant ${key} who is not selected for this expense`,
            { participantId: key, value: val },
          )
        }
      }

      if (totalCustomMinor !== amountMinor) {
        throw new SplitMismatchError(
          `Custom split total (${fromMinorUnits(totalCustomMinor)}) must exactly equal the expense amount (${fromMinorUnits(amountMinor)})`,
          {
            expectedMinor: amountMinor,
            actualMinor: totalCustomMinor,
            differenceMinor: amountMinor - totalCustomMinor,
          },
        )
      }
      break
    }

    case 'percentage': {
      const percentages = expense.splitData?.percentages || {}
      let totalPercentage = 0

      for (const pId of sortedParticipantIds) {
        const pct = percentages[pId]
        if (pct === undefined || pct === null || typeof pct !== 'number' || isNaN(pct) || pct < 0 || pct > 100) {
          throw new FinanceValidationError(
            `Invalid percentage specified for participant ${pId}: must be between 0 and 100`,
            { participantId: pId, percentage: pct },
          )
        }
        totalPercentage += pct
      }

      // Percentage sum must be exactly 100% (allowing tiny float tolerance like 99.999 to 100.001)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new SplitMismatchError(
          `Total percentage must equal exactly 100% (current sum: ${totalPercentage}%)`,
          { totalPercentage },
        )
      }

      // Calculate base allocations and fractional remainders
      const items = []
      let allocatedMinor = 0

      for (const pId of sortedParticipantIds) {
        const pct = percentages[pId]
        const rawAmount = (amountMinor * pct) / 100
        const baseMinor = Math.floor(rawAmount)
        const fraction = rawAmount - baseMinor
        items.push({ id: pId, baseMinor, fraction })
        allocatedMinor += baseMinor
      }

      const remainderMinor = amountMinor - allocatedMinor

      // Sort items by fractional part descending, tie-breaking by stable ID
      items.sort((a, b) => {
        if (Math.abs(b.fraction - a.fraction) > 0.000001) {
          return b.fraction - a.fraction
        }
        return a.id.localeCompare(b.id)
      })

      // Distribute remainder
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const extra = i < remainderMinor ? 1 : 0
        allocations[item.id] = item.baseMinor + extra
      }
      break
    }

    case 'shares': {
      const shares = expense.splitData?.shares || {}
      let totalShares = 0

      for (const pId of sortedParticipantIds) {
        const s = shares[pId] !== undefined ? shares[pId] : 1
        if (typeof s !== 'number' || isNaN(s) || s < 0) {
          throw new FinanceValidationError(
            `Invalid share count for participant ${pId}: must be a non-negative number`,
            { participantId: pId, shares: s },
          )
        }
        totalShares += s
      }

      if (totalShares <= 0) {
        throw new FinanceValidationError('Total shares must be greater than 0', {
          totalShares,
        })
      }

      const items = []
      let allocatedMinor = 0

      for (const pId of sortedParticipantIds) {
        const s = shares[pId] !== undefined ? shares[pId] : 1
        const rawAmount = (amountMinor * s) / totalShares
        const baseMinor = Math.floor(rawAmount)
        const fraction = rawAmount - baseMinor
        items.push({ id: pId, baseMinor, fraction })
        allocatedMinor += baseMinor
      }

      const remainderMinor = amountMinor - allocatedMinor

      // Sort items by fractional part descending, tie-breaking by stable ID
      items.sort((a, b) => {
        if (Math.abs(b.fraction - a.fraction) > 0.000001) {
          return b.fraction - a.fraction
        }
        return a.id.localeCompare(b.id)
      })

      // Distribute remainder
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const extra = i < remainderMinor ? 1 : 0
        allocations[item.id] = item.baseMinor + extra
      }
      break
    }

    default:
      throw new FinanceValidationError(`Unsupported split type: ${splitType}`)
  }

  // Enforce Invariant 1: sum(allocations) === expense.amount
  const actualTotal = sumMinorUnits(Object.values(allocations))
  if (actualTotal !== amountMinor) {
    throw new SplitMismatchError(
      `Internal calculation error: allocated total (${actualTotal}) does not match expense amount (${amountMinor})`,
      { expected: amountMinor, actual: actualTotal },
    )
  }

  return allocations
}

