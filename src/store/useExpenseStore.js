import { create } from 'zustand'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import {
  createExpenseModel,
  validateExpenseInput,
} from '../features/expenses/models/expenseModel'
import { useTripStore } from './useTripStore'
import { useParticipantStore } from './useParticipantStore'
import { sumMinorUnits, fromMinorUnits, toMinorUnits } from '../utils/money'

const STORAGE_KEY = 'expenses'

/**
 * Safely loads expenses from storage.
 * Guards against corrupted, malformed, or non-array values.
 */
function loadPersistedExpenses() {
  try {
    const raw = storageAdapter.get(STORAGE_KEY, [])
    if (!Array.isArray(raw)) {
      return []
    }
    const seenIds = new Set()
    const validExpenses = []
    for (const item of raw) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        item.id.trim().length > 0 &&
        typeof item.tripId === 'string' &&
        item.tripId.trim().length > 0 &&
        typeof item.description === 'string' &&
        item.description.trim().length > 0 &&
        typeof item.amount === 'number' &&
        !isNaN(item.amount) &&
        Number.isFinite(item.amount) &&
        item.amount > 0 &&
        typeof item.paidBy === 'string' &&
        item.paidBy.trim().length > 0 &&
        Array.isArray(item.participantIds) &&
        item.participantIds.length > 0 &&
        item.participantIds.some(
          (pId) => typeof pId === 'string' && pId.trim().length > 0,
        )
      ) {
        const trimmedId = item.id.trim()
        if (!seenIds.has(trimmedId)) {
          seenIds.add(trimmedId)
          const deduplicatedParticipantIds = Array.from(
            new Set(
              item.participantIds
                .filter((pId) => typeof pId === 'string' && pId.trim().length > 0)
                .map((pId) => pId.trim()),
            ),
          )
          if (deduplicatedParticipantIds.length === 0) continue

          const amountInMinorUnits =
            typeof item.amountInMinorUnits === 'number' &&
            Number.isInteger(item.amountInMinorUnits) &&
            item.amountInMinorUnits > 0
              ? item.amountInMinorUnits
              : toMinorUnits(item.amount)

          validExpenses.push({
            ...item,
            id: trimmedId,
            tripId: item.tripId.trim(),
            description: item.description.trim(),
            paidBy: item.paidBy.trim(),
            participantIds: deduplicatedParticipantIds,
            amountInMinorUnits,
          })
        }
      }
    }
    return validExpenses
  } catch {
    return []
  }
}

export const useExpenseStore = create((set, get) => ({
  expenses: loadPersistedExpenses(),

  /**
   * Rehydrates store state from the persistence layer.
   */
  rehydrate: () => {
    const expenses = loadPersistedExpenses()
    set({ expenses })
    return { expenses }
  },

  /**
   * Creates and persists a new expense.
   * Performs domain validation and participant integrity checks.
   *
   * @param {Object} input
   * @returns {Object} Newly created expense entity
   */
  createExpense: (input) => {
    const tripId = input?.tripId
    const trip = useTripStore.getState().getTripById(tripId)
    if (!trip) {
      const error = new Error('Trip not found')
      error.validationErrors = { tripId: 'The referenced trip does not exist.' }
      throw error
    }

    const participants = useParticipantStore.getState().getParticipantsByTrip(tripId)
    const validation = validateExpenseInput(input, { trip, participants })
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      const error = new Error(firstError || 'Invalid expense input')
      error.validationErrors = validation.errors
      throw error
    }

    const expense = createExpenseModel({
      ...input,
      currency: input.currency || trip.currency || 'INR',
    })

    set((state) => {
      const updated = [expense, ...state.expenses]
      storageAdapter.set(STORAGE_KEY, updated)
      return { expenses: updated }
    })

    return expense
  },

  /**
   * Updates an existing expense while preserving its stable ID,
   * tripId, and createdAt timestamp.
   *
   * @param {string} id
   * @param {Object} updates
   * @returns {Object|null}
   */
  updateExpense: (id, updates = {}) => {
    const state = get()
    const existingIndex = state.expenses.findIndex((e) => e.id === id)
    if (existingIndex === -1) {
      return null
    }

    const existing = state.expenses[existingIndex]
    const tripId = existing.tripId
    const trip = useTripStore.getState().getTripById(tripId)
    const participants = useParticipantStore.getState().getParticipantsByTrip(tripId)

    const merged = {
      ...existing,
      ...updates,
      id: existing.id,
      tripId, // ensure tripId is never overwritten
      createdAt: existing.createdAt,
    }

    const validation = validateExpenseInput(merged, { trip, participants })
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      const error = new Error(firstError || 'Invalid expense input')
      error.validationErrors = validation.errors
      throw error
    }

    const minorUnits = toMinorUnits(merged.amount)
    const normalizedAmount = fromMinorUnits(minorUnits)

    const rawParticipantIds = Array.isArray(merged.participantIds)
      ? merged.participantIds
      : existing.participantIds
    const uniqueParticipantIds = Array.from(
      new Set(rawParticipantIds.filter((pId) => typeof pId === 'string' && pId.trim())),
    )

    const updatedExpense = {
      ...existing,
      id: existing.id,
      tripId: existing.tripId,
      createdAt: existing.createdAt,
      description: typeof merged.description === 'string' ? merged.description.trim() : existing.description,
      amount: normalizedAmount,
      amountInMinorUnits: minorUnits,
      currency: merged.currency || existing.currency,
      paidBy: merged.paidBy || existing.paidBy,
      participantIds: uniqueParticipantIds,
      splitType: merged.splitType || existing.splitType,
      splitData: merged.splitData || existing.splitData,
      category: merged.category || existing.category,
      date: merged.date || existing.date,
      note: typeof merged.note === 'string' ? merged.note.trim() : existing.note,
      updatedAt: new Date().toISOString(),
    }

    set((s) => {
      const updatedList = [...s.expenses]
      updatedList[existingIndex] = updatedExpense
      storageAdapter.set(STORAGE_KEY, updatedList)
      return { expenses: updatedList }
    })

    return updatedExpense
  },

  /**
   * Permanently deletes an expense from storage.
   * @param {string} id
   */
  deleteExpense: (id) => {
    set((state) => {
      const updated = state.expenses.filter((e) => e.id !== id)
      storageAdapter.set(STORAGE_KEY, updated)
      return { expenses: updated }
    })
  },

  /**
   * Cascading removal: removes all expenses belonging to a specific tripId.
   * Called when a trip is permanently deleted.
   * @param {string} tripId
   */
  deleteExpensesByTrip: (tripId) => {
    set((state) => {
      const updated = state.expenses.filter((e) => e.tripId !== tripId)
      storageAdapter.set(STORAGE_KEY, updated)
      return { expenses: updated }
    })
  },

  /**
   * Retrieve all expenses belonging to a specific trip.
   * @param {string} tripId
   * @returns {Array<Object>}
   */
  getExpensesByTrip: (tripId) => {
    if (!tripId) return []
    return get().expenses.filter((e) => e.tripId === tripId)
  },

  /**
   * Retrieve an expense by unique ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getExpenseById: (id) => {
    if (!id) return null
    return get().expenses.find((e) => e.id === id) || null
  },

  /**
   * Calculates the exact total spent on a trip in major units.
   * Sums minor units first to avoid floating point drift.
   * @param {string} tripId
   * @returns {number} Total amount in major units
   */
  getTotalSpentByTrip: (tripId) => {
    const tripExpenses = get().expenses.filter((e) => e.tripId === tripId)
    const minorUnitsList = tripExpenses.map((e) => e.amountInMinorUnits || toMinorUnits(e.amount))
    const totalMinor = sumMinorUnits(minorUnitsList)
    return fromMinorUnits(totalMinor)
  },

  /**
   * Resets the store and persistence storage (primarily used in tests).
   */
  resetStore: () => {
    storageAdapter.remove(STORAGE_KEY)
    set({ expenses: [] })
  },
}))

