import { Trash, Warning } from '@phosphor-icons/react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { useExpenseStore } from '../../../store/useExpenseStore'
import { useUIStore } from '../../../store/useUIStore'
import { formatCurrency } from '../../../utils/formatters'

export function DeleteExpenseModal({ isOpen, onClose, expense, trip }) {
  const deleteExpense = useExpenseStore((s) => s.deleteExpense)
  const showToast = useUIStore((s) => s.showToast)

  if (!expense) return null

  const handleConfirmDelete = () => {
    const desc = expense.description
    deleteExpense(expense.id)
    showToast(`Deleted expense "${desc}".`, 'info')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete this expense?"
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-900">
          <div className="p-2 bg-red-100 rounded-xl shrink-0 text-red-600">
            <Warning className="w-6 h-6" weight="bold" />
          </div>
          <div className="text-sm">
            <p className="font-extrabold text-red-950">
              {expense.description} — {formatCurrency(expense.amount, trip.currency)}
            </p>
            <p className="text-xs text-red-800 mt-1 leading-relaxed">
              This will permanently remove this expense record and update the trip&apos;s calculations.
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-600 leading-relaxed">
          Are you sure you want to remove this expense? This action cannot be undone.
        </p>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-zinc-200">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            icon={Trash}
            onClick={handleConfirmDelete}
            className="w-full sm:w-auto"
          >
            Delete Expense
          </Button>
        </div>
      </div>
    </Modal>
  )
}

