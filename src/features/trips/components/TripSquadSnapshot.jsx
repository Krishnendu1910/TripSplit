import { Link } from 'react-router-dom'
import { Users, UserPlus, ArrowRight } from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'

/**
 * Compact squad snapshot card for the trip overview.
 * Displays participant initials/avatars and names without fake balances,
 * with empty state and navigation to the full people tab.
 *
 * @param {{
 *   trip: Object,
 *   participants: Array<Object>,
 *   onAddPerson: () => void
 * }} props
 */
export function TripSquadSnapshot({
  trip,
  participants = [],
  onAddPerson,
}) {
  const peopleCount = participants.length

  return (
    <Card className="p-5 sm:p-6 bg-white border-2 border-zinc-900 shadow-playful flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b-2 border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 border-2 border-zinc-900 text-teal-900 flex items-center justify-center font-black">
              <Users className="w-4 h-4" weight="bold" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                Squad Members
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Who is on this journey
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={UserPlus}
            onClick={onAddPerson}
            className="text-xs font-black"
            aria-label="Add squad member"
          >
            Add
          </Button>
        </div>

        {/* Empty State */}
        {peopleCount === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border-2 border-dashed border-zinc-300 text-teal-500 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" weight="duotone" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-zinc-800">
                Who&apos;s coming?
              </p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-0.5">
                Add your squad to start tracking and splitting trip expenses.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={UserPlus}
              onClick={onAddPerson}
              className="text-xs font-black"
            >
              Add person
            </Button>
          </div>
        ) : (
          /* Participant Grid / List */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Your squad
              </span>
              <Badge variant="teal" className="text-[11px] font-black">
                {peopleCount} {peopleCount === 1 ? 'person' : 'people'}
              </Badge>
            </div>

            <ul className="space-y-2" aria-label="Squad participants list">
              {participants.slice(0, 6).map((p) => {
                const initial = p.name ? p.name.charAt(0).toUpperCase() : '?'
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-2xl bg-zinc-50 border border-zinc-200/80"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full border border-zinc-900 font-black text-xs text-zinc-950 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: p.avatarBg || '#0d9488' }}
                      >
                        {initial}
                      </div>
                      <span className="text-xs sm:text-sm font-black text-zinc-900 truncate">
                        {p.name}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>

            {peopleCount > 6 && (
              <p className="text-xs font-bold text-zinc-400 pl-1">
                + {peopleCount - 6} more squad members
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer Link */}
      {peopleCount > 0 && (
        <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400">
            {peopleCount} registered
          </span>
          <Link
            to={`/trips/${trip.id}/people`}
            className="inline-flex items-center gap-1 text-xs font-black text-teal-700 hover:text-teal-900 hover:underline"
          >
            <span>View people</span>
            <ArrowRight className="w-3.5 h-3.5" weight="bold" />
          </Link>
        </div>
      )}
    </Card>
  )
}

