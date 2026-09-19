import { Trash, Warning } from '@phosphor-icons/react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { useTripStore } from '../../../store/useTripStore'
import { useUIStore } from '../../../store/useUIStore'

export function DeleteTripModal({ isOpen, onClose, trip, onDeleted }) {
  const deleteTrip = useTripStore((s) => s.deleteTrip)
  const showToast = useUIStore((s) => s.showToast)

  if (!trip) return null

  const handleConfirmDelete = () => {
    const tripName = trip.name
    deleteTrip(trip.id)
    showToast(`Trip "${tripName}" was permanently deleted.`, 'info')
    onClose()
    if (typeof onDeleted === 'function') {
      onDeleted()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Trip Permanently?"
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-900">
          <div className="p-2 bg-red-100 rounded-xl shrink-0 text-red-600">
            <Warning className="w-6 h-6" weight="bold" />
          </div>
          <div className="text-sm">
            <p className="font-extrabold text-red-950">
              This action cannot be undone.
            </p>
            <p className="text-xs text-red-800 mt-1 leading-relaxed">
              Deleting <strong className="font-bold">{trip.name}</strong> will permanently erase all associated trip records from this device.
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-600 leading-relaxed">
          Are you sure you want to remove this trip? If you simply want to tidy your dashboard, you can <strong>Archive</strong> it instead.
        </p>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-zinc-200">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Keep Trip
          </Button>
          <Button
            type="button"
            variant="destructive"
            icon={Trash}
            onClick={handleConfirmDelete}
            className="w-full sm:w-auto"
          >
            Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  )
}

