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

export function CreateTripModal() {
  const isOpen = useUIStore((s) => s.isCreateTripModalOpen)
  const closeModal = useUIStore((s) => s.closeCreateTripModal)
  const showToast = useUIStore((s) => s.showToast)
  const addTrip = useTripStore((s) => s.addTrip)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    currency: 'INR',
  })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!formData.name.trim()) {
      errs.name = 'Every grand adventure needs a name!'
    }
    if (!formData.destination.trim()) {
      errs.destination = 'Where are you heading?'
    }
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errs.endDate = 'End date cannot be before start date (unless you invented time travel)'
    }
    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Save trip foundation
    const newTripId = addTrip(formData)
    showToast(`Created "${formData.name}"! Time to split some expenses.`, 'success')

    // Reset form & close
    setFormData({
      name: '',
      destination: '',
      startDate: '',
      endDate: '',
      currency: 'INR',
    })
    setErrors({})
    closeModal()

    // Navigate to new trip overview
    navigate(`/trips/${newTripId}`)
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
            Tip: You can add friends and log expenses right after creating the trip!
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
          />
          <Input
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            error={errors.endDate}
          />
        </div>

        {/* Currency selector */}
        <Select
          label="Currency"
          name="currency"
          value={formData.currency}
          onChange={handleChange}
          hint="Currency for all primary calculations on this trip."
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} ({c.symbol}) — {c.name}
            </option>
          ))}
        </Select>

        {/* Modal actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
          <Button type="button" variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={AirplaneTakeoff}>
            Create Trip
          </Button>
        </div>
      </form>
    </Modal>
  )
}
