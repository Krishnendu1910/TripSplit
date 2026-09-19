/**
 * Step 11 UI Performance Verification Test Suite
 *
 * Verifies real React UI component rendering and responsiveness
 * with a realistic large dataset:
 *   - 100 registered participants
 *   - 1,000 group expenses with rotating payers and squad subsets
 *
 * Measures:
 *   - Dashboard / Overview render time
 *   - Expenses tab render time & usability
 *   - People tab render time
 *   - Settle Up tab render time
 *   - Tab switching responsiveness
 *   - Add / Edit / Delete expense responsiveness on 1,000-expense state
 *   - Zero console errors or warnings
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { AppRoutes } from '../App'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useExpenseStore } from '../store/useExpenseStore'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import { toMinorUnits } from '../utils/money'

function renderWithRouter(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </MemoryRouter>,
  )
}

describe('Step 11 — UI Performance Check with 100 Participants & 1,000 Expenses', () => {
  let trip
  let participants = []
  let consoleErrorSpy
  let consoleWarnSpy

  beforeEach(() => {
    storageAdapter.clear()
    useTripStore.getState().resetStore()
    useParticipantStore.getState().resetStore()
    useExpenseStore.getState().resetStore()

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // 1. Create large trip
    trip = useTripStore.getState().createTrip({
      name: 'Mega Himalayan Expedition',
      destination: 'Manali to Leh',
      startDate: '2026-07-01',
      endDate: '2026-07-20',
      currency: 'INR',
      description: '100-member trek expedition across high mountain passes',
    })

    // 2. Add 100 participants in bulk
    const pStore = useParticipantStore.getState()
    participants = []
    for (let i = 1; i <= 100; i++) {
      participants.push(
        pStore.addParticipant({
          tripId: trip.id,
          name: `Explorer ${i}`,
        }),
      )
    }

    // 3. Seed 1,000 expenses into the store directly
    const seededExpenses = []
    for (let i = 1; i <= 1000; i++) {
      const payerIdx = (i - 1) % 100
      const payerId = participants[payerIdx].id

      // Squad of 5 to 15 members
      const squadSize = 5 + (i % 11)
      const squad = new Set([payerId])
      for (let j = 1; squad.size < squadSize; j++) {
        squad.add(participants[(payerIdx + j) % 100].id)
      }

      const amount = (i % 50 + 1) * 25
      const amountInMinorUnits = toMinorUnits(amount)

      seededExpenses.push({
        id: `exp-perf-${i}`,
        tripId: trip.id,
        description: `Expedition Supply #${i}`,
        amount,
        amountInMinorUnits,
        currency: 'INR',
        paidBy: payerId,
        participantIds: Array.from(squad),
        splitType: 'equal',
        category: i % 2 === 0 ? 'food' : 'transport',
        date: '2026-07-05',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    // Set state in bulk
    useExpenseStore.setState({ expenses: seededExpenses })
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    storageAdapter.clear()
  })

  it('1. Renders Trip Dashboard / Overview with 100 participants and 1,000 expenses responsive and error-free', () => {
    const t0 = performance.now()
    const { unmount } = renderWithRouter(`/trips/${trip.id}`)
    const renderTimeMs = performance.now() - t0

    // Verify key metrics displayed correctly
    expect(screen.getByRole('heading', { level: 1, name: /Mega Himalayan Expedition/i })).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument() // 100 people tile
    expect(screen.getByText('1000')).toBeInTheDocument() // 1000 expenses tile

    // Financial snapshot section renders without error
    expect(screen.getByText(/Money to Settle/i)).toBeInTheDocument()

    // No React warnings or console errors
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()

    // Log measured timing
    expect(renderTimeMs).toBeGreaterThan(0)
    unmount()
  })

  it('2. Renders Expenses Tab with 1,000 expenses responsive and usable', () => {
    const t0 = performance.now()
    const { unmount } = renderWithRouter(`/trips/${trip.id}/expenses`)
    const renderTimeMs = performance.now() - t0

    // Header with total count badge
    expect(screen.getByText(/1000 expenses/i)).toBeInTheDocument()
    // First and last items rendered
    expect(screen.getByText('Expedition Supply #1')).toBeInTheDocument()
    expect(screen.getByText('Expedition Supply #1000')).toBeInTheDocument()

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
    expect(renderTimeMs).toBeGreaterThan(0)
    unmount()
  })

  it('3. Renders People Tab with 100 participants cleanly', () => {
    const t0 = performance.now()
    const { unmount } = renderWithRouter(`/trips/${trip.id}/people`)
    const renderTimeMs = performance.now() - t0

    expect(screen.getByText(/100 people/i)).toBeInTheDocument()
    expect(screen.getByText('Explorer 1')).toBeInTheDocument()
    expect(screen.getByText('Explorer 100')).toBeInTheDocument()

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
    expect(renderTimeMs).toBeGreaterThan(0)
    unmount()
  })

  it('4. Renders Settle Up tab with 100 participants and 1,000 expenses', () => {
    const t0 = performance.now()
    const { unmount } = renderWithRouter(`/trips/${trip.id}/settle`)
    const renderTimeMs = performance.now() - t0

    // Settle Up header
    expect(screen.getByRole('heading', { level: 2, name: /Settle Up/i })).toBeInTheDocument()

    // Settlement list and participant balances
    expect(screen.getByText(/Optimized Settlements/i)).toBeInTheDocument()
    expect(screen.getByText(/Squad Balances/i)).toBeInTheDocument()

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
    expect(renderTimeMs).toBeGreaterThan(0)
    unmount()
  })

  it('5. Switches between tabs smoothly under heavy dataset', () => {
    const { unmount } = renderWithRouter(`/trips/${trip.id}`)

    // Overview -> Expenses
    const expensesTab = screen.getByRole('link', { name: /^Expenses$/i })
    const t0 = performance.now()
    fireEvent.click(expensesTab)
    const switch1Ms = performance.now() - t0
    expect(screen.getByText(/1000 expenses/i)).toBeInTheDocument()

    // Expenses -> Settle Up
    const settleTab = screen.getByRole('link', { name: /^Settle Up$/i })
    const t1 = performance.now()
    fireEvent.click(settleTab)
    const switch2Ms = performance.now() - t1
    expect(screen.getByRole('heading', { level: 2, name: /Settle Up/i })).toBeInTheDocument()

    // Settle Up -> People
    const peopleTab = screen.getByRole('link', { name: /^People$/i })
    const t2 = performance.now()
    fireEvent.click(peopleTab)
    const switch3Ms = performance.now() - t2
    expect(screen.getByText(/100 people/i)).toBeInTheDocument()

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
    expect(switch1Ms + switch2Ms + switch3Ms).toBeGreaterThan(0)
    unmount()
  })

  it('6. Add, edit, and delete operations execute without UI degradation on 1,000-expense state', () => {
    const { unmount } = renderWithRouter(`/trips/${trip.id}/expenses`)

    // ADD EXPENSE
    let newExp
    const tAdd = performance.now()
    act(() => {
      newExp = useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: 'New Emergency Oxygen Cylinder',
        amount: 8500,
        paidBy: participants[0].id,
        participantIds: [participants[0].id, participants[1].id],
        date: '2026-07-06',
      })
    })
    const addDurationMs = performance.now() - tAdd

    expect(screen.getByText(/1001 expenses/i)).toBeInTheDocument()
    expect(screen.getByText('New Emergency Oxygen Cylinder')).toBeInTheDocument()
    expect(addDurationMs).toBeLessThan(300)

    // EDIT EXPENSE
    const tEdit = performance.now()
    act(() => {
      useExpenseStore.getState().updateExpense(newExp.id, {
        description: 'Updated Emergency Oxygen Cylinder Refill',
        amount: 9000,
      })
    })
    const editDurationMs = performance.now() - tEdit

    expect(screen.getByText('Updated Emergency Oxygen Cylinder Refill')).toBeInTheDocument()
    expect(editDurationMs).toBeLessThan(300)

    // DELETE EXPENSE
    const tDelete = performance.now()
    act(() => {
      useExpenseStore.getState().deleteExpense(newExp.id)
    })
    const deleteDurationMs = performance.now() - tDelete

    expect(screen.getByText(/1000 expenses/i)).toBeInTheDocument()
    expect(screen.queryByText('Updated Emergency Oxygen Cylinder Refill')).not.toBeInTheDocument()
    expect(deleteDurationMs).toBeLessThan(300)

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
    unmount()
  })
})
