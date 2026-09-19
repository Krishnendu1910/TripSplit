import { useEffect, useRef } from 'react'
import { X } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

export function Modal({ isOpen, onClose, title, description, children, className }) {
  const modalRef = useRef(null)
  const previousActiveElement = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    previousActiveElement.current = document.activeElement
    document.body.style.overflow = 'hidden'

    // Focus the first focusable element inside the modal, or the modal container itself
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length > 0) {
          focusables[0].focus()
        } else {
          modalRef.current.focus()
        }
      }
    }, 50)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Focus trapping inside modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        )

        if (focusables.length === 0) {
          e.preventDefault()
          return
        }

        const firstElement = focusables[0]
        const lastElement = focusables[focusables.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(focusTimer)
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200 motion-reduce:transition-none motion-reduce:animate-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-lg bg-white border-3 border-zinc-900 rounded-3xl shadow-playful-lg p-5 sm:p-7 max-h-[90dvh] overflow-y-auto outline-none',
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

