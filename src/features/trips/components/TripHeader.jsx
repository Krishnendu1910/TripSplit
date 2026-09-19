import {
  MapPin,
  Calendar,
  PencilSimple,
  Archive,
  ArrowCounterClockwise,
  Trash,
} from '@phosphor-icons/react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { formatDateRange } from '../../../utils/formatters'

/**
 * Compact hero header for the trip command center.
 * Displays real trip metadata and primary management actions.
 *
 * @param {{
 *   trip: Object,
 *   isArchived: boolean,
 *   onEdit: () => void,
 *   onToggleArchive: () => void,
 *   onDelete: () => void
 * }} props
 */
export function TripHeader({
  trip,
  isArchived,
  onEdit,
  onToggleArchive,
  onDelete,
}) {
  const hasDates = Boolean(trip.startDate && trip.endDate)

  return (
    <Card className="bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 p-5 sm:p-6 md:p-8 border-2 border-zinc-900 shadow-playful">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div className="space-y-2.5 max-w-2xl min-w-0 flex-1">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            {trip.destination && (
              <Badge variant="teal" icon={MapPin}>
                {trip.destination}
              </Badge>
            )}
            {hasDates && (
              <Badge variant="orange" icon={Calendar}>
                {formatDateRange(trip.startDate, trip.endDate)}
              </Badge>
            )}
            <Badge variant="default">Currency: {trip.currency || 'INR'}</Badge>
            {isArchived && (
              <Badge variant="default" icon={Archive}>
                ARCHIVED
              </Badge>
            )}
          </div>

          {/* Trip Name */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 tracking-tight uppercase break-words">
            {trip.name}
          </h1>

          {/* Trip Description */}
          {trip.description ? (
            <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium break-words">
              {trip.description}
            </p>
          ) : (
            <p className="text-xs text-zinc-400 italic">No description added yet.</p>
          )}
        </div>

        {/* Management Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={PencilSimple}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={isArchived ? ArrowCounterClockwise : Archive}
            onClick={onToggleArchive}
          >
            {isArchived ? 'Unarchive' : 'Archive'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Trash}
            onClick={onDelete}
            className="hover:border-red-600 hover:text-red-600"
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}
