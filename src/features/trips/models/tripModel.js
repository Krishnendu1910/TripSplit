import { isValid, parseISO } from 'date-fns'
import { SUPPORTED_CURRENCIES } from '../../../constants/currencies'

/**
 * Generate a unique, stable trip identifier.
 * Uses crypto.randomUUID() when available with timestamp fallback.
 */
export function generateTripId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `trip-${crypto.randomUUID()}`
  }
  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Validates trip input fields according to TripSplit business rules.
 * @param {Object} input
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateTripInput(input = {}) {
  const errors = {}

  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (!name) {
    errors.name = 'Every grand adventure needs a name!'
  }

  const destination = typeof input.destination === 'string' ? input.destination.trim() : ''
  if (!destination) {
    errors.destination = 'Where are you heading?'
  }

  const startDate = input.startDate
  if (!startDate) {
    errors.startDate = 'Please select a start date.'
  } else {
    const parsedStart = typeof startDate === 'string' ? parseISO(startDate) : startDate
    if (!isValid(parsedStart)) {
      errors.startDate = 'Please enter a valid start date.'
    }
  }

  const endDate = input.endDate
  if (!endDate) {
    errors.endDate = 'Please select an end date.'
  } else {
    const parsedEnd = typeof endDate === 'string' ? parseISO(endDate) : endDate
    if (!isValid(parsedEnd)) {
      errors.endDate = 'Please enter a valid end date.'
    }
  }

  if (startDate && endDate && !errors.startDate && !errors.endDate) {
    if (endDate < startDate) {
      errors.endDate = 'End date cannot be before start date (unless you invented time travel)'
    }
  }

  const currency = input.currency || 'INR'
  const isSupportedCurrency = SUPPORTED_CURRENCIES.some((c) => c.code === currency)
  if (!isSupportedCurrency) {
    errors.currency = `Unsupported currency: ${currency}`
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Creates a normalized, validated Trip domain entity.
 * Financial values are intentionally derived rather than stored permanently.
 *
 * @param {Object} input
 * @returns {Object} Trip entity
 */
export function createTripModel(input) {
  const now = new Date().toISOString()
  return {
    id: input.id || generateTripId(),
    name: input.name.trim(),
    destination: input.destination.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    currency: input.currency || 'INR',
    description: typeof input.description === 'string' ? input.description.trim() : '',
    status: input.status === 'archived' ? 'archived' : 'active',
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  }
}

