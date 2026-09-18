import { NavLink } from 'react-router-dom'
import { House, Compass, Gear, AirplaneTilt } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { useTripStore } from '../../store/useTripStore'

export function Navbar({ isMobile = false, onItemClick }) {
  const activeTripId = useTripStore((s) => s.activeTripId)
  const currentTripPath = activeTripId ? `/trips/${activeTripId}` : '/trips'

  const navItems = [
    { label: 'Home', path: '/', icon: House, exact: true },
    { label: 'All Trips', path: '/trips', icon: Compass, exact: true },
    { label: 'Current Trip', path: currentTripPath, icon: AirplaneTilt },
    { label: 'Settings', path: '/settings', icon: Gear, badge: 'Soon' },
  ]

  if (isMobile) {
    return (
      <nav aria-label="Mobile navigation" className="flex items-center justify-around w-full py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={onItemClick}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 rounded-2xl text-xs font-bold transition-all relative',
                  isActive
                    ? 'text-orange-600 bg-orange-50 font-black'
                    : 'text-zinc-600 hover:text-zinc-900 active:bg-zinc-100',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5 mb-0.5" weight={isActive ? 'fill' : 'bold'} />
                  <span className="text-[11px] leading-tight">{item.label}</span>
                  {item.badge && (
                    <span className="absolute -top-1 right-1 text-[9px] font-black bg-amber-200 text-amber-900 px-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    )
  }

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-1.5 sm:gap-2">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-bold transition-all border-2',
                isActive
                  ? 'bg-orange-500 text-white border-zinc-900 shadow-playful-sm'
                  : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border-transparent',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4" weight={isActive ? 'fill' : 'bold'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    'text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border',
                    isActive ? 'bg-white text-zinc-900 border-zinc-900' : 'bg-amber-100 text-amber-900 border-amber-300',
                  )}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
