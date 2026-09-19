import { Link } from 'react-router-dom'
import { Receipt, Users, Coins } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { formatCurrency } from '../../../utils/formatters'

/**
 * Compact visual metrics tiles displaying real trip stats:
 * Total spent, Number of expenses, and Number of people.
 *
 * @param {{
 *   trip: Object,
 *   totalSpent: number,
 *   expensesCount: number,
 *   peopleCount: number
 * }} props
 */
export function TripStatsTiles({
  trip,
  totalSpent,
  expensesCount,
  peopleCount,
}) {
  const currency = trip.currency || 'INR'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {/* 1. Total Spent */}
      <Card
        data-testid="stats-tile-total-spent"
        className="bg-white p-4 sm:p-5 flex flex-col justify-between border-2 border-zinc-900 shadow-playful"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
            Total spent
          </span>
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 border border-zinc-900 flex items-center justify-center">
            <Coins className="w-4 h-4" weight="bold" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {formatCurrency(totalSpent, currency)}
          </div>
          <span className="text-[11px] font-bold text-zinc-500 mt-0.5 block">
            {expensesCount === 0
              ? 'No spending recorded'
              : `Across ${expensesCount} ${expensesCount === 1 ? 'expense' : 'expenses'}`}
          </span>
        </div>
      </Card>

      {/* 2. Expenses Count */}
      <Card
        data-testid="stats-tile-expenses"
        className="bg-white p-4 sm:p-5 flex flex-col justify-between border-2 border-zinc-900 shadow-playful"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
            Expenses
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 border border-zinc-900 flex items-center justify-center">
            <Receipt className="w-4 h-4" weight="bold" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {expensesCount}
          </div>
          <Link
            to={`/trips/${trip.id}/expenses`}
            className="text-[11px] font-extrabold text-purple-700 hover:underline mt-0.5 inline-block"
          >
            Browse expenses →
          </Link>
        </div>
      </Card>

      {/* 3. People Count */}
      <Card
        data-testid="stats-tile-people"
        className="bg-white p-4 sm:p-5 flex flex-col justify-between border-2 border-zinc-900 shadow-playful"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
            People
          </span>
          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 border border-zinc-900 flex items-center justify-center">
            <Users className="w-4 h-4" weight="bold" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {peopleCount}
          </div>
          <Link
            to={`/trips/${trip.id}/people`}
            className="text-[11px] font-extrabold text-teal-700 hover:underline mt-0.5 inline-block"
          >
            Manage members →
          </Link>
        </div>
      </Card>
    </div>
  )
}
