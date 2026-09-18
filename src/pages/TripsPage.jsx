import { useState } from 'react'
import { Wallet, Plus } from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { TripCard } from '../features/trips/components/TripCard'
import { useUIStore } from '../store/useUIStore'
import { useTripStore } from '../store/useTripStore'

export function TripsPage() {
  const openCreateTripModal = useUIStore((s) => s.openCreateTripModal)
  const trips = useTripStore((s) => s.trips)
  const [forceEmpty, setForceEmpty] = useState(false)

  const displayedTrips = forceEmpty ? [] : trips

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
            Your Trips
          </h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Select a trip to view expenses, squad members, and settlement summaries.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setForceEmpty((v) => !v)}
            className="text-xs"
          >
            {forceEmpty ? 'Show Demo Trip' : 'Toggle Empty State'}
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={openCreateTripModal}
          >
            Start a trip
          </Button>
        </div>
      </div>

      {/* Trips list or empty state */}
      {displayedTrips.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Your wallet is suspiciously peaceful."
          description="No trips yet. Either you're staying home, or you're about to create some financial chaos."
          actionLabel="Start your first trip"
          onAction={openCreateTripModal}
          badgeText="Zen Mode"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}
