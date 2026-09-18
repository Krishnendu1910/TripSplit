import { useState } from 'react'
import { Receipt, Plus, Sparkle } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatCurrency } from '../../../utils/formatters'
import { useUIStore } from '../../../store/useUIStore'

export function ExpensesList({ trip }) {
  const [showEmptyOverride, setShowEmptyOverride] = useState(false)
  const showToast = useUIStore((s) => s.showToast)
  const expenses = trip.sampleExpenses || []

  const handleAddExpenseClick = () => {
    showToast('Expense creation engine launches in Phase 2!', 'info')
  }

  if (showEmptyOverride || expenses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmptyOverride(false)}
            className="text-xs"
          >
            Show demo expenses
          </Button>
        </div>
        <EmptyState
          icon={Receipt}
          title="No damage reported yet."
          description="Your wallet is holding its breath. Log your group coffee, cab rides, or hotel deposits as they happen."
          actionLabel="Add first expense"
          onAction={handleAddExpenseClick}
          badgeText="₹0 Spent"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
            Trip Expenses
          </h2>
          <p className="text-sm text-zinc-600">
            All recorded group spending. Tap an expense for split details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmptyOverride(true)}
            className="text-xs"
          >
            Toggle Empty State
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleAddExpenseClick}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {trip.isDemo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 rounded-2xl text-xs font-bold text-amber-900 border border-amber-300">
          <Sparkle className="w-4 h-4 text-amber-600" weight="fill" />
          <span>Showing sample UI expenses. Split algorithms activate in Phase 2.</span>
        </div>
      )}

      {/* Expenses Cards List */}
      <div className="space-y-3">
        {expenses.map((exp) => (
          <Card key={exp.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 border-2 border-zinc-900 text-orange-600 flex items-center justify-center font-black shrink-0 shadow-playful-sm">
                <Receipt className="w-6 h-6" weight="bold" />
              </div>
              <div>
                <h4 className="text-base font-black text-zinc-900">{exp.title}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mt-1 font-semibold">
                  <Badge variant="default" className="text-[10px] py-0.5">
                    {exp.category}
                  </Badge>
                  <span>Paid by <strong className="text-zinc-800">{exp.paidBy}</strong></span>
                  <span>•</span>
                  <span>{exp.date}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-lg sm:text-xl font-black text-zinc-900 block">
                {formatCurrency(exp.amount, trip.currency)}
              </span>
              <span className="text-[11px] font-bold text-zinc-400">
                Split equally (demo)
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
