import { forwardRef } from 'react'
import { CaretDown } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

export const Select = forwardRef(function Select(
  { label, id, error, hint, className, children, required = false, ...props },
  ref,
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const errorId = selectId ? `${selectId}-error` : undefined
  const hintId = selectId ? `${selectId}-hint` : undefined
  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-bold tracking-wide text-zinc-800 uppercase flex items-center gap-1">
          {label}
          {required && <span className="text-orange-500" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={cn(
            'w-full appearance-none px-3.5 py-2.5 pr-10 text-sm font-medium bg-white text-zinc-900 border-2 border-zinc-900 rounded-2xl shadow-playful-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-150 motion-reduce:transition-none cursor-pointer',
            error && 'border-red-500',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-700">
          <CaretDown className="w-4 h-4" weight="bold" aria-hidden="true" />
        </div>
      </div>
      {hint && !error && <span id={hintId} className="text-xs text-zinc-500">{hint}</span>}
      {error && (
        <span id={errorId} role="alert" className="text-xs font-semibold text-red-600">
          {error}
        </span>
      )}
    </div>
  )
})

