import { isValid, parseISO, format } from 'date-fns'
import { isValidMoneyAmount, toMinorUnits, fromMinorUnits } from '../../../utils/money'

export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: 'ForkKnife' },
  { id: 'transport', label: 'Transport', icon: 'Taxi' },
  { id: 'fuel', label: 'Fuel / Petrol', icon: 'GasPump' },
  { id: 'hotel', label: 'Hotel & Stay', icon: 'Bed' },
  { id: 'activities', label: 'Activities', icon: 'Ticket' },
  { id: 'shopping', label: 'Shopping', icon: 'Bag' },
  { id: 'tickets', label: 'Tickets & Passes', icon: 'Receipt' },
  { id: 'drinks', label: 'Drinks & Nightlife', icon: 'BeerBottle' },
  { id: 'other', label: 'Other', icon: 'DotsThreeCircle' },
]

export const DEFAULT_CATEGORY = 'other'

/**
 * Generate a unique, stable expense identifier.
 * Uses crypto.randomUUID() when available with timestamp fallback.
 */
export function generateExpenseId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `expense-${crypto.randomUUID()}`
  }
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Validates expense input fields according to TripSplit business rules:
 * 1. Description is required, trimmed, non-empty.
 * 2. Amount must be a positive number with at most 2 decimal places.
 * 3. TripId is required.
 * 4. Payer must be a valid participant belonging to the trip.
 * 5. Participants sharing must be non-empty, deduplicated, and belong to the trip.
 * 6. Date must be a valid date.
 *
 * @param {Object} input
 * @param {Object} [context]
 * @param {Object} [context.trip] - Trip entity
 * @param {Array<Object>} [context.participants] - List of participants for the trip
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateExpenseInput(input = {}, context = {}) {
  const errors = {}

  // 1. Description
  const description = typeof input.description === 'string' ? input.description.trim() : ''
  if (!description) {
    errors.description = 'What was this expense for? (e.g. Dinner, Petrol, Hotel)'
  }

  // 2. Amount
  if (!isValidMoneyAmount(input.amount)) {
    errors.amount = 'Please enter a valid positive amount greater than 0.'
  }

  // 3. Trip ID
  const tripId = typeof input.tripId === 'string' ? input.tripId.trim() : ''
  if (!tripId) {
    errors.tripId = 'Expense must belong to a trip.'
  }

  // 4. Trip context check (if provided)
  if (context.trip && context.trip.id !== tripId) {
    errors.tripId = 'Trip does not match expense destination.'
  }

  // 5. Payer validation
  const paidBy = typeof input.paidBy === 'string' ? input.paidBy.trim() : ''
  if (!paidBy) {
    errors.paidBy = 'Please select who paid for this expense.'
  } else if (Array.isArray(context.participants)) {
    const payerExists = context.participants.some(
      (p) => p.id === paidBy && (!p.tripId || p.tripId === tripId),
    )
    if (!payerExists) {
      errors.paidBy = 'Payer must be a registered squad member of this trip.'
    }
  }

  // 6. Participants validation
  const rawParticipantIds = Array.isArray(input.participantIds) ? input.participantIds : []
  const participantIds = Array.from(
    new Set(rawParticipantIds.filter((id) => typeof id === 'string' && id.trim())),
  )

  if (participantIds.length === 0) {
    errors.participantIds = 'Select at least one person who shared this expense.'
  } else if (Array.isArray(context.participants)) {
    const validParticipantIds = new Set(
      context.participants
        .filter((p) => !p.tripId || p.tripId === tripId)
        .map((p) => p.id),
    )
    const allValid = participantIds.every((id) => validParticipantIds.has(id))
    if (!allValid) {
      errors.participantIds = 'All participants must belong to this trip.'
    }
  }

  // 7. Date validation
  const date = input.date
  if (!date) {
    errors.date = 'Please select a date for this expense.'
  } else {
    const parsed = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(parsed)) {
      errors.date = 'Please enter a valid expense date.'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Creates a normalized Expense domain entity.
 * Uses integer minor units internally to prevent floating point inaccuracy.
 *
 * @param {Object} input
 * @returns {Object} Expense entity
 */
export function createExpenseModel(input) {
  const now = new Date().toISOString()
  const minorUnits = toMinorUnits(input.amount)
  const normalizedAmount = fromMinorUnits(minorUnits)

  const rawParticipantIds = Array.isArray(input.participantIds) ? input.participantIds : []
  const uniqueParticipantIds = Array.from(
    new Set(rawParticipantIds.filter((id) => typeof id === 'string' && id.trim())),
  )

  const dateStr =
    typeof input.date === 'string'
      ? input.date
      : format(new Date(), 'yyyy-MM-dd')

  return {
    id: input.id || generateExpenseId(),
    tripId: input.tripId,
    description: input.description.trim(),
    amount: normalizedAmount,
    amountInMinorUnits: minorUnits,
    currency: input.currency || 'INR',
    paidBy: input.paidBy,
    participantIds: uniqueParticipantIds,
    splitType: input.splitType || 'equal',
    splitData: input.splitData || {},
    category: input.category || DEFAULT_CATEGORY,
    date: dateStr,
    note: typeof input.note === 'string' ? input.note.trim() : '',
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  }
}

