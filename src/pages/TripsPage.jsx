import { useState } from 'react'
import { Wallet, Plus, Archive, Compass } from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { TripCard } from '../features/trips/components/TripCard'
import { useUIStore } from '../store/useUIStore'
import { useTripStore } from '../store/useTripStore'
import { cn } from '../lib/utils'

export function TripsPage() {
  const openCreateTripModal = useUIStore((s) => s.openCreateTripModal)
  const trips = useTripStore((s) => s.trips)
  const [activeTab, setActiveTab] = useState('active') // 'active' | 'archived'

  const activeTrips = trips.filter((t) => t.status !== 'archived')
  const archivedTrips = trips.filter((t) => t.status === 'archived')

  const totalTripCount = trips.length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
            Your Trips
          </h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Organize adventures, track shared spending, and settle up with friends.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={openCreateTripModal}
        >
          Start a trip
        </Button>
      </div>

      {/* When absolutely no trips exist in the application */}
      {totalTripCount === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Your wallet is suspiciously peaceful."
          description="No trips yet. Either you're staying home, or you're about to create some financial chaos."
          actionLabel="Start your first trip"
          onAction={openCreateTripModal}
          badgeText="Zen Mode"
        />
      ) : (
        <div className="space-y-6">
          {/* Active vs Archived Filter Tabs */}
          <div className="flex items-center gap-2 border-b-2 border-zinc-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer border-2',
                activeTab === 'active'
                  ? 'bg-orange-500 text-white border-zinc-900 shadow-playful-sm'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-900 hover:text-zinc-900',
              )}
            >
              <Compass className="w-4 h-4" weight={activeTab === 'active' ? 'fill' : 'bold'} />
              <span>Active Trips</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                  activeTab === 'active' ? 'bg-white text-zinc-900' : 'bg-zinc-100 text-zinc-700',
                )}
              >
                {activeTrips.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('archived')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer border-2',
                activeTab === 'archived'
                  ? 'bg-orange-500 text-white border-zinc-900 shadow-playful-sm'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-900 hover:text-zinc-900',
              )}
            >
              <Archive className="w-4 h-4" weight={activeTab === 'archived' ? 'fill' : 'bold'} />
              <span>Archived</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                  activeTab === 'archived' ? 'bg-white text-zinc-900' : 'bg-zinc-100 text-zinc-700',
                )}
              >
                {archivedTrips.length}
              </span>
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'active' && (
            <div>
              {activeTrips.length === 0 ? (
                <EmptyState
                  icon={Compass}
                  title="No active trips right now."
                  description="All your adventures are currently archived or you haven't started a new one yet."
                  actionLabel="Start a new trip"
                  onAction={openCreateTripModal}
                  badgeText="All Quiet"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'archived' && (
            <div>
              {archivedTrips.length === 0 ? (
                <EmptyState
                  icon={Archive}
                  title="No archived trips yet."
                  description="When a trip wraps up and everyone is settled, you can archive it here to keep your dashboard clean."
                  badgeText="Archive Clean"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {archivedTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
