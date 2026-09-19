import { Link } from 'react-router-dom'
import { MapPin, Calendar, ArrowRight, Archive, Users } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { formatDateRange } from '../../../utils/formatters'
import { useParticipantStore } from '../../../store/useParticipantStore'

export function TripCard({ trip }) {
  const isArchived = trip.status === 'archived'
  const isDemo = Boolean(trip.isDemo)

  const allParticipants = useParticipantStore((s) => s.participants)
  const tripParticipants = allParticipants.filter((p) => p.tripId === trip.id)
  const count =
    tripParticipants.length > 0 || !trip.isDemo
      ? tripParticipants.length
      : (trip.people?.length || 0)

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-3xl"
    >
      <Card
        interactive
        className="relative overflow-hidden flex flex-col justify-between h-full bg-white"
      >
        <div>
          {/* Top bar with destination & status badges */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <Badge variant="teal" icon={MapPin}>
              {trip.destination}
            </Badge>

            <div className="flex items-center gap-1.5">
              {isArchived && (
                <Badge variant="default" icon={Archive}>
                  ARCHIVED
                </Badge>
              )}
              {isDemo && <Badge variant="demo">DEMO PREVIEW</Badge>}
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight group-hover:text-orange-600 transition-colors break-words">
            {trip.name}
          </h3>

          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mt-2">
            <Calendar className="w-4 h-4 text-zinc-400" weight="bold" aria-hidden="true" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>

          {trip.description && (
            <p className="text-xs text-zinc-600 line-clamp-2 mt-2 leading-relaxed break-words">
              {trip.description}
            </p>
          )}
        </div>

        {/* Bottom row: Currency, Member count & Navigation trigger */}
        <div className="pt-4 mt-4 border-t-2 border-zinc-100 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                Currency:
              </span>
              <span className="text-xs font-black text-zinc-900 px-2 py-0.5 bg-zinc-100 rounded-lg border border-zinc-200">
                {trip.currency || 'INR'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-zinc-600">
              <Users className="w-3.5 h-3.5 text-zinc-400" weight="bold" aria-hidden="true" />
              <span>{count} {count === 1 ? 'member' : 'members'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform motion-reduce:transition-none motion-reduce:transform-none">
            <span>View Trip</span>
            <div className="w-7 h-7 rounded-full bg-orange-50 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-colors motion-reduce:transition-none">
              <ArrowRight className="w-3.5 h-3.5" weight="bold" aria-hidden="true" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
