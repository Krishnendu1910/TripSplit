import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef(function Input(
  { label, id, error, hint, className, type = 'text', required = false, ...props },
  ref,
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold tracking-wide text-zinc-800 uppercase flex items-center gap-1">
          {label}
          {required && <span className="text-orange-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        className={cn(
          'w-full px-3.5 py-2.5 text-sm font-medium bg-white text-zinc-900 border-2 border-zinc-900 rounded-2xl shadow-playful-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-zinc-900 transition-all duration-150',
          error && 'border-red-500 focus:ring-red-300',
          className,
        )}
        {...props}
      />
      {hint && !error && <span className="text-xs text-zinc-500">{hint}</span>}
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </div>
  )
})
