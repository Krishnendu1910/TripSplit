import { Button } from './Button'
import { Plus, Sparkle } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  badgeText = 'All Clear',
  secondaryAction,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-amber-50/50 border-2 border-dashed border-zinc-300 rounded-3xl max-w-xl mx-auto my-6',
        className,
      )}
    >
      <div className="relative mb-5">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white border-2 border-zinc-900 rounded-3xl shadow-playful flex items-center justify-center text-orange-500 animate-float">
          {Icon ? <Icon className="w-10 h-10 sm:w-12 sm:h-12" weight="duotone" /> : <Sparkle className="w-10 h-10" weight="duotone" />}
        </div>
        {badgeText && (
          <div className="absolute -bottom-2 -right-2 bg-amber-300 text-zinc-900 font-extrabold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border border-zinc-900 shadow-playful-sm rotate-6">
            {badgeText}
          </div>
        )}
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-zinc-600 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="primary" size="md" icon={Plus}>
            {actionLabel}
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  )
}
