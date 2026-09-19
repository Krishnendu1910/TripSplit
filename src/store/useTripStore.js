import { create } from 'zustand'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import { createTripModel, validateTripInput } from '../features/trips/models/tripModel'
import { useParticipantStore } from './useParticipantStore'
import { useExpenseStore } from './useExpenseStore'
import { useSettlementStore } from './useSettlementStore'

const STORAGE_KEY = 'trips'
const ACTIVE_TRIP_KEY = 'active_trip_id'

/**
 * Safely loads trips from the storage adapter.
 * Guards against corrupted, malformed, or non-array persisted values.
 */
function loadPersistedTrips() {
  try {
    const raw = storageAdapter.get(STORAGE_KEY, [])
    if (!Array.isArray(raw)) {
      return []
    }
    const seenIds = new Set()
    const validTrips = []
    for (const item of raw) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        item.id.trim().length > 0 &&
        typeof item.name === 'string' &&
        item.name.trim().length > 0
      ) {
        const trimmedId = item.id.trim()
        if (!seenIds.has(trimmedId)) {
          seenIds.add(trimmedId)
          validTrips.push({
            ...item,
            id: trimmedId,
            name: item.name.trim(),
            status: item.status === 'archived' ? 'archived' : 'active',
          })
        }
      }
    }
    return validTrips
  } catch {
    return []
  }
}

/**
 * Safely loads active trip ID from storage, verifying it references an existing trip.
 */
function loadPersistedActiveTripId(trips) {
  try {
    const raw = storageAdapter.get(ACTIVE_TRIP_KEY, null)
    if (typeof raw === 'string' && trips.some((t) => t.id === raw)) {
      return raw
    }
    return null
  } catch {
    return null
  }
}

export const useTripStore = create((set, get) => {
  const initialTrips = loadPersistedTrips()
  return {
    trips: initialTrips,
    activeTripId: loadPersistedActiveTripId(initialTrips),

    /**
     * Rehydrates store state from the persistence layer.
     */
    rehydrate: () => {
      const trips = loadPersistedTrips()
      const activeTripId = loadPersistedActiveTripId(trips)
      set({ trips, activeTripId })
      return { trips, activeTripId }
    },

    /**
     * Creates and persists a new trip.
     * @param {Object} input
     * @returns {Object} Newly created trip entity
     */
    createTrip: (input) => {
      const validation = validateTripInput(input)
      if (!validation.isValid) {
        const error = new Error('Invalid trip input')
        error.validationErrors = validation.errors
        throw error
      }

      const trip = createTripModel(input)

      set((state) => {
        const updated = [trip, ...state.trips]
        storageAdapter.set(STORAGE_KEY, updated)
        storageAdapter.set(ACTIVE_TRIP_KEY, trip.id)
        return { trips: updated, activeTripId: trip.id }
      })

    return trip
  },

  /**
   * Updates metadata on an existing trip.
   * Preserves id, createdAt, and related data references.
   * @param {string} id
   * @param {Object} updates
   * @returns {Object|null} Updated trip entity
   */
  updateTrip: (id, updates) => {
    const state = get()
    const existingIndex = state.trips.findIndex((t) => t.id === id)
    if (existingIndex === -1) {
      return null
    }

    const existing = state.trips[existingIndex]
    const merged = {
      ...existing,
      ...updates,
      name: typeof updates.name === 'string' ? updates.name : existing.name,
      destination:
        typeof updates.destination === 'string'
          ? updates.destination
          : existing.destination,
      description:
        typeof updates.description === 'string'
          ? updates.description
          : existing.description,
    }

    const validation = validateTripInput(merged)
    if (!validation.isValid) {
      const error = new Error('Invalid trip input')
      error.validationErrors = validation.errors
      throw error
    }

    const updatedTrip = {
      ...existing,
      name: merged.name.trim(),
      destination: merged.destination.trim(),
      startDate: merged.startDate,
      endDate: merged.endDate,
      currency: merged.currency,
      description: typeof merged.description === 'string' ? merged.description.trim() : '',
      updatedAt: new Date().toISOString(),
    }

    set((s) => {
      const updatedList = [...s.trips]
      updatedList[existingIndex] = updatedTrip
      storageAdapter.set(STORAGE_KEY, updatedList)
      return { trips: updatedList }
    })

    return updatedTrip
  },

  /**
   * Marks a trip as archived without deleting its data.
   * @param {string} id
   */
  archiveTrip: (id) => {
    set((state) => {
      const updated = state.trips.map((t) =>
        t.id === id
          ? { ...t, status: 'archived', updatedAt: new Date().toISOString() }
          : t,
      )
      storageAdapter.set(STORAGE_KEY, updated)
      return { trips: updated }
    })
  },

  /**
   * Restores an archived trip to active status.
   * @param {string} id
   */
  unarchiveTrip: (id) => {
    set((state) => {
      const updated = state.trips.map((t) =>
        t.id === id
          ? { ...t, status: 'active', updatedAt: new Date().toISOString() }
          : t,
      )
      storageAdapter.set(STORAGE_KEY, updated)
      return { trips: updated }
    })
  },

  /**
   * Permanently deletes a trip from storage.
   * @param {string} id
   */
  deleteTrip: (id) => {
    // Cascading delete: expenses first, then participants belonging to this trip
    try {
      useExpenseStore.getState().deleteExpensesByTrip(id)
      useParticipantStore.getState().removeParticipantsByTrip(id)
      useSettlementStore.getState().deletePaymentsByTrip(id)
    } catch {
      // safe fallback
    }

    set((state) => {
      const updated = state.trips.filter((t) => t.id !== id)
      storageAdapter.set(STORAGE_KEY, updated)
      const nextActiveId =
        state.activeTripId === id ? updated[0]?.id || null : state.activeTripId
      if (nextActiveId) {
        storageAdapter.set(ACTIVE_TRIP_KEY, nextActiveId)
      } else {
        storageAdapter.remove(ACTIVE_TRIP_KEY)
      }
      return { trips: updated, activeTripId: nextActiveId }
    })
  },

  /**
   * Retrieve a trip by its unique ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getTripById: (id) => {
    if (!id) return null
    return get().trips.find((t) => t.id === id) || null
  },

  /**
   * Active trips selector
   */
  getActiveTrips: () => {
    return get().trips.filter((t) => t.status !== 'archived')
  },

  /**
   * Archived trips selector
   */
  getArchivedTrips: () => {
    return get().trips.filter((t) => t.status === 'archived')
  },
  setActiveTripId: (id) => {
    if (!id) {
      storageAdapter.remove(ACTIVE_TRIP_KEY)
      set({ activeTripId: null })
      return
    }
    const exists = get().trips.some((t) => t.id === id)
    const validId = exists ? id : null
    if (validId) {
      storageAdapter.set(ACTIVE_TRIP_KEY, validId)
    } else {
      storageAdapter.remove(ACTIVE_TRIP_KEY)
    }
    set({ activeTripId: validId })
  },

  /**
   * Resets the store and persistence storage (primarily used in tests).
   */
  resetStore: () => {
    storageAdapter.remove(STORAGE_KEY)
    storageAdapter.remove(ACTIVE_TRIP_KEY)
    set({ trips: [], activeTripId: null })
  },
}
})
