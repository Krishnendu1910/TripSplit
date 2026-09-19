import { useState, useEffect } from 'react'
import { UserPlus } from '@phosphor-icons/react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useParticipantStore } from '../../../store/useParticipantStore'
import { useUIStore } from '../../../store/useUIStore'

export function AddPersonModal({ isOpen, onClose, tripId }) {
  const addParticipant = useParticipantStore((s) => s.addParticipant)
  const showToast = useUIStore((s) => s.showToast)

  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isSubmitting) return

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Every squad member needs a name!')
      return
    }

    setIsSubmitting(true)
    try {
      const created = addParticipant({ tripId, name: trimmed })
      showToast(`Added "${created.name}" to the trip!`, 'success')
      onClose()
    } catch (err) {
      if (err.validationErrors?.name) {
        setError(err.validationErrors.name)
      } else {
        setError(err.message || 'Could not add person. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Squad Member"
      description="Add a friend who will be sharing expenses on this trip."
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          id="add-member-name"
          label="Member Name"
          name="name"
          placeholder="e.g. Rahul, Priya, Alex"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError(null)
          }}
          error={error}
          required
          autoFocus
        />

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-zinc-200">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={UserPlus}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Adding...' : 'Add to Squad'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
