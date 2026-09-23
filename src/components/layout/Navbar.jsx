import { NavLink, useLocation } from 'react-router-dom'
import { House, Compass, AirplaneTilt } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { useTripStore } from '../../store/useTripStore'

export function Navbar({ isMobile = false, onItemClick }) {
  const location = useLocation()
  const activeTripId = useTripStore((s) => s.activeTripId)
  const trips = useTripStore((s) => s.trips)

  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/'
  const isHomeActive = normalizedPath === '/'
  const isAllTripsActive = normalizedPath === '/trips'
  const isCurrentTripActive = /^\/trips\/[^/]+(?:\/.*)?$/.test(normalizedPath)

  const routeMatch = normalizedPath.match(/^\/trips\/([^/]+)/)
  const routeTripId = routeMatch ? routeMatch[1] : null
  const targetTripId = routeTripId || activeTripId || trips[0]?.id
  const currentTripPath = targetTripId ? `/trips/${targetTripId}` : ''

  const navItems = [
    { label: 'Home', path: '/', icon: House, end: true, isActive: isHomeActive },
    { label: 'All Trips', path: '/trips', icon: Compass, end: true, isActive: isAllTripsActive },
    { label: 'Current Trip', path: currentTripPath, icon: AirplaneTilt, end: false, isActive: isCurrentTripActive },
  ]

  if (isMobile) {
    return (
      <nav aria-label="Mobile navigation" className="flex items-center justify-around w-full py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.end}
              aria-current={item.isActive ? 'page' : null}
              onClick={onItemClick}
              className={() =>
                cn(
                  'flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 rounded-2xl text-xs font-bold transition-all relative',
                  item.isActive
                    ? 'text-orange-600 bg-orange-50 font-black'
                    : 'text-zinc-600 hover:text-zinc-900 active:bg-zinc-100',
                )
              }
            >
              {() => (
                <>
                  <Icon className="w-5 h-5 mb-0.5" weight={item.isActive ? 'fill' : 'bold'} />
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
            key={item.label}
            to={item.path}
            end={item.end}
            aria-current={item.isActive ? 'page' : null}
            className={() =>
              cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-bold transition-all border-2',
                item.isActive
                  ? 'bg-orange-500 text-white border-zinc-900 shadow-playful-sm'
                  : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border-transparent',
              )
            }
          >
            {() => (
              <>
                <Icon className="w-4 h-4" weight={item.isActive ? 'fill' : 'bold'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border',
                      item.isActive
                        ? 'bg-white text-zinc-900 border-zinc-900'
                        : 'bg-amber-100 text-amber-900 border-amber-300',
                    )}
                  >
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
