import { useState, useEffect, useMemo } from 'react'
import { Check, CaretDown, CaretUp } from '@phosphor-icons/react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Button } from '../../../components/ui/Button'
import { EXPENSE_CATEGORIES, DEFAULT_CATEGORY } from '../models/expenseModel'
import { useExpenseStore } from '../../../store/useExpenseStore'
import { useParticipantStore } from '../../../store/useParticipantStore'
import { useUIStore } from '../../../store/useUIStore'

const SYMBOL_MAP = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  THB: '฿',
  AED: 'AED',
  JPY: '¥',
  AUD: 'A$',
}

export function EditExpenseModal({ isOpen, onClose, expense, trip }) {
  const updateExpense = useExpenseStore((s) => s.updateExpense)
  const allParticipants = useParticipantStore((s) => s.participants)
  const participants = useMemo(
    () => allParticipants.filter((p) => p.tripId === trip.id),
    [allParticipants, trip.id],
  )
  const showToast = useUIStore((s) => s.showToast)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitMode, setSplitMode] = useState('everyone')
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([])
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [category, setCategory] = useState(DEFAULT_CATEGORY)
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currencySymbol = SYMBOL_MAP[trip.currency] || trip.currency || '₹'

  useEffect(() => {
    if (expense && isOpen) {
      setDescription(expense.description || '')
      setAmount(String(expense.amount ?? ''))
      setPaidBy(expense.paidBy || participants[0]?.id || '')

      const isEveryone =
        Array.isArray(expense.participantIds) &&
        participants.length > 0 &&
        expense.participantIds.length === participants.length &&
        participants.every((p) => expense.participantIds.includes(p.id))

      setSplitMode(isEveryone ? 'everyone' : 'custom')
      setSelectedParticipantIds(
        Array.isArray(expense.participantIds) && expense.participantIds.length > 0
          ? expense.participantIds
          : participants.map((p) => p.id),
      )
      setCategory(expense.category || DEFAULT_CATEGORY)
      setDate(expense.date || '')
      setNote(expense.note || '')
      setShowMoreOptions(Boolean(expense.note || expense.category !== DEFAULT_CATEGORY))
      setErrors({})
      setIsSubmitting(false)
    }
  }, [expense, isOpen, trip.id, participants])

  if (!expense) return null

  const toggleParticipantSelection = (pId) => {
    setSelectedParticipantIds((prev) => {
      const isSelected = prev.includes(pId)
      if (isSelected) {
        return prev.filter((id) => id !== pId)
      }
      return [...prev, pId]
    })
    if (errors.participantIds) {
      setErrors((prev) => ({ ...prev, participantIds: null }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isSubmitting) return

    const effectiveParticipantIds =
      splitMode === 'everyone'
        ? participants.map((p) => p.id)
        : selectedParticipantIds

    const updates = {
      description,
      amount: parseFloat(amount),
      paidBy,
      participantIds: effectiveParticipantIds,
      category,
      date,
      note,
    }

    setIsSubmitting(true)
    try {
      const updated = updateExpense(expense.id, updates)
      showToast(`Updated "${updated.description}" successfully!`, 'success')
      onClose()
    } catch (err) {
      if (err.validationErrors) {
        setErrors(err.validationErrors)
      } else {
        showToast(err.message || 'Could not update expense.', 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Expense"
      description="Update expense details, amount, payer, or split configuration."
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Description */}
        <Input
          id="edit-expense-description"
          label="What was it?"
          name="description"
          placeholder="e.g. Dinner, Petrol, Hotel"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            if (errors.description) setErrors((prev) => ({ ...prev, description: null }))
          }}
          error={errors.description}
          required
          autoFocus
        />

        {/* Amount with clean currency prefix */}
        <div className="w-full flex flex-col gap-1.5">
          <label
            htmlFor="edit-expense-amount"
            className="text-xs font-bold tracking-wide text-zinc-800 uppercase flex items-center gap-1"
          >
            Amount
            <span className="text-orange-500">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-zinc-700 font-black text-base select-none pointer-events-none">
              {currencySymbol}
            </span>
            <input
              id="edit-expense-amount"
              name="amount"
              type="number"
              step="any"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }))
              }}
              className="w-full pl-10 pr-3.5 py-2.5 text-base font-extrabold bg-white text-zinc-900 border-2 border-zinc-900 rounded-2xl shadow-playful-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-zinc-900 transition-all"
              required
            />
          </div>
          {errors.amount && (
            <span className="text-xs font-semibold text-red-600">{errors.amount}</span>
          )}
        </div>

        {/* Paid By */}
        <Select
          id="edit-expense-paid-by"
          label="Paid by"
          name="paidBy"
          value={paidBy}
          onChange={(e) => {
            setPaidBy(e.target.value)
            if (errors.paidBy) setErrors((prev) => ({ ...prev, paidBy: null }))
          }}
          error={errors.paidBy}
          required
        >
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        {/* Who Shared / Split */}
        <div className="w-full flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold tracking-wide text-zinc-800 uppercase">
              Shared by
            </label>
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-300">
              <button
                type="button"
                onClick={() => {
                  setSplitMode('everyone')
                  setSelectedParticipantIds(participants.map((p) => p.id))
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  splitMode === 'everyone'
                    ? 'bg-orange-500 text-white shadow-playful-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Everyone ({participants.length})
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('custom')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  splitMode === 'custom'
                    ? 'bg-orange-500 text-white shadow-playful-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Select people
              </button>
            </div>
          </div>

          {/* Custom participant selection checkboxes */}
          {splitMode === 'custom' && (
            <div className="p-3 bg-zinc-50 border-2 border-zinc-900 rounded-2xl space-y-2 animate-in fade-in duration-150">
              <span className="text-xs text-zinc-500 font-semibold block">
                Check everyone who shared this bill:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {participants.map((p) => {
                  const isChecked = selectedParticipantIds.includes(p.id)
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border-2 cursor-pointer select-none transition-all outline-none focus-within:ring-2 focus-within:ring-orange-400 focus-within:ring-offset-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange-400 ${
                        isChecked
                          ? 'bg-white border-zinc-900 shadow-playful-xs'
                          : 'bg-zinc-100/70 border-zinc-200 text-zinc-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        aria-label={p.name}
                        checked={isChecked}
                        onChange={() => toggleParticipantSelection(p.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-orange-500 border-zinc-900 text-white'
                            : 'bg-white border-zinc-400'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" weight="bold" />}
                      </div>
                      <span className="text-xs font-bold truncate text-zinc-900">
                        {p.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
          {errors.participantIds && (
            <span className="text-xs font-semibold text-red-600">
              {errors.participantIds}
            </span>
          )}
        </div>

        {/* Expandable Optional Details (Category, Date, Note) */}
        <div className="pt-1 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setShowMoreOptions((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-colors py-1 cursor-pointer"
          >
            {showMoreOptions ? (
              <CaretUp className="w-3.5 h-3.5" weight="bold" />
            ) : (
              <CaretDown className="w-3.5 h-3.5" weight="bold" />
            )}
            <span>{showMoreOptions ? 'Hide extra details' : 'More details (Category, Date, Note)'}</span>
          </button>

          {showMoreOptions && (
            <div className="space-y-3 pt-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <Select
                  id="edit-expense-category"
                  label="Category (Optional)"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>

                {/* Date */}
                <Input
                  id="edit-expense-date"
                  label="Expense Date"
                  name="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  error={errors.date}
                />
              </div>

              {/* Note */}
              <div className="w-full flex flex-col gap-1.5">
                <label
                  htmlFor="edit-expense-note"
                  className="text-xs font-bold tracking-wide text-zinc-800 uppercase"
                >
                  Note (Optional)
                </label>
                <textarea
                  id="edit-expense-note"
                  name="note"
                  rows={2}
                  placeholder="Add any notes, receipts info, or context..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-medium bg-white text-zinc-900 border-2 border-zinc-900 rounded-2xl shadow-playful-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-zinc-900 transition-all resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
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

