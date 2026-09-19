import { useState } from 'react'
import {
  CheckCircle,
  Receipt,
  Coins,
  Sparkle,
} from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatCurrency } from '../../../utils/formatters'
import { useUIStore } from '../../../store/useUIStore'
import { useExpenseStore } from '../../../store/useExpenseStore'
import { useTripFinancialSummary } from '../../finance'
import { useSettlementStore } from '../store/useSettlementStore'
import { BalanceOverview } from './BalanceOverview'
import { SettlementList } from './SettlementList'
import { ParticipantBalanceList } from './ParticipantBalanceList'
import { AddExpenseModal } from '../../expenses/components/AddExpenseModal'

/**
 * Main container for the Settle Up experience.
 * Consumes pure financial instructions from useTripFinancialSummary
 * and real payment tracking state from useSettlementStore.
 *
 * @param {{ trip: Object }} props
 */
export function SettlementSummary({ trip }) {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const showToast = useUIStore((s) => s.showToast)

  // Reactive store consumption
  const allExpenses = useExpenseStore((s) => s.expenses)
  const tripExpenses = allExpenses.filter((e) => e.tripId === trip.id)
  const financialSummary = useTripFinancialSummary(trip.id)

  const { totalSpent, balancesList, balances, settlements } = financialSummary
  const currency = trip.currency || 'INR'

  // Real settlement payment state - subscribe to payments to ensure reactive re-renders
  const payments = useSettlementStore((s) => s.payments)
  const isSettlementPaid = useSettlementStore((s) => s.isSettlementPaid)
  const markSettlementPaid = useSettlementStore((s) => s.markSettlementPaid)

  // Partition settlements into pending and completed using deterministic matching
  const pendingSettlements = settlements.filter((s) => payments && !isSettlementPaid(trip.id, s))
  const completedSettlements = settlements.filter((s) => payments && isSettlementPaid(trip.id, s))
  const pendingCount = pendingSettlements.length

  const handleMarkPaid = (settlement) => {
    markSettlementPaid(trip.id, settlement)
    const fromName = balances[settlement.from]?.name || 'Payer'
    const toName = balances[settlement.to]?.name || 'Receiver'
    const amountStr = formatCurrency(settlement.amount, currency)
    showToast(`Payment of ${amountStr} from ${fromName} to ${toName} marked as recorded!`, 'success')
  }

  // 1. NO EXPENSES EMPTY STATE
  if (tripExpenses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight uppercase">
              Settle Up
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Smart debt simplification: minimal payments to get everyone squared away.
            </p>
          </div>
        </div>

        <EmptyState
          icon={Receipt}
          title="No money drama yet."
          description="Nobody owes anybody... yet. Add your first expense and we'll handle the math."
          actionLabel="Add Expense"
          onAction={() => setIsAddExpenseOpen(true)}
          badgeText="All Settled"
        />

        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          trip={trip}
        />
      </div>
    )
  }

  // 2. FULLY SETTLED STATE
  // Either all net balances are zero, or all generated settlements have been marked paid
  const allBalancesZero = balancesList.every((b) => b.netMinor === 0)
  const isZeroDebtSettled = tripExpenses.length > 0 && settlements.length === 0 && allBalancesZero
  const isAllPaymentsSettled = tripExpenses.length > 0 && settlements.length > 0 && pendingCount === 0
  const isFullySettled = isZeroDebtSettled || isAllPaymentsSettled

  if (isFullySettled) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight uppercase">
              Settle Up
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Smart debt simplification: minimal payments to get everyone squared away.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Card className="px-4 py-2 bg-amber-100/80 border-2 border-zinc-900 shadow-playful-sm">
              <span className="text-xs font-bold text-zinc-500 uppercase mr-2">
                Trip Total
              </span>
              <span className="text-base sm:text-lg font-black text-zinc-900">
                {formatCurrency(totalSpent, currency)}
              </span>
            </Card>
          </div>
        </div>

        {/* Fully Settled Celebratory Banner */}
        <Card className="p-8 text-center bg-teal-50 border-2 border-zinc-900 shadow-playful max-w-xl mx-auto space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-teal-200 border-2 border-zinc-900 text-teal-950 flex items-center justify-center mx-auto shadow-playful-sm">
            <CheckCircle className="w-8 h-8" weight="bold" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
            You&apos;re all settled!
          </h3>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            {isAllPaymentsSettled
              ? 'All settlement payments have been completed. Everyone has squared away their trip obligations!'
              : "Everyone's share matches what they paid. No one owes anyone a single rupee!"}
          </p>
          <div className="pt-2">
            <Badge variant="teal" icon={Sparkle} className="font-extrabold text-xs">
              {isAllPaymentsSettled ? 'All payments recorded' : 'All balances are zero'}
            </Badge>
          </div>
        </Card>

        {/* Completed Payments History (persists and remains visible) */}
        {completedSettlements.length > 0 && (
          <SettlementList
            pendingSettlements={[]}
            completedSettlements={completedSettlements}
            balances={balances}
            currency={currency}
          />
        )}

        {/* Squad Balances Breakdown */}
        <ParticipantBalanceList balancesList={balancesList} currency={currency} />
      </div>
    )
  }

  // 3. ACTIVE PENDING SETTLEMENTS STATE
  return (
    <div className="space-y-6">
      {/* Header and Trip Total */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight uppercase">
              Settle Up
            </h2>
            <Badge variant="yellow" className="font-black text-xs">
              {pendingCount} {pendingCount === 1 ? 'payment' : 'payments'} remaining
            </Badge>
          </div>
          <p className="text-sm text-zinc-600 mt-1">
            Smart debt simplification: minimal payments to get everyone squared away.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Card className="px-4 py-2.5 bg-amber-100 border-2 border-zinc-900 shadow-playful-sm flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-300 border border-zinc-900 flex items-center justify-center">
              <Coins className="w-4 h-4 text-zinc-900" weight="bold" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Trip Total
              </span>
              <span className="text-base sm:text-lg font-black text-zinc-900">
                {formatCurrency(totalSpent, currency)}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Section 1: Who owes vs Who receives */}
      <BalanceOverview balancesList={balancesList} currency={currency} />

      {/* Section 2: Direct settlement transactions (Pending + Completed) */}
      <SettlementList
        pendingSettlements={pendingSettlements}
        completedSettlements={completedSettlements}
        balances={balances}
        currency={currency}
        onMarkPaid={handleMarkPaid}
      />

      {/* Section 3: Squad participant balances */}
      <ParticipantBalanceList balancesList={balancesList} currency={currency} />
    </div>
  )
}
