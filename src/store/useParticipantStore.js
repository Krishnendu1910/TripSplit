import { create } from 'zustand'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import {
  createParticipantModel,
  validateParticipantInput,
} from '../features/participants/models/participantModel'
import { useExpenseStore } from './useExpenseStore'

const STORAGE_KEY = 'participants'

/**
 * Safely loads participants from the storage adapter.
 * Guards against corrupted, malformed, or non-array persisted values.
 */
function loadPersistedParticipants() {
  try {
    const raw = storageAdapter.get(STORAGE_KEY, [])
    if (!Array.isArray(raw)) {
      return []
    }
    const seenIds = new Set()
    const validParticipants = []
    for (const item of raw) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        item.id.trim().length > 0 &&
        typeof item.tripId === 'string' &&
        item.tripId.trim().length > 0 &&
        typeof item.name === 'string' &&
        item.name.trim().length > 0
      ) {
        const trimmedId = item.id.trim()
        if (!seenIds.has(trimmedId)) {
          seenIds.add(trimmedId)
          validParticipants.push({
            ...item,
            id: trimmedId,
            tripId: item.tripId.trim(),
            name: item.name.trim(),
          })
        }
      }
    }
    return validParticipants
  } catch {
    return []
  }
}

export const useParticipantStore = create((set, get) => ({
  participants: loadPersistedParticipants(),

  /**
   * Rehydrates store state from the persistence layer.
   */
  rehydrate: () => {
    const participants = loadPersistedParticipants()
    set({ participants })
    return { participants }
  },

  /**
   * Adds and persists a new participant to a trip.
   * @param {Object} input - { tripId, name, avatarBg }
   * @returns {Object} Newly created participant entity
   */
  addParticipant: (input) => {
    const existing = get().participants
    const validation = validateParticipantInput(input, existing)
    if (!validation.isValid) {
      const error = new Error('Invalid participant input')
      error.validationErrors = validation.errors
      throw error
    }

    const participant = createParticipantModel(input)

    set((state) => {
      const updated = [...state.participants, participant]
      storageAdapter.set(STORAGE_KEY, updated)
      return { participants: updated }
    })

    return participant
  },

  /**
   * Updates an existing participant's name while strictly preserving
   * their stable ID, tripId, and createdAt timestamp.
   * @param {string} id
   * @param {Object} updates - { name }
   * @returns {Object|null} Updated participant entity
   */
  updateParticipant: (id, updates = {}) => {
    const state = get()
    const existingIndex = state.participants.findIndex((p) => p.id === id)
    if (existingIndex === -1) {
      return null
    }

    const existing = state.participants[existingIndex]
    const validation = validateParticipantInput(
      {
        name: updates.name,
        tripId: existing.tripId,
        excludeId: id,
      },
      state.participants,
    )

    if (!validation.isValid) {
      const error = new Error('Invalid participant input')
      error.validationErrors = validation.errors
      throw error
    }

    const updatedParticipant = {
      ...existing,
      name: updates.name.trim(),
      updatedAt: new Date().toISOString(),
    }

    set((s) => {
      const updatedList = [...s.participants]
      updatedList[existingIndex] = updatedParticipant
      storageAdapter.set(STORAGE_KEY, updatedList)
      return { participants: updatedList }
    })

    return updatedParticipant
  },

  /**
   * Permanently removes a participant from storage.
   * Rejects deletion if the participant is referenced by existing expenses.
   * @param {string} id
   */
  removeParticipant: (id) => {
    try {
      const expenses = useExpenseStore.getState().expenses
      const isReferenced = expenses.some(
        (e) =>
          e.paidBy === id ||
          (Array.isArray(e.participantIds) && e.participantIds.includes(id)),
      )
      if (isReferenced) {
        const error = new Error(
          "This person is referenced by existing expenses. Removing them would change your trip's financial history.",
        )
        error.code = 'PARTICIPANT_HAS_FINANCIAL_HISTORY'
        throw error
      }
    } catch (err) {
      if (err.code === 'PARTICIPANT_HAS_FINANCIAL_HISTORY') {
        throw err
      }
    }

    set((state) => {
      const updated = state.participants.filter((p) => p.id !== id)
      storageAdapter.set(STORAGE_KEY, updated)
      return { participants: updated }
    })
  },

  /**
   * Cascading removal: removes all participants belonging to a specific tripId.
   * Called when a trip is permanently deleted.
   * @param {string} tripId
   */
  removeParticipantsByTrip: (tripId) => {
    set((state) => {
      const updated = state.participants.filter((p) => p.tripId !== tripId)
      storageAdapter.set(STORAGE_KEY, updated)
      return { participants: updated }
    })
  },

  /**
   * Retrieve all participants belonging to a specific trip.
   * @param {string} tripId
   * @returns {Array<Object>}
   */
  getParticipantsByTrip: (tripId) => {
    if (!tripId) return []
    return get().participants.filter((p) => p.tripId === tripId)
  },

  /**
   * Retrieve a participant by unique ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getParticipantById: (id) => {
    if (!id) return null
    return get().participants.find((p) => p.id === id) || null
  },

  /**
   * Resets the store and persistence storage (primarily used in tests).
   */
  resetStore: () => {
    storageAdapter.remove(STORAGE_KEY)
    set({ participants: [] })
  },
}))

