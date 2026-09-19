const AVATAR_PALETTE = [
  '#f97316', // orange
  '#0d9488', // teal
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#eab308', // yellow
  '#3b82f6', // blue
  '#10b981', // emerald
  '#6366f1', // indigo
]

/**
 * Deterministically pick an avatar color based on name.
 * @param {string} name
 * @returns {string} hex color
 */
export function pickAvatarColor(name = '') {
  if (!name) return AVATAR_PALETTE[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[index]
}

/**
 * Generate a unique, stable participant identifier.
 * Uses crypto.randomUUID() when available with timestamp fallback.
 */
export function generateParticipantId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `participant-${crypto.randomUUID()}`
  }
  return `participant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Validates participant input according to TripSplit rules:
 * 1. Name is required, trimmed, non-empty.
 * 2. Participant must belong to a tripId.
 * 3. Name must be unique within the same trip (case-insensitive trimmed comparison).
 *
 * @param {Object} input
 * @param {string} input.name
 * @param {string} input.tripId
 * @param {string} [input.excludeId] - ID to exclude for duplicate check when editing
 * @param {Array<Object>} existingParticipants - List of existing participants in the system
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateParticipantInput(input = {}, existingParticipants = []) {
  const errors = {}

  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (!name) {
    errors.name = 'Every squad member needs a name!'
  }

  const tripId = typeof input.tripId === 'string' ? input.tripId.trim() : ''
  if (!tripId) {
    errors.tripId = 'Participant must belong to a trip.'
  }

  if (name && tripId) {
    const normalizedName = name.toLowerCase()
    const duplicate = existingParticipants.find(
      (p) =>
        p.tripId === tripId &&
        p.id !== input.excludeId &&
        typeof p.name === 'string' &&
        p.name.trim().toLowerCase() === normalizedName,
    )

    if (duplicate) {
      errors.name = 'Someone with this name is already on this trip!'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Creates a normalized Participant domain entity.
 * ID is decoupled from the name and remains stable through any edits.
 *
 * @param {Object} input
 * @returns {Object} Participant entity
 */
export function createParticipantModel(input) {
  const now = new Date().toISOString()
  return {
    id: input.id || generateParticipantId(),
    tripId: input.tripId,
    name: input.name.trim(),
    avatarBg: input.avatarBg || pickAvatarColor(input.name.trim()),
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  }
}

