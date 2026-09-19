/**
 * Money utilities for TripSplit.
 *
 * Money correctness is critical for group expense calculations.
 * To prevent JavaScript floating-point inaccuracies (e.g. 0.1 + 0.2 = 0.30000000000000004),
 * money amounts are internally represented in integer minor units (e.g. paise / cents).
 * ₹1689.50 -> 168950 minor units.
 */

/**
 * Checks if an amount is a valid positive monetary number.
 * Must be a positive finite number with at most 2 decimal places.
 *
 * @param {number|string} amount
 * @returns {boolean}
 */
export function isValidMoneyAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return false
  }

  const num = typeof amount === 'number' ? amount : Number(amount)
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    return false
  }

  // Check for at most 2 decimal digits
  const str = String(amount).trim()
  const decimalParts = str.split('.')
  if (decimalParts.length === 2 && decimalParts[1].length > 2) {
    return false
  }

  return true
}

/**
 * Converts a standard major currency amount (e.g. ₹1689.50)
 * to integer minor units (e.g. 168950 paise).
 *
 * @param {number|string} amount
 * @returns {number} Integer minor units
 */
export function toMinorUnits(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount)
  if (isNaN(num) || !isFinite(num)) {
    return 0
  }
  return Math.round(num * 100)
}

/**
 * Converts integer minor units back to standard major currency units.
 *
 * @param {number} minorUnits
 * @returns {number} Standard decimal amount
 */
export function fromMinorUnits(minorUnits) {
  if (typeof minorUnits !== 'number' || isNaN(minorUnits)) {
    return 0
  }
  return Number((minorUnits / 100).toFixed(2))
}

/**
 * Calculates the exact sum of an array of minor unit amounts.
 *
 * @param {Array<number>} minorUnitList
 * @returns {number} Total in minor units
 */
export function sumMinorUnits(minorUnitList = []) {
  return minorUnitList.reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0)
}

/**
 * Exact integer addition of minor unit amounts.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function addMinor(a = 0, b = 0) {
  return Math.round((a || 0) + (b || 0))
}

/**
 * Exact integer subtraction of minor unit amounts.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function subtractMinor(a = 0, b = 0) {
  return Math.round((a || 0) - (b || 0))
}

/**
 * Exact integer division with quotient and remainder.
 * @param {number} minor
 * @param {number} divisor
 * @returns {{ quotient: number, remainder: number }}
 */
export function divideMinor(minor = 0, divisor = 1) {
  if (divisor <= 0) {
    return { quotient: 0, remainder: 0 }
  }
  const quotient = Math.floor(minor / divisor)
  const remainder = minor - quotient * divisor
  return { quotient, remainder }
}

/**
 * Deterministically distributes a remainder across participants.
 *
 * DETERMINISTIC REMAINDER RULE:
 * 1. Participants are stably ordered (e.g. alphabetically by stable ID).
 * 2. Each participant receives the integer `baseAmountMinor`.
 * 3. The `remainderMinor` units (0 <= remainder < N) are distributed 1 unit at a time
 *    to the first `remainderMinor` participants in the sorted list.
 * 4. This guarantees that sum(allocations) === totalAmount, with zero lost or created money.
 *
 * Example:
 * 100 paise among 3 people ("p1", "p2", "p3")
 * Base: 33 paise each. Remainder: 1 paise.
 * Result: p1 -> 34, p2 -> 33, p3 -> 33. Total = 100.
 *
 * @param {number} baseAmountMinor - Integer base units each person gets
 * @param {number} remainderMinor - Remaining minor units to distribute (1 each)
 * @param {Array<string>} sortedParticipantIds - Stably ordered participant IDs
 * @returns {Record<string, number>} Map of participantId -> minor units
 */
export function distributeRemainder(baseAmountMinor, remainderMinor, sortedParticipantIds = []) {
  const allocations = {}
  for (let i = 0; i < sortedParticipantIds.length; i++) {
    const id = sortedParticipantIds[i]
    allocations[id] = baseAmountMinor + (i < remainderMinor ? 1 : 0)
  }
  return allocations
}
