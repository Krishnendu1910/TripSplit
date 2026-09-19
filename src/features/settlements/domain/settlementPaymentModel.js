import { toMinorUnits, fromMinorUnits } from '../../../utils/money'

/**
 * Validates whether an object conforms to a valid settlement payment record.
 *
 * @param {unknown} record
 * @returns {boolean}
 */
export function isValidSettlementPayment(record) {
  if (!record || typeof record !== 'object') {
    return false
  }
  if (typeof record.id !== 'string' || !record.id.trim()) {
    return false
  }
  if (typeof record.tripId !== 'string' || !record.tripId.trim()) {
    return false
  }
  if (typeof record.fromParticipantId !== 'string' || !record.fromParticipantId.trim()) {
    return false
  }
  if (typeof record.toParticipantId !== 'string' || !record.toParticipantId.trim()) {
    return false
  }
  if (
    typeof record.amountMinor !== 'number' ||
    !Number.isFinite(record.amountMinor) ||
    record.amountMinor <= 0 ||
    !Number.isInteger(record.amountMinor)
  ) {
    return false
  }
  if (record.status !== 'pending' && record.status !== 'paid') {
    return false
  }
  return true
}

/**
 * Generates a deterministic, stable lookup key for a settlement payment.
 *
 * @param {string} tripId
 * @param {string} fromParticipantId
 * @param {string} toParticipantId
 * @param {number} amountMinor
 * @returns {string}
 */
export function getSettlementPaymentKey(tripId, fromParticipantId, toParticipantId, amountMinor) {
  return `${tripId}:${fromParticipantId}:${toParticipantId}:${amountMinor}`
}

/**
 * Creates a normalized settlement payment record.
 *
 * @param {{
 *   id?: string,
 *   tripId: string,
 *   fromParticipantId: string,
 *   toParticipantId: string,
 *   amountMinor?: number,
 *   amount?: number,
 *   status?: 'pending' | 'paid',
 *   paidAt?: string | null,
 *   createdAt?: string,
 *   updatedAt?: string
 * }} data
 * @returns {Object} Normalized settlement payment record
 */
export function createSettlementPayment(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Settlement payment data must be an object')
  }

  const {
    id = `sp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    tripId,
    fromParticipantId,
    toParticipantId,
    amountMinor,
    amount,
    status = 'pending',
    paidAt = null,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
  } = data

  if (!tripId || typeof tripId !== 'string' || !tripId.trim()) {
    throw new Error('Valid tripId is required for settlement payment')
  }
  if (!fromParticipantId || typeof fromParticipantId !== 'string' || !fromParticipantId.trim()) {
    throw new Error('Valid fromParticipantId is required for settlement payment')
  }
  if (!toParticipantId || typeof toParticipantId !== 'string' || !toParticipantId.trim()) {
    throw new Error('Valid toParticipantId is required for settlement payment')
  }

  const numericAmountMinor =
    typeof amountMinor === 'number' && Number.isFinite(amountMinor)
      ? Math.round(amountMinor)
      : toMinorUnits(amount)

  if (!Number.isFinite(numericAmountMinor) || numericAmountMinor <= 0) {
    throw new Error('Settlement payment amount must be a positive integer in minor units')
  }

  const computedAmount =
    typeof amount === 'number' && Number.isFinite(amount)
      ? amount
      : fromMinorUnits(numericAmountMinor)

  const isPaid = status === 'paid'

  return {
    id: String(id),
    tripId: String(tripId).trim(),
    fromParticipantId: String(fromParticipantId).trim(),
    toParticipantId: String(toParticipantId).trim(),
    amountMinor: numericAmountMinor,
    amount: computedAmount,
    status: isPaid ? 'paid' : 'pending',
    paidAt: isPaid ? (paidAt || new Date().toISOString()) : null,
    createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
    updatedAt: typeof updatedAt === 'string' ? updatedAt : new Date().toISOString(),
  }
}

