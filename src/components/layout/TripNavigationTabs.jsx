import { NavLink, useParams } from 'react-router-dom'
import { SquaresFour, Receipt, Users, Scales } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

export function TripNavigationTabs() {
  const { tripId } = useParams()
  const base = `/trips/${tripId}`

  const tabs = [
    { label: 'Overview', path: base, exact: true, icon: SquaresFour },
    { label: 'Expenses', path: `${base}/expenses`, icon: Receipt },
    { label: 'People', path: `${base}/people`, icon: Users },
    { label: 'Settle Up', path: `${base}/settlement`, icon: Scales },
  ]

  return (
    <div className="w-full border-b-2 border-zinc-900 bg-white/70 backdrop-blur-xs sticky top-[65px] sm:top-[73px] z-20 py-2">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <nav aria-label="Trip tabs" className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 touch-pan-x scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.exact}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-black rounded-2xl whitespace-nowrap transition-all border-2 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none',
                    isActive
                      ? 'bg-amber-300 text-zinc-950 border-zinc-900 shadow-playful-sm translate-y-[-1px]'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-900 hover:text-zinc-900',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4 shrink-0" weight={isActive ? 'fill' : 'bold'} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

