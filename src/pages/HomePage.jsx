import {
  AirplaneTakeoff,
  Receipt,
  Wallet,
  Compass,
  ArrowRight,
  SuitcaseRolling,
  Coins,
  ShieldCheck,
  SplitHorizontal,
} from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { TripCard } from '../features/trips/components/TripCard'
import { useUIStore } from '../store/useUIStore'
import { useTripStore } from '../store/useTripStore'

export function HomePage() {
  const openCreateTripModal = useUIStore((s) => s.openCreateTripModal)
  const showToast = useUIStore((s) => s.showToast)
  const trips = useTripStore((s) => s.trips)

  const activeTrips = trips.filter((t) => t.status !== 'archived')
  const featuredTrip = activeTrips[0]

  const handleJoinTrip = () => {
    showToast('TripSplit is private and offline-first. Select your squad trip from All Trips or create a new one!', 'info')
  }

  return (
    <div className="relative isolate space-y-12 sm:space-y-16">
      {/* Decorative Travel Map Atmosphere (CSS-only, purely visual, non-interactive) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -top-8 sm:-top-12 -bottom-16 -mx-4 sm:-mx-6 md:-mx-8 overflow-hidden -z-10 select-none"
      >
        {/* Subtle travel journal dotted grid */}
        <div
          className="absolute inset-0 opacity-35 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_90%)]"
          style={{
            backgroundImage: 'radial-gradient(#78716c 0.75px, transparent 0.75px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient travel destination aura (warm orange & amber in hero area) */}
        <div className="absolute -top-12 right-[-5%] w-[480px] h-[480px] rounded-full bg-gradient-to-br from-orange-200/25 via-amber-100/30 to-transparent blur-3xl" />

        {/* Cool adventure breeze aura (subtle mint/teal in middle-left) */}
        <div className="absolute top-[35%] -left-16 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-teal-200/15 via-emerald-100/20 to-transparent blur-3xl" />

        {/* Abstract route waypoint rings (travel map coordinates / waypoint markers) */}
        <div className="hidden sm:block absolute top-8 right-[16%] w-44 h-44 rounded-full border border-dashed border-amber-300/40 opacity-70" />
        <div className="hidden sm:block absolute top-16 right-[20%] w-20 h-20 rounded-full border border-zinc-300/30 opacity-60" />

        {/* Faint travel route wayfinder line across middle-lower section */}
        <div className="hidden lg:block absolute top-[52%] left-[6%] w-64 h-32 rounded-full border-t-2 border-r-2 border-dashed border-orange-300/25 -rotate-12 opacity-80" />
        <div className="hidden lg:block absolute top-[65%] right-[10%] w-56 h-28 rounded-full border-b-2 border-l-2 border-dashed border-teal-400/20 rotate-6 opacity-80" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-2 sm:pt-4 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-950 tracking-tight leading-[1.08]">
              So... <span className="underline decoration-orange-400 decoration-wavy decoration-3 underline-offset-8">who owes</span> whom?
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-zinc-700 font-medium max-w-xl leading-relaxed">
              Keep track of the trip money chaos before your group chat turns into a courtroom.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={AirplaneTakeoff}
                onClick={openCreateTripModal}
              >
                Start a trip
              </Button>
              <Button
                variant="outline"
                size="lg"
                icon={Compass}
                onClick={handleJoinTrip}
              >
                Join a trip
              </Button>
            </div>

            {/* Micro reassurance badges */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-zinc-600">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" weight="bold" />
                <span>Zero awkward conversations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" weight="bold" />
                <span>Fair splits, down to the paisa</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Composition */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[320px] sm:min-h-[380px]">
            <div className="absolute inset-0 bg-amber-200/50 rounded-[40px] rotate-3 border-2 border-dashed border-zinc-300 pointer-events-none" />

            {/* Playful Sample Pass */}
            <div className="relative z-10 w-full max-w-sm bg-white border-3 border-zinc-900 rounded-3xl p-6 shadow-playful-lg animate-float">
              <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs">
                    TS
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-800">
                    Smart Split Engine
                  </span>
                </div>
                <Badge variant="teal">BALANCED</Badge>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-700">Group Dinners & Bites</span>
                  <span className="font-black text-zinc-900">Tracked</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-700">Cab & Fuel Shares</span>
                  <span className="font-black text-zinc-900">Simplified</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-dashed border-zinc-200 flex items-center justify-between text-xs">
                <span className="font-extrabold text-zinc-500 uppercase">Group Chaos</span>
                <span className="text-base font-black text-emerald-600">0% Drama</span>
              </div>
            </div>

            {/* Floating micro-badge 1: Suitcase */}
            <div className="absolute -top-3 -left-3 sm:-left-6 z-20 bg-amber-300 text-zinc-950 p-3 rounded-2xl border-2 border-zinc-900 shadow-playful -rotate-6 animate-float-reverse">
              <SuitcaseRolling className="w-6 h-6" weight="fill" />
            </div>

            {/* Floating micro-badge 2: Wallet */}
            <div className="absolute -bottom-2 -right-2 sm:-right-4 z-20 bg-teal-400 text-zinc-950 px-3.5 py-2 rounded-2xl border-2 border-zinc-900 shadow-playful rotate-6 flex items-center gap-1.5 font-black text-xs">
              <Wallet className="w-4 h-4" weight="fill" />
              <span>Offline-First</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Active Trip or Clean Empty State */}
      <section className="space-y-4">
        {featuredTrip ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                  Current Adventure
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600">
                  Hop straight back into your ongoing trip.
                </p>
              </div>
              <Button
                to="/trips"
                variant="ghost"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
              >
                View all trips ({trips.length})
              </Button>
            </div>

            <div className="max-w-xl">
              <TripCard trip={featuredTrip} />
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Wallet}
            title="Your wallet is suspiciously peaceful."
            description="No trips yet. Either you're staying home, or you're about to create some financial chaos."
            actionLabel="Start a trip"
            onAction={openCreateTripModal}
            badgeText="Ready for Adventure"
          />
        )}
      </section>

      {/* Product Highlights Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <Card className="bg-white p-5 border-2 border-zinc-900 shadow-playful flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" weight="bold" />
            </div>
            <h3 className="text-base font-black text-zinc-900 mb-1">
              Log in Seconds
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Toss expenses in while waiting for the bill. No spreadsheet headaches later.
            </p>
          </div>
        </Card>

        <Card className="bg-white p-5 border-2 border-zinc-900 shadow-playful flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
              <SplitHorizontal className="w-5 h-5" weight="bold" />
            </div>
            <h3 className="text-base font-black text-zinc-900 mb-1">
              Flexible Splits
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Equal splits, uneven drinks, or someone skipping dessert? Handled cleanly.
            </p>
          </div>
        </Card>

        <Card className="bg-white p-5 border-2 border-zinc-900 shadow-playful flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <Coins className="w-5 h-5" weight="bold" />
            </div>
            <h3 className="text-base font-black text-zinc-900 mb-1">
              Minimal Transfers
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Smart debt simplification means fewer bank transfers and faster settlement.
            </p>
          </div>
        </Card>
      </section>
    </div>
  )
}
