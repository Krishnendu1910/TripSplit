import { Link } from 'react-router-dom'
import { Plus, Ticket, Compass, WifiSlash } from '@phosphor-icons/react'
import { Navbar } from './Navbar'
import { Button } from '../ui/Button'
import { useUIStore } from '../../store/useUIStore'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

export function AppShell({ children }) {
  const openCreateTripModal = useUIStore((s) => s.openCreateTripModal)
  const toast = useUIStore((s) => s.toast)
  const clearToast = useUIStore((s) => s.clearToast)
  const { isOnline } = useNetworkStatus()

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5] text-zinc-900 selection:bg-orange-200">
      {/* Accessible Skip to Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-white focus:font-black focus:border-2 focus:border-zinc-900 focus:rounded-xl focus:shadow-playful"
      >
        Skip to main content
      </a>

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-zinc-900 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link
            to="/"
            aria-label="TripSplit Home"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-2xl"
          >
            <div className="w-10 h-10 bg-orange-500 border-2 border-zinc-900 rounded-2xl shadow-playful-sm flex items-center justify-center text-white group-hover:-rotate-6 transition-transform motion-reduce:transition-none motion-reduce:transform-none">
              <Ticket className="w-6 h-6" weight="fill" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 font-sans">
                  Trip<span className="text-orange-600">Split</span>
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-semibold hidden sm:block -mt-1">
                Travel easy. Split honestly.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Navbar isMobile={false} />
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={openCreateTripModal}
              variant="primary"
              size="sm"
              icon={Plus}
              className="sm:px-4 sm:py-2"
            >
              <span className="hidden sm:inline">Start a trip</span>
              <span className="sm:hidden">New Trip</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 outline-none">
        {/* Offline Status Notice */}
        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5 bg-amber-50 border-2 border-amber-800/80 rounded-xl text-amber-900 text-xs sm:text-sm font-bold shadow-playful-sm animate-in fade-in duration-200"
          >
            <WifiSlash className="w-4 h-4 shrink-0 text-amber-800" weight="bold" aria-hidden="true" />
            <span>You&apos;re offline — your trip data is saved on this device.</span>
          </div>
        )}
        {children}
      </main>

      {/* Mobile Bottom Navigation (docked for comfortable touch targets) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-zinc-900 shadow-playful-lg px-2 py-1 safe-area-pb">
        <Navbar isMobile={true} />
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 motion-reduce:transition-none motion-reduce:animate-none"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 text-white rounded-2xl border-2 border-zinc-900 shadow-playful-lg text-sm font-bold">
            <Compass className="w-5 h-5 text-orange-400" weight="fill" aria-hidden="true" />
            <span>{toast.message}</span>
            <button
              onClick={clearToast}
              aria-label="Dismiss notification"
              className="text-zinc-400 hover:text-white text-xs font-bold underline ml-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-md"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t-2 border-zinc-900 bg-white py-6 px-4 text-center text-xs text-zinc-500 hidden md:block">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-zinc-600">
            TripSplit • Defusing group vacation money drama before it happens.
          </p>
        </div>
      </footer>
    </div>
  )
}
