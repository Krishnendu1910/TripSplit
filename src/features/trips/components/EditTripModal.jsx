import { useState, useEffect } from 'react'
import { Check } from '@phosphor-icons/react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Button } from '../../../components/ui/Button'
import { SUPPORTED_CURRENCIES } from '../../../constants/currencies'
import { useTripStore } from '../../../store/useTripStore'
import { useUIStore } from '../../../store/useUIStore'
import { validateTripInput } from '../models/tripModel'

export function EditTripModal({ isOpen, onClose, trip }) {
  const updateTrip = useTripStore((s) => s.updateTrip)
  const showToast = useUIStore((s) => s.showToast)

  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    currency: 'INR',
    description: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (trip) {
      setFormData({
        name: trip.name || '',
        destination: trip.destination || '',
        startDate: trip.startDate || '',
        endDate: trip.endDate || '',
        currency: trip.currency || 'INR',
        description: trip.description || '',
      })
      setErrors({})
    }
  }, [trip, isOpen])

  if (!trip) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isSubmitting) return

    const validation = validateTripInput(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)
    try {
      updateTrip(trip.id, formData)
      showToast(`Updated "${formData.name.trim()}" successfully!`, 'success')
      onClose()
    } catch (err) {
      if (err.validationErrors) {
        setErrors(err.validationErrors)
      } else {
        showToast('Failed to update trip. Please check your inputs.', 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Trip Details"
      description="Update trip information, travel dates, or default currency."
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Trip Name */}
        <Input
          label="Trip Name"
          name="name"
          placeholder="e.g. Goa Monsoon Getaway"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        {/* Destination */}
        <Input
          label="Destination"
          name="destination"
          placeholder="e.g. Goa, India"
          value={formData.destination}
          onChange={handleChange}
          error={errors.destination}
          required
        />

        {/* Dates row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            error={errors.startDate}
            required
          />
          <Input
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            error={errors.endDate}
            required
          />
        </div>

        {/* Currency selector */}
        <Select
          label="Currency"
          name="currency"
          value={formData.currency}
          onChange={handleChange}
          error={errors.currency}
          hint="Currency applied for shared expense calculation."
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} ({c.symbol}) — {c.name}
            </option>
          ))}
        </Select>

        {/* Description */}
        <div className="w-full flex flex-col gap-1.5">
          <label
            htmlFor="edit-trip-description"
            className="text-xs font-bold tracking-wide text-zinc-800 uppercase"
          >
            Description (Optional)
          </label>
          <textarea
            id="edit-trip-description"
            name="description"
            rows={2}
            placeholder="Add notes, house rules, or packing reminders..."
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3.5 py-2 text-sm font-medium bg-white text-zinc-900 border-2 border-zinc-900 rounded-2xl shadow-playful-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-zinc-900 transition-all resize-none"
          />
        </div>

        {/* Modal actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-4 border-t border-zinc-200">
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

