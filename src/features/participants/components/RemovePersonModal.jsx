import { Trash, Warning } from '@phosphor-icons/react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { useParticipantStore } from '../../../store/useParticipantStore'
import { useExpenseStore } from '../../../store/useExpenseStore'
import { useUIStore } from '../../../store/useUIStore'

export function RemovePersonModal({ isOpen, onClose, participant }) {
  const removeParticipant = useParticipantStore((s) => s.removeParticipant)
  const allExpenses = useExpenseStore((s) => s.expenses)
  const showToast = useUIStore((s) => s.showToast)

  if (!participant) return null

  const isReferenced = allExpenses.some(
    (e) =>
      e.paidBy === participant.id ||
      (Array.isArray(e.participantIds) && e.participantIds.includes(participant.id)),
  )

  const handleConfirmRemove = () => {
    const personName = participant.name
    try {
      removeParticipant(participant.id)
      showToast(`Removed "${personName}" from the trip.`, 'info')
      onClose()
    } catch (err) {
      showToast(err.message || 'Could not remove person.', 'error')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReferenced ? "Can't remove this person yet" : 'Remove Trip Member?'}
    >
      {isReferenced ? (
        <div className="space-y-4 pt-1">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950">
            <div className="p-2 bg-amber-100 rounded-xl shrink-0 text-amber-600 border border-amber-300">
              <Warning className="w-6 h-6" weight="bold" />
            </div>
            <div className="text-sm">
              <p className="font-black text-amber-950">
                {participant.name} is referenced by existing expenses
              </p>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                This person is referenced by existing expenses. Removing them would change your trip&apos;s financial history.
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            To remove <strong className="font-bold text-zinc-900">{participant.name}</strong>, you must first delete or reassign any expenses where they paid or shared the bill. Alternatively, leave them in the trip.
          </p>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-zinc-200">
            <Button type="button" variant="primary" onClick={onClose} className="w-full sm:w-auto">
              Keep in Squad
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-900">
            <div className="p-2 bg-red-100 rounded-xl shrink-0 text-red-600">
              <Warning className="w-6 h-6" weight="bold" />
            </div>
            <div className="text-sm">
              <p className="font-extrabold text-red-950">
                Remove {participant.name} from squad?
              </p>
              <p className="text-xs text-red-800 mt-1 leading-relaxed">
                This person will no longer be listed among the participants sharing expenses on this trip.
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed">
            Are you sure you want to remove <strong className="font-bold text-zinc-900">{participant.name}</strong>?
          </p>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-zinc-200">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
              Keep in Squad
            </Button>
            <Button
              type="button"
              variant="destructive"
              icon={Trash}
              onClick={handleConfirmRemove}
              className="w-full sm:w-auto"
            >
              Remove Person
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
