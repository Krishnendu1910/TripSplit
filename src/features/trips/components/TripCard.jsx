import { Link } from 'react-router-dom'
import { MapPin, Calendar, ArrowRight } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency, formatDateRange } from '../../../utils/formatters'

export function TripCard({ trip }) {
  const isDemo = trip.isDemo

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-3xl"
    >
      <Card interactive className="relative overflow-hidden flex flex-col justify-between h-full bg-white">
        {/* Top bar with destination & demo badge */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <Badge variant="teal" icon={MapPin}>
              {trip.destination}
            </Badge>
            {isDemo && (
              <Badge variant="demo">
                DEMO PREVIEW
              </Badge>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight group-hover:text-orange-600 transition-colors">
            {trip.name}
          </h3>

          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mt-2">
            <Calendar className="w-4 h-4 text-zinc-400" weight="bold" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="pt-5 mt-5 border-t-2 border-zinc-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 overflow-hidden">
              {(trip.people || []).slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  style={{ backgroundColor: p.avatarBg || '#f97316' }}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white"
                  title={p.name}
                >
                  {p.name.charAt(0)}
                </div>
              ))}
              {(trip.people?.length || 0) > 3 && (
                <div className="w-7 h-7 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center text-[10px] font-black text-zinc-700">
                  +{trip.people.length - 3}
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-zinc-600">
              {trip.stats?.peopleCount || trip.people?.length || 1} people
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-right">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 block">
                Total spent
              </span>
              <span className="text-sm sm:text-base font-black text-zinc-900">
                {formatCurrency(trip.stats?.totalSpent || 0, trip.currency)}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-100 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-colors ml-1">
              <ArrowRight className="w-4 h-4" weight="bold" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
