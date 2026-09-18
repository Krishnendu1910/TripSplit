import { Link } from 'react-router-dom'
import { Plus, Ticket, Compass } from '@phosphor-icons/react'
import { Navbar } from './Navbar'
import { Button } from '../ui/Button'
import { useUIStore } from '../../store/useUIStore'

export function AppShell({ children }) {
  const openCreateTripModal = useUIStore((s) => s.openCreateTripModal)
  const toast = useUIStore((s) => s.toast)
  const clearToast = useUIStore((s) => s.clearToast)

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5] text-zinc-900 selection:bg-orange-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-zinc-900 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link
            to="/"
            aria-label="TripSplit"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-2xl"
          >
            <div className="w-10 h-10 bg-orange-500 border-2 border-zinc-900 rounded-2xl shadow-playful-sm flex items-center justify-center text-white group-hover:-rotate-6 transition-transform">
              <Ticket className="w-6 h-6" weight="fill" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 font-sans">
                  Trip<span className="text-orange-600">Split</span>
                </span>
                <span className="hidden sm:inline-block bg-teal-100 text-teal-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-teal-300">
                  v0.1
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
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation (docked for comfortable touch targets) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-zinc-900 shadow-playful-lg px-2 py-1 safe-area-pb">
        <Navbar isMobile={true} />
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 text-white rounded-2xl border-2 border-zinc-900 shadow-playful-lg text-sm font-bold">
            <Compass className="w-5 h-5 text-orange-400" weight="fill" />
            <span>{toast.message}</span>
            <button
              onClick={clearToast}
              className="text-zinc-400 hover:text-white text-xs font-bold underline ml-2 cursor-pointer"
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
          <p className="text-zinc-400">
            Phase 1 Foundation • Serious math wrapped in a playful companion.
          </p>
        </div>
      </footer>
    </div>
  )
}
