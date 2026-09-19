import { useState } from 'react'
import { Receipt, Plus, Sparkle, PencilSimple, Trash } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatCurrency } from '../../../utils/formatters'
import { useExpenseStore } from '../../../store/useExpenseStore'
import { useParticipantStore } from '../../../store/useParticipantStore'
import { AddExpenseModal } from './AddExpenseModal'
import { EditExpenseModal } from './EditExpenseModal'
import { DeleteExpenseModal } from './DeleteExpenseModal'

export function ExpensesList({ trip }) {
  const allExpenses = useExpenseStore((s) => s.expenses)
  const realExpenses = allExpenses.filter((e) => e.tripId === trip.id)
  const totalSpent = useExpenseStore((s) => s.getTotalSpentByTrip(trip.id))

  const allParticipants = useParticipantStore((s) => s.participants)
  const tripParticipants = allParticipants.filter((p) => p.tripId === trip.id)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [deletingExpense, setDeletingExpense] = useState(null)

  // Support demo fixture fallback if a demo trip has no real expenses added yet
  const isDemoFallback = trip.isDemo && realExpenses.length === 0 && Array.isArray(trip.sampleExpenses) && trip.sampleExpenses.length > 0
  const displayExpenses = isDemoFallback ? trip.sampleExpenses : realExpenses
  const displayTotal = isDemoFallback
    ? trip.sampleExpenses.reduce((acc, curr) => acc + curr.amount, 0)
    : totalSpent

  const getPayerName = (exp) => {
    if (isDemoFallback) {
      return exp.paidBy || 'Someone'
    }
    const participant = tripParticipants.find((p) => p.id === exp.paidBy)
    return participant ? participant.name : 'Unknown squad member'
  }

  const getParticipantCount = (exp) => {
    if (Array.isArray(exp.participantIds)) {
      return exp.participantIds.length
    }
    return tripParticipants.length || 1
  }

  if (displayExpenses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight uppercase">
              Trip Expenses
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              All recorded group spending. Tap an expense for split details.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Expense
          </Button>
        </div>

        <EmptyState
          icon={Receipt}
          title="No damage reported yet."
          description="Your wallet is holding its breath. Log your group coffee, cab rides, or hotel deposits as they happen."
          actionLabel="Add first expense"
          onAction={() => setIsAddModalOpen(true)}
          badgeText={`${formatCurrency(0, trip.currency)} Spent`}
        />

        <AddExpenseModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          trip={trip}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight uppercase">
              Trip Expenses
            </h2>
            <Badge variant="orange">
              {formatCurrency(displayTotal, trip.currency)} spent
            </Badge>
            <Badge variant="default">
              {displayExpenses.length} {displayExpenses.length === 1 ? 'expense' : 'expenses'}
            </Badge>
          </div>
          <p className="text-sm text-zinc-600 mt-1">
            All recorded group spending. Record the money, TripSplit does the math.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Expense
        </Button>
      </div>

      {isDemoFallback && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 rounded-2xl text-xs font-bold text-amber-900 border border-amber-300">
          <Sparkle className="w-4 h-4 text-amber-600" weight="fill" />
          <span>Showing sample UI expenses. Add a real expense to activate live tracking.</span>
        </div>
      )}

      {/* Expenses List */}
      <div className="space-y-3">
        {displayExpenses.map((exp) => {
          const payerName = getPayerName(exp)
          const sharedCount = getParticipantCount(exp)
          const isReal = !isDemoFallback

          return (
            <Card
              key={exp.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white"
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-orange-100 border-2 border-zinc-900 text-orange-600 flex items-center justify-center font-black shrink-0 shadow-playful-sm mt-0.5 sm:mt-0">
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-zinc-900 break-words line-clamp-1">
                    {exp.description || exp.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-zinc-500 mt-1 font-semibold">
                    {exp.category && (
                      <Badge variant="default" className="text-[10px] py-0.5 capitalize">
                        {exp.category}
                      </Badge>
                    )}
                    <span className="truncate max-w-[180px]">
                      Paid by <strong className="text-zinc-900">{payerName}</strong>
                    </span>
                    <span>•</span>
                    <span>{sharedCount} {sharedCount === 1 ? 'person' : 'people'}</span>
                    {exp.date && (
                      <>
                        <span>•</span>
                        <span>{exp.date}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                <div className="text-left sm:text-right">
                  <span className="text-base sm:text-xl font-black text-zinc-900 block">
                    {formatCurrency(exp.amount, trip.currency)}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-400 block">
                    Split equally
                  </span>
                </div>

                {isReal && (
                  <div className="flex items-center gap-1 pl-2 border-l border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setEditingExpense(exp)}
                      aria-label={`Edit ${exp.description || 'expense'}`}
                      className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                      <PencilSimple className="w-4 h-4" weight="bold" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingExpense(exp)}
                      aria-label={`Delete ${exp.description || 'expense'}`}
                      className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <Trash className="w-4 h-4" weight="bold" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        trip={trip}
      />

      <EditExpenseModal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        trip={trip}
      />

      <DeleteExpenseModal
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        expense={deletingExpense}
        trip={trip}
      />
    </div>
  )
}
