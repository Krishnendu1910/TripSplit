import { useState, useEffect } from 'react'
import { Check } from '@phosphor-icons/react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useParticipantStore } from '../../../store/useParticipantStore'
import { useUIStore } from '../../../store/useUIStore'

export function EditPersonModal({ isOpen, onClose, participant }) {
  const updateParticipant = useParticipantStore((s) => s.updateParticipant)
  const showToast = useUIStore((s) => s.showToast)

  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (participant && isOpen) {
      setName(participant.name || '')
      setError(null)
      setIsSubmitting(false)
    }
  }, [participant, isOpen])

  if (!participant) return null

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
      const updated = updateParticipant(participant.id, { name: trimmed })
      showToast(`Updated "${updated.name}" successfully!`, 'success')
      onClose()
    } catch (err) {
      if (err.validationErrors?.name) {
        setError(err.validationErrors.name)
      } else {
        setError(err.message || 'Could not update person. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Squad Member"
      description="Update this person's display name. Their ID and linked records will be preserved."
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          id="edit-member-name"
          label="Member Name"
          name="name"
          placeholder="e.g. Rahul Sarkar"
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
            icon={Check}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
