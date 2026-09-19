import { fromMinorUnits, sumMinorUnits } from '../../../utils/money'
import { FinanceValidationError } from './financeErrors'

/**
 * Pure settlement algorithm that computes the minimal / practical set of
 * debt-clearing transactions between participants.
 *
 * Algorithm:
 * 1. Filter participants into Creditors (netMinor > 0) and Debtors (netMinor < 0).
 * 2. Stably sort Creditors descending by amount, tie-breaking by participantId.
 * 3. Stably sort Debtors descending by owed amount, tie-breaking by participantId.
 * 4. Greedily match the largest debtor with the largest creditor, eliminating debt
 *    in the minimum number of direct transactions without intermediate hops.
 *
 * Mathematical Invariants:
 * Invariant 5: total settlement money transferred === sum of all positive net balances
 * Invariant 6: applying all settlement transactions reduces every participant's balance to exactly 0
 *
 * @param {Array<Object>|Record<string, Object>} balancesInput - Output from calculateBalances
 * @returns {Array<{
 *   from: string,
 *   to: string,
 *   amount: number,
 *   amountInMinorUnits: number
 * }>}
 */
export function calculateSettlements(balancesInput) {
  const balanceList = Array.isArray(balancesInput)
    ? balancesInput
    : Object.values(balancesInput || {})

  // 1. Separate into creditors and debtors
  const creditors = []
  const debtors = []
  const simulatedBalances = {}

  for (const b of balanceList) {
    simulatedBalances[b.participantId] = b.netMinor || 0
    if (b.netMinor > 0) {
      creditors.push({
        participantId: b.participantId,
        remainingMinor: b.netMinor,
      })
    } else if (b.netMinor < 0) {
      debtors.push({
        participantId: b.participantId,
        remainingMinor: Math.abs(b.netMinor),
      })
    }
  }

  // 2. Deterministic sorting: largest amounts first, stable ID tie-breaker
  creditors.sort((a, b) => {
    if (b.remainingMinor !== a.remainingMinor) {
      return b.remainingMinor - a.remainingMinor
    }
    return a.participantId.localeCompare(b.participantId)
  })

  debtors.sort((a, b) => {
    if (b.remainingMinor !== a.remainingMinor) {
      return b.remainingMinor - a.remainingMinor
    }
    return a.participantId.localeCompare(b.participantId)
  })

  // 3. Two-pointer greedy settlement matching
  const transactions = []
  let cIndex = 0
  let dIndex = 0

  while (cIndex < creditors.length && dIndex < debtors.length) {
    const creditor = creditors[cIndex]
    const debtor = debtors[dIndex]

    const transferMinor = Math.min(creditor.remainingMinor, debtor.remainingMinor)

    if (transferMinor > 0) {
      if (debtor.participantId === creditor.participantId) {
        throw new FinanceValidationError(
          `Self-settlement detected for participant ${debtor.participantId}`,
        )
      }

      transactions.push({
        from: debtor.participantId,
        to: creditor.participantId,
        amount: fromMinorUnits(transferMinor),
        amountInMinorUnits: transferMinor,
      })

      creditor.remainingMinor -= transferMinor
      debtor.remainingMinor -= transferMinor

      // Apply to simulated balances for invariant verification
      simulatedBalances[debtor.participantId] += transferMinor
      simulatedBalances[creditor.participantId] -= transferMinor
    }

    if (creditor.remainingMinor === 0) {
      cIndex++
    }
    if (debtor.remainingMinor === 0) {
      dIndex++
    }
  }

  // 4. Invariant 5: total settlement money equals total positive net balances
  const totalSettlementMinor = sumMinorUnits(transactions.map((t) => t.amountInMinorUnits))
  const totalCreditorMinor = sumMinorUnits(
    balanceList.filter((b) => b.netMinor > 0).map((b) => b.netMinor),
  )

  if (totalSettlementMinor !== totalCreditorMinor) {
    throw new FinanceValidationError(
      `Internal invariant violated: total settled (${totalSettlementMinor}) does not match total creditor balance (${totalCreditorMinor})`,
    )
  }

  // 5. Invariant 6: after applying settlements, all balances must become exactly zero
  for (const [pId, net] of Object.entries(simulatedBalances)) {
    if (net !== 0) {
      throw new FinanceValidationError(
        `Internal invariant violated: participant ${pId} has non-zero remaining balance (${net}) after settlements applied`,
      )
    }
  }

  return transactions
}

