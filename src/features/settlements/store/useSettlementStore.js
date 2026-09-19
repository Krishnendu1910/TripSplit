import { create } from 'zustand'
import { storageAdapter } from '../../../lib/persistence/storageAdapter'
import { toMinorUnits } from '../../../utils/money'
import {
  createSettlementPayment,
  isValidSettlementPayment,
} from '../domain/settlementPaymentModel'

const STORAGE_KEY = 'settlement_payments'

/**
 * Loads and sanitizes persisted settlement payments from storageAdapter.
 * Deduplicates and discards malformed records to prevent state corruption.
 *
 * @returns {Array<Object>}
 */
function loadPersistedPayments() {
  try {
    const raw = storageAdapter.get(STORAGE_KEY, [])
    if (!Array.isArray(raw)) {
      return []
    }

    const seenIds = new Set()
    const validPayments = []

    for (const item of raw) {
      if (isValidSettlementPayment(item) && !seenIds.has(item.id)) {
        seenIds.add(item.id)
        validPayments.push({
          ...item,
          amountMinor: Math.round(item.amountMinor),
        })
      }
    }

    return validPayments
  } catch {
    return []
  }
}

export const useSettlementStore = create((set, get) => {
  return {
    payments: loadPersistedPayments(),

    /**
     * Force re-read from storageAdapter (useful for hydration / test isolation).
     */
    rehydrate: () => {
      const payments = loadPersistedPayments()
      set({ payments })
      return { payments }
    },

    /**
     * Marks a calculated settlement instruction as paid.
     * Stably matches by tripId, from, to, and amountMinor.
     *
     * @param {string} tripId
     * @param {{ from: string, to: string, amount: number, amountInMinorUnits?: number }} settlement
     * @returns {Object} Updated/created settlement payment record
     */
    markSettlementPaid: (tripId, settlement) => {
      if (!tripId || !settlement || !settlement.from || !settlement.to) {
        throw new Error('Valid tripId and settlement instruction are required')
      }

      const amountMinor =
        typeof settlement.amountInMinorUnits === 'number'
          ? Math.round(settlement.amountInMinorUnits)
          : toMinorUnits(settlement.amount)

      const fromParticipantId = settlement.from
      const toParticipantId = settlement.to

      let targetRecord = null

      set((state) => {
        const existingIdx = state.payments.findIndex(
          (p) =>
            p.tripId === tripId &&
            p.fromParticipantId === fromParticipantId &&
            p.toParticipantId === toParticipantId &&
            p.amountMinor === amountMinor,
        )

        let updated
        const now = new Date().toISOString()

        if (existingIdx >= 0) {
          const existing = state.payments[existingIdx]
          targetRecord = {
            ...existing,
            status: 'paid',
            paidAt: existing.paidAt || now,
            updatedAt: now,
          }
          updated = [...state.payments]
          updated[existingIdx] = targetRecord
        } else {
          targetRecord = createSettlementPayment({
            tripId,
            fromParticipantId,
            toParticipantId,
            amountMinor,
            amount: settlement.amount,
            status: 'paid',
            paidAt: now,
            createdAt: now,
            updatedAt: now,
          })
          updated = [targetRecord, ...state.payments]
        }

        storageAdapter.set(STORAGE_KEY, updated)
        return { payments: updated }
      })

      return targetRecord
    },

    /**
     * Reverts a settlement payment back to pending (optional undo/lifecycle support).
     *
     * @param {string} tripId
     * @param {{ from: string, to: string, amount: number, amountInMinorUnits?: number }} settlement
     */
    markSettlementPending: (tripId, settlement) => {
      if (!tripId || !settlement) return

      const amountMinor =
        typeof settlement.amountInMinorUnits === 'number'
          ? Math.round(settlement.amountInMinorUnits)
          : toMinorUnits(settlement.amount)

      set((state) => {
        const existingIdx = state.payments.findIndex(
          (p) =>
            p.tripId === tripId &&
            p.fromParticipantId === settlement.from &&
            p.toParticipantId === settlement.to &&
            p.amountMinor === amountMinor,
        )

        if (existingIdx < 0) return state

        const now = new Date().toISOString()
        const existing = state.payments[existingIdx]
        const updatedRecord = {
          ...existing,
          status: 'pending',
          paidAt: null,
          updatedAt: now,
        }

        const updated = [...state.payments]
        updated[existingIdx] = updatedRecord

        storageAdapter.set(STORAGE_KEY, updated)
        return { payments: updated }
      })
    },

    /**
     * Returns whether a specific calculated settlement is paid.
     * Stably matches by tripId, from, to, and amountMinor.
     *
     * @param {string} tripId
     * @param {{ from: string, to: string, amount: number, amountInMinorUnits?: number }} settlement
     * @returns {boolean}
     */
    isSettlementPaid: (tripId, settlement) => {
      if (!tripId || !settlement) return false

      const amountMinor =
        typeof settlement.amountInMinorUnits === 'number'
          ? Math.round(settlement.amountInMinorUnits)
          : toMinorUnits(settlement.amount)

      return get().payments.some(
        (p) =>
          p.tripId === tripId &&
          p.fromParticipantId === settlement.from &&
          p.toParticipantId === settlement.to &&
          p.amountMinor === amountMinor &&
          p.status === 'paid',
      )
    },

    /**
     * Returns all payment records belonging to a trip.
     *
     * @param {string} tripId
     * @returns {Array<Object>}
     */
    getPaymentsByTrip: (tripId) => {
      return get().payments.filter((p) => p.tripId === tripId)
    },

    /**
     * Deletes all payment records for a trip (cascading cleanup).
     *
     * @param {string} tripId
     */
    deletePaymentsByTrip: (tripId) => {
      set((state) => {
        const updated = state.payments.filter((p) => p.tripId !== tripId)
        storageAdapter.set(STORAGE_KEY, updated)
        return { payments: updated }
      })
    },

    /**
     * Resets the store and removes persistence key (used in tests).
     */
    resetStore: () => {
      storageAdapter.remove(STORAGE_KEY)
      set({ payments: [] })
    },
  }
})

