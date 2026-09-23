import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { AppShell } from '../components/layout/AppShell'
import { useTripStore } from '../store/useTripStore'
import { useExpenseStore } from '../store/useExpenseStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useSettlementStore } from '../store/useSettlementStore'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

function NetworkStatusConsumer() {
  const { isOnline } = useNetworkStatus()
  return <div data-testid="network-status">{isOnline ? 'ONLINE' : 'OFFLINE'}</div>
}

describe('Offline Capability & PWA Foundation', () => {
  beforeEach(() => {
    storageAdapter.clear()
    useTripStore.setState({
      trips: [],
      activeTripId: null,
      selectedTripId: null,
      isHydrated: true,
    })
    useParticipantStore.setState({
      participants: [],
      selectedParticipantId: null,
    })
    useExpenseStore.setState({
      expenses: [],
      selectedExpenseId: null,
    })
    useSettlementStore.setState({
      payments: [],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('1. useNetworkStatus hook', () => {
    it('initializes with navigator.onLine status', () => {
      render(<NetworkStatusConsumer />)
      expect(screen.getByTestId('network-status').textContent).toBe('ONLINE')
    })

    it('reacts dynamically to window offline and online events', () => {
      render(<NetworkStatusConsumer />)
      expect(screen.getByTestId('network-status').textContent).toBe('ONLINE')

      // Dispatch offline event
      act(() => {
        window.dispatchEvent(new Event('offline'))
      })
      expect(screen.getByTestId('network-status').textContent).toBe('OFFLINE')

      // Dispatch online event
      act(() => {
        window.dispatchEvent(new Event('online'))
      })
      expect(screen.getByTestId('network-status').textContent).toBe('ONLINE')
    })
  })

  describe('2. AppShell offline banner', () => {
    it('does not display offline banner when online', () => {
      render(
        <MemoryRouter>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </MemoryRouter>
      )

      expect(
        screen.queryByText(/You're offline — your trip data is saved on this device/i)
      ).not.toBeInTheDocument()
    })

    it('displays subtle, accessible offline banner when network drops', () => {
      render(
        <MemoryRouter>
          <AppShell>
            <div>Test Content</div>
          </AppShell>
        </MemoryRouter>
      )

      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      const banner = screen.getByRole('status')
      expect(banner).toBeInTheDocument()
      expect(banner).toHaveTextContent(/You're offline — your trip data is saved on this device/i)

      // Clears when back online
      act(() => {
        window.dispatchEvent(new Event('online'))
      })
      expect(
        screen.queryByText(/You're offline — your trip data is saved on this device/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('3. Offline Data & Financial Persistence Integrity', () => {
    it('performs full trip creation, expense addition, splitting, and settlement offline', () => {
      // Simulate offline state
      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      // 1. Create Trip offline
      const trip = useTripStore.getState().createTrip({
        name: 'Goa Weekend 2026',
        destination: 'Goa',
        startDate: '2026-06-01',
        endDate: '2026-06-05',
        currency: 'INR',
      })
      expect(trip.id).toBeDefined()
      expect(useTripStore.getState().trips).toHaveLength(1)

      // 2. Add Participants offline
      const alice = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Alice' })
      const bob = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Bob' })
      expect(alice.id).toBeDefined()
      expect(bob.id).toBeDefined()

      // 3. Add Expense offline
      const expense = useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: 'Dinner at Wharf',
        amount: 2000,
        date: '2026-06-02',
        paidBy: alice.id,
        splitType: 'equal',
        participantIds: [alice.id, bob.id],
      })
      expect(expense.id).toBeDefined()

      // 4. Verify LocalStorage persistence is intact offline
      const rawStoredTrips = storageAdapter.get('trips')
      expect(rawStoredTrips).toBeDefined()
      expect(rawStoredTrips).toHaveLength(1)
      expect(rawStoredTrips[0].name).toBe('Goa Weekend 2026')

      const rawStoredExpenses = storageAdapter.get('expenses')
      expect(rawStoredExpenses).toHaveLength(1)
      expect(rawStoredExpenses[0].description).toBe('Dinner at Wharf')

      // 5. Record settlement payment offline
      const payment = useSettlementStore.getState().markSettlementPaid(trip.id, {
        from: bob.id,
        to: alice.id,
        amount: 1000,
      })
      expect(payment).toBeDefined()
      expect(payment.status).toBe('paid')

      const rawStoredPayments = storageAdapter.get('settlement_payments')
      expect(rawStoredPayments).toHaveLength(1)
      expect(rawStoredPayments[0].amountMinor).toBe(100000)
      expect(rawStoredPayments[0].status).toBe('paid')

      // 6. Simulate network reconnection
      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      // Ensure all persisted state remains intact upon reconnection
      expect(useTripStore.getState().trips[0].name).toBe('Goa Weekend 2026')
      expect(useExpenseStore.getState().expenses[0].description).toBe('Dinner at Wharf')
      expect(useSettlementStore.getState().payments[0].status).toBe('paid')
    })
  })

  describe('4. PWA Web App Manifest Verification', () => {
    it('manifest file exists and conforms to PWA installability requirements', () => {
      const manifestPath = path.resolve(process.cwd(), 'dist/manifest.webmanifest')
      expect(fs.existsSync(manifestPath)).toBe(true)

      const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      expect(manifestContent.name).toBe('TripSplit')
      expect(manifestContent.short_name).toBe('TripSplit')
      expect(manifestContent.display).toBe('standalone')
      expect(manifestContent.start_url).toBe('/')
      expect(manifestContent.theme_color).toBe('#f97316')
      expect(manifestContent.background_color).toBe('#faf9f5')

      const iconSrcs = manifestContent.icons.map((i) => i.src)
      expect(iconSrcs).toContain('/favicon.svg')
      expect(iconSrcs).toContain('/pwa-192x192.png')
      expect(iconSrcs).toContain('/pwa-512x512.png')

      const hasMaskable = manifestContent.icons.some((i) => i.purpose?.includes('maskable'))
      expect(hasMaskable).toBe(true)
    })
  })
})
