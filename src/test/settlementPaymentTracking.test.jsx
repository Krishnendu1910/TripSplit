import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useExpenseStore } from '../store/useExpenseStore'
import { useSettlementStore } from '../store/useSettlementStore'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import {
  createSettlementPayment,
  isValidSettlementPayment,
  getSettlementPaymentKey,
} from '../features/settlements/domain/settlementPaymentModel'
import { calculateBalances, calculateSettlements } from '../features/finance'
import { AppShell } from '../components/layout/AppShell'
import { AppRoutes } from '../App'

function renderWithRouter(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </MemoryRouter>,
  )
}

describe('Settlement Payment Tracking — Full Lifecycle & Persistence', () => {
  beforeEach(() => {
    if (typeof globalThis.localStorage !== 'undefined' && globalThis.localStorage.clear) {
      globalThis.localStorage.clear()
    }
    useTripStore.getState().resetStore()
    useParticipantStore.getState().resetStore()
    useExpenseStore.getState().resetStore()
    useSettlementStore.getState().resetStore()
  })

  // 1. Domain Model validation
  describe('Domain Model & Deterministic Identity', () => {
    it('creates a valid settlement payment record with minor units and deterministic key', () => {
      const record = createSettlementPayment({
        tripId: 'trip-1',
        fromParticipantId: 'p-1',
        toParticipantId: 'p-2',
        amount: 50.25,
        status: 'paid',
      })

      expect(record.tripId).toBe('trip-1')
      expect(record.fromParticipantId).toBe('p-1')
      expect(record.toParticipantId).toBe('p-2')
      expect(record.amount).toBe(50.25)
      expect(record.amountMinor).toBe(5025)
      expect(record.status).toBe('paid')
      expect(typeof record.paidAt).toBe('string')
    })

    it('validates settlement payment objects and rejects malformed inputs', () => {
      expect(isValidSettlementPayment(null)).toBe(false)
      expect(isValidSettlementPayment({})).toBe(false)
      expect(
        isValidSettlementPayment({
          id: 'sp-1',
          tripId: 't1',
          fromParticipantId: 'p1',
          toParticipantId: 'p2',
          amountMinor: -500, // Negative amount
          status: 'paid',
        }),
      ).toBe(false)
      expect(
        isValidSettlementPayment({
          id: 'sp-1',
          tripId: 't1',
          fromParticipantId: 'p1',
          toParticipantId: 'p2',
          amountMinor: 10000,
          status: 'paid',
        }),
      ).toBe(true)
    })

    it('generates consistent deterministic settlement keys', () => {
      const key1 = getSettlementPaymentKey('trip-xyz', 'p-a', 'p-b', 1200)
      const key2 = getSettlementPaymentKey('trip-xyz', 'p-a', 'p-b', 1200)
      const keyDiffAmount = getSettlementPaymentKey('trip-xyz', 'p-a', 'p-b', 1300)
      expect(key1).toBe('trip-xyz:p-a:p-b:1200')
      expect(key1).toBe(key2)
      expect(key1).not.toBe(keyDiffAmount)
    })
  })

  // 2. Settlement Store Lifecycle & Storage Persistence
  describe('Store State & Persistence', () => {
    it('1. Settlement payment store starts empty', () => {
      const store = useSettlementStore.getState()
      expect(store.payments).toEqual([])
      expect(store.getPaymentsByTrip('trip-1')).toEqual([])
    })

    it('2 & 3. Mark settlement as paid persists to LocalStorage via storageAdapter', () => {
      const settlement = { from: 'p-1', to: 'p-2', amount: 350 }
      useSettlementStore.getState().markSettlementPaid('trip-100', settlement)

      expect(useSettlementStore.getState().isSettlementPaid('trip-100', settlement)).toBe(true)

      // Verify persisted in LocalStorage under 'settlement_payments'
      const persisted = storageAdapter.get('settlement_payments')
      expect(persisted).toBeTruthy()
      expect(Array.isArray(persisted)).toBe(true)
      expect(persisted.length).toBe(1)
      const record = persisted[0]
      expect(record.tripId).toBe('trip-100')
      expect(record.amountMinor).toBe(35000)
      expect(record.status).toBe('paid')
    })

    it('4. Paid state survives store hydration / browser re-initialization', () => {
      const settlement = { from: 'alice', to: 'bob', amount: 150.5 }
      useSettlementStore.getState().markSettlementPaid('trip-rehydrate', settlement)

      // Rehydrate into a clean memory state
      useSettlementStore.setState({ payments: [] })
      expect(useSettlementStore.getState().isSettlementPaid('trip-rehydrate', settlement)).toBe(false)

      useSettlementStore.getState().rehydrate()
      expect(useSettlementStore.getState().isSettlementPaid('trip-rehydrate', settlement)).toBe(true)
    })

    it('9. Trip isolation: Trip A payments do not affect Trip B', () => {
      const settlementA = { from: 'user-1', to: 'user-2', amount: 200 }
      const settlementB = { from: 'user-1', to: 'user-2', amount: 200 }

      useSettlementStore.getState().markSettlementPaid('trip-A', settlementA)

      expect(useSettlementStore.getState().isSettlementPaid('trip-A', settlementA)).toBe(true)
      expect(useSettlementStore.getState().isSettlementPaid('trip-B', settlementB)).toBe(false)
      expect(useSettlementStore.getState().getPaymentsByTrip('trip-A').length).toBe(1)
      expect(useSettlementStore.getState().getPaymentsByTrip('trip-B').length).toBe(0)
    })

    it('10. Deleting a trip cascades and removes its settlement payments', () => {
      const trip = useTripStore.getState().createTrip({
        name: 'Goa Holiday',
        destination: 'Goa',
        startDate: '2026-10-01',
        endDate: '2026-10-05',
      })
      const settlement = { from: 'p-1', to: 'p-2', amount: 500 }
      useSettlementStore.getState().markSettlementPaid(trip.id, settlement)
      expect(useSettlementStore.getState().getPaymentsByTrip(trip.id).length).toBe(1)

      // Delete trip via tripStore
      useTripStore.getState().deleteTrip(trip.id)

      expect(useSettlementStore.getState().getPaymentsByTrip(trip.id).length).toBe(0)
      expect(useSettlementStore.getState().isSettlementPaid(trip.id, settlement)).toBe(false)
    })

    it('16. Malformed persisted payment data is safely handled on rehydrate', () => {
      // Intentionally store malformed data via storageAdapter
      storageAdapter.set('settlement_payments', [
        {
          id: 'sp-1',
          tripId: 'trip-1',
          fromParticipantId: 'p1',
          toParticipantId: 'p2',
          amount: 100,
          amountMinor: 10000,
          status: 'paid',
        },
        'not-an-object',
        { tripId: 'trip-1', amount: -500 },
      ])

      expect(() => useSettlementStore.getState().rehydrate()).not.toThrow()
      const payments = useSettlementStore.getState().getPaymentsByTrip('trip-1')
      expect(payments.length).toBe(1)
      expect(payments[0].id).toBe('sp-1')
    })
  })

  // 3. UI Lifecycle, Count Decrements, & Section Separation
  describe('UI Payment Lifecycle & Reactive Updates', () => {
    let trip, p1, p2, p3

    beforeEach(() => {
      trip = useTripStore.getState().createTrip({
        name: 'Kashmir Trek',
        destination: 'Pahalgam',
        startDate: '2026-09-01',
        endDate: '2026-09-07',
        currency: 'INR',
      })
      p1 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Aman' })
      p2 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Bhavna' })
      p3 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Chetan' })
    })

    it('5, 6 & 8. Mark Paid decreases pending count and moves transaction to Completed Payments', () => {
      // Aman pays 900 for Aman, Bhavna, Chetan (300 each)
      // Bhavna owes 300 to Aman, Chetan owes 300 to Aman
      useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: 'Trek Guide',
        amount: 900,
        paidBy: p1.id,
        participantIds: [p1.id, p2.id, p3.id],
        splitType: 'equal',
        date: '2026-09-02',
      })

      renderWithRouter(`/trips/${trip.id}/settlement`)

      // Initially 2 payments to settle
      expect(screen.getByText(/2 payments to settle this trip/i)).toBeInTheDocument()
      expect(screen.getByText('Pending Payments')).toBeInTheDocument()
      expect(screen.queryByText('Completed Payments')).not.toBeInTheDocument()

      // Click "Mark Paid" on the first settlement
      const markPaidButtons = screen.getAllByRole('button', { name: /mark paid/i })
      expect(markPaidButtons.length).toBe(2)

      fireEvent.click(markPaidButtons[0])

      // 5. Pending count decreases from 2 -> 1
      expect(screen.getByText(/1 payment to settle this trip/i)).toBeInTheDocument()

      // 6 & 8. Completed Payments section now visible with 1 completed payment
      expect(screen.getByText('Completed Payments')).toBeInTheDocument()
      expect(screen.getByText('✓ Paid')).toBeInTheDocument()

      // 1 Mark Paid button remains for the remaining pending payment
      expect(screen.getAllByRole('button', { name: /mark paid/i }).length).toBe(1)
    })

    it('7. Marking all payments as paid renders celebratory fully settled banner while keeping completed history', () => {
      useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: 'Pony Ride',
        amount: 600,
        paidBy: p1.id,
        participantIds: [p1.id, p2.id],
        splitType: 'equal',
        date: '2026-09-03',
      })

      renderWithRouter(`/trips/${trip.id}/settlement`)

      const markPaidBtn = screen.getByRole('button', { name: /mark paid/i })
      fireEvent.click(markPaidBtn)

      // Fully settled celebratory banner appears
      expect(screen.getByText(/you're all settled!/i)).toBeInTheDocument()
      expect(
        screen.getByText(/all settlement payments have been completed/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/all payments recorded/i)).toBeInTheDocument()

      // Completed payments history remains visible
      expect(screen.getByText('Completed Payments')).toBeInTheDocument()
      expect(screen.getByText('✓ Paid')).toBeInTheDocument()
    })

    it('11. Participant rename preserves payment identity (ID-based matching)', () => {
      useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: 'Camp Dinner',
        amount: 400,
        paidBy: p1.id,
        participantIds: [p1.id, p2.id],
        splitType: 'equal',
        date: '2026-09-04',
      })

      // Mark paid while name is Bhavna
      const settlement = { from: p2.id, to: p1.id, amount: 200 }
      useSettlementStore.getState().markSettlementPaid(trip.id, settlement)

      // Rename Bhavna to "Bhavna Sharma"
      useParticipantStore.getState().updateParticipant(p2.id, { name: 'Bhavna Sharma' })

      renderWithRouter(`/trips/${trip.id}/settlement`)

      // Payment identity is preserved and name is updated
      expect(screen.getAllByText('Bhavna Sharma').length).toBeGreaterThan(0)
      expect(screen.getByText('✓ Paid')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /mark paid/i })).not.toBeInTheDocument()
    })

    it('12. Editing an expense invalidates stale settlement identity (old ₹200 does not mark new ₹300 as paid)', () => {
      const exp = useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: 'Snacks',
        amount: 400,
        paidBy: p1.id,
        participantIds: [p1.id, p2.id],
        splitType: 'equal',
        date: '2026-09-04',
      })

      // Mark the ₹200 settlement as paid
      const oldSettlement = { from: p2.id, to: p1.id, amount: 200 }
      useSettlementStore.getState().markSettlementPaid(trip.id, oldSettlement)
      expect(useSettlementStore.getState().isSettlementPaid(trip.id, oldSettlement)).toBe(true)

      // Edit expense amount from 400 to 600 (new settlement is ₹300)
      act(() => {
        useExpenseStore.getState().updateExpense(exp.id, { amount: 600 })
      })

      const newSettlement = { from: p2.id, to: p1.id, amount: 300 }
      // New settlement of ₹300 is NOT paid
      expect(useSettlementStore.getState().isSettlementPaid(trip.id, newSettlement)).toBe(false)

      renderWithRouter(`/trips/${trip.id}/settlement`)
      // Should show pending ₹300 with Mark Paid button
      expect(screen.getByRole('button', { name: /mark paid/i })).toBeInTheDocument()
      expect(screen.getByText('Pending Payments')).toBeInTheDocument()
    })

    it('13. Adding a new expense creates the correct new pending settlement', () => {
      // Trip initially has 1 expense
      useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: 'Entry Tickets',
        amount: 400,
        paidBy: p1.id,
        participantIds: [p1.id, p2.id],
        splitType: 'equal',
        date: '2026-09-04',
      })

      // Mark it paid
      useSettlementStore.getState().markSettlementPaid(trip.id, {
        from: p2.id,
        to: p1.id,
        amount: 200,
      })

      // Add second expense for participant 3
      act(() => {
        useExpenseStore.getState().createExpense({
          tripId: trip.id,
          description: 'Rafting Extra',
          amount: 600,
          paidBy: p1.id,
          participantIds: [p1.id, p3.id],
          splitType: 'equal',
          date: '2026-09-05',
        })
      })

      renderWithRouter(`/trips/${trip.id}/settlement`)
      expect(screen.getByText('Pending Payments')).toBeInTheDocument()
      expect(screen.getByText(/1 payment to settle this trip/i)).toBeInTheDocument()
    })

    it('14. Pure Math Invariant: Mark Paid does NOT alter financial calculations', () => {
      useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: 'Camping Gear',
        amount: 1200,
        paidBy: p1.id,
        participantIds: [p1.id, p2.id, p3.id],
        splitType: 'equal',
        date: '2026-09-04',
      })

      const participants = [p1, p2, p3]
      const expenses = useExpenseStore.getState().getExpensesByTrip(trip.id)

      // Calculate balances before marking paid
      const balancesBefore = calculateBalances(trip.id, expenses, participants)
      const settlementsBefore = calculateSettlements(balancesBefore.balancesList)

      // Mark payment paid in settlementStore
      useSettlementStore.getState().markSettlementPaid(trip.id, settlementsBefore[0])

      // Calculate balances after marking paid
      const balancesAfter = calculateBalances(trip.id, expenses, participants)
      const settlementsAfter = calculateSettlements(balancesAfter.balancesList)

      // Invariant: financial mathematics are pure and completely identical
      expect(balancesAfter).toEqual(balancesBefore)
      expect(settlementsAfter).toEqual(settlementsBefore)
    })

    it('15. Trip Overview reflects remaining unpaid settlements and updates reactively', () => {
      useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: 'Trek Guide',
        amount: 900,
        paidBy: p1.id,
        participantIds: [p1.id, p2.id, p3.id],
        splitType: 'equal',
        date: '2026-09-02',
      })

      // Render dashboard
      const { unmount } = renderWithRouter(`/trips/${trip.id}`)

      // Dashboard shows 2 pending settlements
      expect(screen.getByText(/2 payments remaining/i)).toBeInTheDocument()
      unmount()

      // Mark 1 settlement as paid
      act(() => {
        useSettlementStore.getState().markSettlementPaid(trip.id, {
          from: p2.id,
          to: p1.id,
          amount: 300,
        })
      })

      // Render dashboard again
      renderWithRouter(`/trips/${trip.id}`)
      expect(screen.getByText(/1 payment remaining/i)).toBeInTheDocument()
    })

    it('17 & 18. Accessibility and keyboard focus support', () => {
      useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: 'Lunch',
        amount: 400,
        paidBy: p1.id,
        participantIds: [p1.id, p2.id],
        splitType: 'equal',
        date: '2026-09-02',
      })

      renderWithRouter(`/trips/${trip.id}/settlement`)

      // Card is accessible and focusable
      const card = screen.getByLabelText(/bhavna pays aman ₹200/i)
      expect(card).toBeInTheDocument()
      expect(card).toHaveAttribute('tabIndex', '0')

      // Mark Paid button is keyboard accessible
      const markPaidBtn = screen.getByRole('button', { name: /mark paid/i })
      markPaidBtn.focus()
      expect(document.activeElement).toBe(markPaidBtn)

      // Enter / space activates the button
      fireEvent.keyDown(markPaidBtn, { key: 'Enter', code: 'Enter' })
      fireEvent.click(markPaidBtn)

      // Status indicator has accessible text and label
      const paidBadge = screen.getByLabelText(/payment of ₹200 from bhavna to aman is paid/i)
      expect(paidBadge).toBeInTheDocument()
      expect(screen.getByText('✓ Paid')).toBeInTheDocument()
    })
  })
})

