import { useEffect, useRef } from 'react'
import { X } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

export function Modal({ isOpen, onClose, title, description, children, className }) {
  const modalRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-w-lg bg-white border-3 border-zinc-900 rounded-3xl shadow-playful-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h2 id="modal-title" className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-description" className="text-sm text-zinc-600 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 -mr-2 -mt-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer border-2 border-transparent hover:border-zinc-900"
          >
            <X className="w-5 h-5" weight="bold" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  )
}
