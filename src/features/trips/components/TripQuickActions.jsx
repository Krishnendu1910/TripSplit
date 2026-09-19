import { Plus, UserPlus, Receipt, Scales } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'

/**
 * Clean quick actions bar for the trip overview command center.
 * Gives immediate 1-click access to log expenses, invite people, or settle up.
 *
 * @param {{
 *   trip: Object,
 *   onAddExpense: () => void,
 *   onAddPerson: () => void
 * }} props
 */
export function TripQuickActions({
  trip,
  onAddExpense,
  onAddPerson,
}) {
  return (
    <Card className="p-4 sm:p-5 bg-white border-2 border-zinc-900 shadow-playful">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-black text-zinc-900 tracking-tight">
            Quick Actions
          </h3>
          <p className="text-xs text-zinc-500 font-medium">
            Common squad tasks for this trip
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={onAddExpense}
          >
            + Add Expense
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={UserPlus}
            onClick={onAddPerson}
          >
            + Add Person
          </Button>

          <Button
            to={`/trips/${trip.id}/expenses`}
            variant="ghost"
            size="sm"
            icon={Receipt}
            aria-label="View expenses"
          >
            View Expenses
          </Button>

          <Button
            to={`/trips/${trip.id}/settlement`}
            variant="ghost"
            size="sm"
            icon={Scales}
            aria-label="Settle up"
          >
            Settle Up
          </Button>
        </div>
      </div>
    </Card>
  )
}
