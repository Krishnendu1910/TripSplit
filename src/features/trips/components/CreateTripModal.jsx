import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AirplaneTakeoff, Sparkle } from '@phosphor-icons/react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Button } from '../../../components/ui/Button'
import { SUPPORTED_CURRENCIES } from '../../../constants/currencies'
import { useUIStore } from '../../../store/useUIStore'
import { useTripStore } from '../../../store/useTripStore'
import { validateTripInput } from '../models/tripModel'

export function CreateTripModal() {
  const isOpen = useUIStore((s) => s.isCreateTripModalOpen)
  const closeModal = useUIStore((s) => s.closeCreateTripModal)
  const showToast = useUIStore((s) => s.showToast)
  const createTrip = useTripStore((s) => s.createTrip)
  const navigate = useNavigate()

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
      const newTrip = createTrip(formData)
      showToast(`Created "${newTrip.name}"! Time to split some expenses.`, 'success')

      setFormData({
        name: '',
        destination: '',
        startDate: '',
        endDate: '',
        currency: 'INR',
        description: '',
      })
      setErrors({})
      closeModal()
      navigate(`/trips/${newTrip.id}`)
    } catch (err) {
      if (err.validationErrors) {
        setErrors(err.validationErrors)
      } else {
        showToast('Failed to create trip. Please check your inputs.', 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Plan a new adventure"
      description="Set up your trip details so everyone knows where the money is flying."
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Playful hint banner */}
        <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 font-medium">
          <Sparkle className="w-5 h-5 text-amber-600 shrink-0" weight="fill" />
          <span>
            Tip: You can invite friends and track expenses as soon as your trip is created!
          </span>
        </div>

        {/* Trip Name */}
        <Input
          label="Trip Name"
          name="name"
          placeholder="e.g. Goa Monsoon Getaway, Ladakh Roadtrip"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        {/* Destination */}
        <Input
          label="Destination"
          name="destination"
          placeholder="e.g. Goa, India or Tokyo, Japan"
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
          hint="Default currency for expenses and settlements on this trip."
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
            htmlFor="trip-description"
            className="text-xs font-bold tracking-wide text-zinc-800 uppercase"
          >
            Description (Optional)
          </label>
          <textarea
            id="trip-description"
            name="description"
            rows={2}
            placeholder="Add notes, house rules, or a packing reminder..."
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3.5 py-2 text-sm font-medium bg-white text-zinc-900 border-2 border-zinc-900 rounded-2xl shadow-playful-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-zinc-900 transition-all resize-none"
          />
        </div>

        {/* Modal actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-4 border-t border-zinc-200">
          <Button type="button" variant="ghost" onClick={closeModal} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={AirplaneTakeoff}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Creating...' : 'Create Trip'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
