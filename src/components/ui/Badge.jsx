import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const badgeVariants = {
  default: 'bg-zinc-100 text-zinc-800 border-zinc-300',
  orange: 'bg-orange-100 text-orange-900 border-orange-300',
  teal: 'bg-teal-100 text-teal-900 border-teal-300',
  yellow: 'bg-amber-100 text-amber-950 border-amber-300',
  purple: 'bg-purple-100 text-purple-900 border-purple-300',
  rose: 'bg-rose-100 text-rose-900 border-rose-300',
  demo: 'bg-amber-300 text-zinc-950 font-black border-zinc-900 shadow-playful-sm',
}

export const Badge = forwardRef(function Badge(
  { children, variant = 'default', className, icon: Icon, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border',
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5" weight="bold" />}
      <span>{children}</span>
    </span>
  )
})
