import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

const variants = {
  primary:
    'bg-orange-500 text-white hover:bg-orange-600 border-2 border-zinc-900 shadow-playful active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2',
  secondary:
    'bg-teal-600 text-white hover:bg-teal-700 border-2 border-zinc-900 shadow-playful active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2',
  outline:
    'bg-white text-zinc-800 hover:bg-zinc-50 border-2 border-zinc-900 shadow-playful active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
  ghost:
    'bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border-2 border-transparent active:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-400',
  subtle:
    'bg-amber-100 text-amber-950 hover:bg-amber-200 border-2 border-amber-900/40 shadow-playful-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:ring-2 focus-visible:ring-amber-400',
  destructive:
    'bg-red-600 text-white hover:bg-red-700 border-2 border-zinc-900 shadow-playful active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl gap-1.5',
  md: 'px-4 py-2.5 text-sm font-bold rounded-2xl gap-2',
  lg: 'px-6 py-3.5 text-base font-bold rounded-2xl gap-2.5',
}

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    className,
    disabled = false,
    type = 'button',
    onClick,
    icon: Icon,
    iconPosition = 'left',
    to,
    ...props
  },
  ref,
) {
  const content = (
    <>
      {Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4 shrink-0" weight="bold" aria-hidden="true" />
      )}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" weight="bold" aria-hidden="true" />
      )}
    </>
  )

  const combinedClassName = cn(
    'inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 motion-reduce:transition-none motion-reduce:transform-none',
    variants[variant],
    sizes[size],
    className,
  )

  if (to) {
    return (
      <Link
        ref={ref}
        to={to}
        onClick={onClick}
        className={combinedClassName}
        {...props}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={combinedClassName}
      {...props}
    >
      {content}
    </button>
  )
})

