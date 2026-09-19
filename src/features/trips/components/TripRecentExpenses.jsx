import { Link } from 'react-router-dom'
import {
  Receipt,
  Plus,
  ArrowRight,
  ForkKnife,
  Car,
  Buildings,
  GasPump,
  Ticket,
  Bag,
  BeerBottle,
  Tag,
} from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { formatCurrency } from '../../../utils/formatters'

const CATEGORY_ICONS = {
  food: ForkKnife,
  transport: Car,
  hotel: Buildings,
  fuel: GasPump,
  tickets: Ticket,
  shopping: Bag,
  drinks: BeerBottle,
  activities: Ticket,
  other: Tag,
}

/**
 * Compact Recent Expenses card for the trip overview.
 * Shows the 3-5 latest expenses with payer and date, with empty state and
 * navigation link to the full expenses tab.
 *
 * @param {{
 *   trip: Object,
 *   expenses: Array<Object>,
 *   participants: Array<Object>,
 *   onAddExpense: () => void
 * }} props
 */
export function TripRecentExpenses({
  trip,
  expenses = [],
  participants = [],
  onAddExpense,
}) {
  const currency = trip.currency || 'INR'

  // Sort newest first by date or createdAt
  const sorted = [...expenses].sort((a, b) => {
    const dateA = a.date || a.createdAt || ''
    const dateB = b.date || b.createdAt || ''
    return dateB.localeCompare(dateA)
  })

  const recent = sorted.slice(0, 5)

  const getPayerName = (paidById) => {
    const found = participants.find((p) => p.id === paidById)
    return found?.name || 'Squad member'
  }

  return (
    <Card className="p-5 sm:p-6 bg-white border-2 border-zinc-900 shadow-playful flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b-2 border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 border-2 border-zinc-900 text-purple-900 flex items-center justify-center font-black">
              <Receipt className="w-4 h-4" weight="bold" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                Recent Expenses
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Latest transactions recorded on this trip
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={Plus}
            onClick={onAddExpense}
            className="text-xs font-black"
            aria-label="Add new expense"
          >
            Add
          </Button>
        </div>

        {/* Empty State */}
        {recent.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border-2 border-dashed border-zinc-300 text-purple-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" weight="duotone" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-zinc-800">
                No expenses yet.
              </p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-0.5">
                Start recording what the squad spends on food, fuel, or stays.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={onAddExpense}
              className="text-xs font-black"
            >
              Add Expense
            </Button>
          </div>
        ) : (
          /* Recent Expense Items */
          <ul className="space-y-2.5" aria-label="Recent expenses list">
            {recent.map((exp) => {
              const Icon = CATEGORY_ICONS[exp.category] || Tag
              const payer = getPayerName(exp.paidBy)
              const formattedAmt = formatCurrency(exp.amount, currency)

              return (
                <li
                  key={exp.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-900 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-zinc-300 flex items-center justify-center text-zinc-700 shrink-0">
                      <Icon className="w-4 h-4" weight="bold" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black text-zinc-900 truncate">
                        {exp.description}
                      </p>
                      <p className="text-[11px] font-medium text-zinc-500 truncate">
                        Paid by <span className="font-bold text-zinc-800">{payer}</span>
                        {exp.date && ` · ${exp.date}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span className="text-xs sm:text-sm font-black text-zinc-900">
                      {formattedAmt}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Footer Link */}
      {expenses.length > 0 && (
        <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400">
            {expenses.length} {expenses.length === 1 ? 'total expense' : 'total expenses'}
          </span>
          <Link
            to={`/trips/${trip.id}/expenses`}
            className="inline-flex items-center gap-1 text-xs font-black text-purple-700 hover:text-purple-900 hover:underline"
          >
            <span>View all expenses</span>
            <ArrowRight className="w-3.5 h-3.5" weight="bold" />
          </Link>
        </div>
      )}
    </Card>
  )
}
