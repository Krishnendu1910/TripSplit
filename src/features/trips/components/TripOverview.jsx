import { Link } from 'react-router-dom'
import {
  Users,
  Receipt,
  Wallet,
  Calendar,
  MapPin,
  Plus,
  ArrowUpRight,
  Sparkle,
} from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { formatCurrency, formatDateRange } from '../../../utils/formatters'

export function TripOverview({ trip }) {
  const isDemo = trip.isDemo
  const stats = trip.stats || {
    totalSpent: 0,
    peopleCount: 1,
    expensesCount: 0,
    userBalance: 0,
  }

  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      {isDemo && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-100/90 border-2 border-zinc-900 rounded-3xl shadow-playful-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-300 rounded-2xl border border-zinc-900 flex items-center justify-center text-zinc-950 shrink-0">
              <Sparkle className="w-5 h-5" weight="fill" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-zinc-900">
                Demo UI Preview Mode
              </p>
              <p className="text-xs text-zinc-700">
                All numbers shown below are placeholder values for UI review only. Calculation engines activate in Phase 2.
              </p>
            </div>
          </div>
          <Badge variant="demo" className="shrink-0">
            UI MOCK DATA
          </Badge>
        </div>
      )}

      {/* Hero Trip Title Card */}
      <Card className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/40 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="teal" icon={MapPin}>
                {trip.destination}
              </Badge>
              <Badge variant="orange" icon={Calendar}>
                {formatDateRange(trip.startDate, trip.endDate)}
              </Badge>
              <Badge variant="default">
                Currency: {trip.currency}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 tracking-tight uppercase">
              {trip.name}
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 mt-1 font-medium">
              Keep the fun going while TripSplit handles the spreadsheet arguments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
            <Link to={`/trips/${trip.id}/expenses`}>
              <Button variant="primary" size="md" icon={Plus}>
                Add Expense
              </Button>
            </Link>
            <Link to={`/trips/${trip.id}/settlement`}>
              <Button variant="outline" size="md">
                View Settlement
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Core 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Spent */}
        <Card className="bg-white p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Total spent
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" weight="bold" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              {formatCurrency(stats.totalSpent, trip.currency)}
            </div>
            <span className="text-[11px] font-semibold text-zinc-400 mt-0.5 block">
              Across all group members
            </span>
          </div>
        </Card>

        {/* People */}
        <Card className="bg-white p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
              People
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Users className="w-4 h-4" weight="bold" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              {stats.peopleCount}
            </div>
            <Link
              to={`/trips/${trip.id}/people`}
              className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1 mt-0.5"
            >
              <span>View squad roster</span>
              <ArrowUpRight className="w-3 h-3" weight="bold" />
            </Link>
          </div>
        </Card>

        {/* Expenses */}
        <Card className="bg-white p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" weight="bold" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              {stats.expensesCount}
            </div>
            <Link
              to={`/trips/${trip.id}/expenses`}
              className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-1 mt-0.5"
            >
              <span>Browse receipts</span>
              <ArrowUpRight className="w-3 h-3" weight="bold" />
            </Link>
          </div>
        </Card>

        {/* Your balance */}
        <Card className="bg-white p-4 sm:p-5 flex flex-col justify-between border-2 border-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Your balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" weight="bold" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              +{formatCurrency(stats.userBalance, trip.currency)}
            </div>
            <span className="text-[11px] font-bold text-emerald-700 mt-0.5 block">
              You are owed in total
            </span>
          </div>
        </Card>
      </div>

      {/* Quick Sections: Recent Damage & Quick Settlements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Expenses preview */}
        <Card className="p-5 sm:p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-zinc-900">
                Latest Expenses
              </h2>
              <p className="text-xs text-zinc-500">
                Recent receipts logged by your group
              </p>
            </div>
            <Link to={`/trips/${trip.id}/expenses`}>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5">
            {(trip.sampleExpenses || []).map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" weight="bold" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{exp.title}</h4>
                    <p className="text-xs text-zinc-500 font-medium">
                      Paid by <span className="font-bold text-zinc-700">{exp.paidBy}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right font-black text-sm text-zinc-900">
                  {formatCurrency(exp.amount, trip.currency)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Squad Breakdown */}
        <Card className="p-5 sm:p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-zinc-900">
                Travel Squad
              </h2>
              <p className="text-xs text-zinc-500">
                Friends sharing this trip experience
              </p>
            </div>
            <Link to={`/trips/${trip.id}/people`}>
              <Button variant="ghost" size="sm">
                Manage
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(trip.people || []).map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200"
              >
                <div
                  style={{ backgroundColor: person.avatarBg || '#f97316' }}
                  className="w-8 h-8 rounded-full border border-zinc-900 flex items-center justify-center text-xs font-black text-white"
                >
                  {person.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                    {person.name}
                    {person.isCurrentUser && (
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded-full font-extrabold">
                        You
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-zinc-500">Member</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
