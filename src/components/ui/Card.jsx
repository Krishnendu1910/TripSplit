import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Card = forwardRef(function Card(
  { children, className, variant = 'default', interactive = false, ...props },
  ref,
) {
  const variants = {
    default: 'bg-white border-2 border-zinc-900 shadow-playful rounded-3xl',
    subtle: 'bg-white/80 backdrop-blur-xs border border-zinc-200/80 shadow-card rounded-3xl',
    playful: 'bg-amber-50/70 border-2 border-zinc-900 shadow-playful-lg rounded-3xl',
    flat: 'bg-zinc-100/80 border border-zinc-200 rounded-2xl',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'p-5 transition-all duration-150',
        variants[variant],
        interactive && 'hover:-translate-y-1 hover:shadow-playful-lg cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
