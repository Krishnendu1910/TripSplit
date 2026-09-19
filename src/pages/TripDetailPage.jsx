import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass } from '@phosphor-icons/react'
import { TripNavigationTabs } from '../components/layout/TripNavigationTabs'
import { TripOverview } from '../features/trips/components/TripOverview'
import { ExpensesList } from '../features/expenses/components/ExpensesList'
import { PeopleList } from '../features/participants/components/PeopleList'
import { SettlementSummary } from '../features/settlements/components/SettlementSummary'
import { EmptyState } from '../components/ui/EmptyState'
import { useTripStore } from '../store/useTripStore'

export function TripDetailPage({ subview = 'overview' }) {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const trips = useTripStore((s) => s.trips)
  const setActiveTripId = useTripStore((s) => s.setActiveTripId)

  const trip = trips.find((t) => t.id === tripId) || null

  useEffect(() => {
    if (tripId && trip) {
      setActiveTripId(tripId)
    } else if (tripId && !trip) {
      setActiveTripId(null)
    }
  }, [tripId, trip, setActiveTripId])

  if (!trip) {
    return (
      <div className="space-y-6">
        <Link
          to="/trips"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-950"
        >
          <ArrowLeft className="w-4 h-4" weight="bold" />
          <span>Back to All Trips</span>
        </Link>
        <EmptyState
          icon={Compass}
          title="Trip not found"
          description={`We searched high and low, but couldn't locate trip #${tripId}. It may have been deleted or the link is incorrect.`}
          actionLabel="Return to trips"
          onAction={() => navigate('/trips')}
          badgeText="Lost in transit"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 -mt-2">
      {/* Top back link & breadcrumb */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/trips"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" weight="bold" />
          <span>All Trips</span>
          <span className="text-zinc-400">/</span>
          <span className="text-zinc-900 font-extrabold">{trip.name}</span>
        </Link>
      </div>

      {/* Sub Navigation Tabs */}
      <TripNavigationTabs />

      {/* Sub-view Content */}
      <div className="pt-2">
        {subview === 'overview' && <TripOverview trip={trip} />}
        {subview === 'expenses' && <ExpensesList trip={trip} />}
        {subview === 'people' && <PeopleList trip={trip} />}
        {subview === 'settlement' && <SettlementSummary trip={trip} />}
      </div>
    </div>
  )
}
