import { Link } from 'react-router-dom'
import {
  AirplaneTakeoff,
  Receipt,
  Wallet,
  Compass,
  ArrowRight,
  Sparkle,
  SuitcaseRolling,
  Coins,
  ShieldCheck,
  SplitHorizontal,
} from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { TripCard } from '../features/trips/components/TripCard'
import { useUIStore } from '../store/useUIStore'
import { useTripStore } from '../store/useTripStore'

export function HomePage() {
  const openCreateTripModal = useUIStore((s) => s.openCreateTripModal)
  const showToast = useUIStore((s) => s.showToast)
  const trips = useTripStore((s) => s.trips)
  const featuredTrip = trips[0]

  const handleJoinTrip = () => {
    showToast('Trip joining via invite code or QR code arrives in Phase 2!', 'info')
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="relative pt-4 sm:pt-8 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 border-2 border-zinc-900 rounded-full shadow-playful-sm">
              <Sparkle className="w-4 h-4 text-orange-600" weight="fill" />
              <span className="text-xs font-black uppercase tracking-wider text-orange-950">
                Playful Travel • Serious Math
              </span>
            </div>

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

          {/* Hero Visual Composition (Tailored playful CSS composition, not a stock photo) */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[320px] sm:min-h-[380px]">
            {/* Background geometric badge shape */}
            <div className="absolute inset-0 bg-amber-200/50 rounded-[40px] rotate-3 border-2 border-dashed border-zinc-300 pointer-events-none" />

            {/* Central Playful Split Ticket Card */}
            <div className="relative z-10 w-full max-w-sm bg-white border-3 border-zinc-900 rounded-3xl p-6 shadow-playful-lg animate-float">
              <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs">
                    TS
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-800">
                    Group Expense Pass
                  </span>
                </div>
                <Badge variant="teal">BALANCED</Badge>
              </div>

              {/* Mini visual split items */}
              <div className="space-y-3 text-xs font-bold">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-700">Goa Seafood Dinner</span>
                  <span className="font-black text-zinc-900">₹4,850</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-700">Scooter Rental</span>
                  <span className="font-black text-zinc-900">₹3,600</span>
                </div>
              </div>

              {/* Settlement formula preview */}
              <div className="mt-4 pt-3 border-t-2 border-dashed border-zinc-200 flex items-center justify-between text-xs">
                <span className="font-extrabold text-zinc-500 uppercase">Your Balance</span>
                <span className="text-base font-black text-emerald-600">+₹1,650</span>
              </div>
            </div>

            {/* Floating micro-badge 1: Suitcase */}
            <div className="absolute -top-3 -left-3 sm:-left-6 z-20 bg-amber-300 text-zinc-950 p-3 rounded-2xl border-2 border-zinc-900 shadow-playful -rotate-6 animate-float-reverse">
              <SuitcaseRolling className="w-6 h-6" weight="fill" />
            </div>

            {/* Floating micro-badge 2: Wallet */}
            <div className="absolute -bottom-2 -right-2 sm:-right-4 z-20 bg-teal-400 text-zinc-950 px-3.5 py-2 rounded-2xl border-2 border-zinc-900 shadow-playful rotate-6 flex items-center gap-1.5 font-black text-xs">
              <Wallet className="w-4 h-4" weight="fill" />
              <span>Drama: 0%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Active Trip Section */}
      {featuredTrip && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                Active Adventure
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600">
                Hop straight into your ongoing trip details.
              </p>
            </div>
            <Link to="/trips">
              <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                View all trips
              </Button>
            </Link>
          </div>

          <div className="max-w-xl">
            <TripCard trip={featuredTrip} />
          </div>
        </section>
      )}

      {/* Product Highlights Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <Card className="bg-white p-5 border-2 border-zinc-900 shadow-playful flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" weight="bold" />
            </div>
            <h3 className="text-base font-black text-zinc-900 mb-1">
              Snap & Log in Seconds
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Toss receipts in while waiting for the bill. No spreadsheet headaches later.
            </p>
          </div>
        </Card>

        <Card className="bg-white p-5 border-2 border-zinc-900 shadow-playful flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
              <SplitHorizontal className="w-5 h-5" weight="bold" />
            </div>
            <h3 className="text-base font-black text-zinc-900 mb-1">
              Flexible Splitting
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Equal splits, uneven drinks, or someone skipping dessert? Handled gracefully.
            </p>
          </div>
        </Card>

        <Card className="bg-white p-5 border-2 border-zinc-900 shadow-playful flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <Coins className="w-5 h-5" weight="bold" />
            </div>
            <h3 className="text-base font-black text-zinc-900 mb-1">
              Minimal Transactions
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
