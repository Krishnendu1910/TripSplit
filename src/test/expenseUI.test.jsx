import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { TripDetailPage } from '../pages/TripDetailPage'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useExpenseStore } from '../store/useExpenseStore'

function renderTripWithRouter(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell>
        <Routes>
          <Route path="/trips/:tripId" element={<TripDetailPage subview="overview" />} />
          <Route path="/trips/:tripId/expenses" element={<TripDetailPage subview="expenses" />} />
          <Route path="/trips/:tripId/people" element={<TripDetailPage subview="people" />} />
        </Routes>
      </AppShell>
    </MemoryRouter>,
  )
}

describe('Expense Management UI Flow', () => {
  let trip
  let p1, p2, p3

  beforeEach(() => {
    useTripStore.getState().resetStore()
    useParticipantStore.getState().resetStore()
    useExpenseStore.getState().resetStore()

    trip = useTripStore.getState().createTrip({
      name: 'Digha Trip',
      destination: 'Digha, WB',
      startDate: '2026-10-10',
      endDate: '2026-10-12',
      currency: 'INR',
    })

    p1 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Pritish' })
    p2 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Deba' })
    p3 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Rohan' })
  })

  it('renders clean empty state when no expenses exist', () => {
    renderTripWithRouter(`/trips/${trip.id}/expenses`)

    expect(screen.getByRole('heading', { name: /Trip Expenses/i })).toBeInTheDocument()
    expect(screen.getByText(/No damage reported yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add first expense/i })).toBeInTheDocument()
  })

  it('fast-adds an expense with default "Everyone" split and renders card immediately', async () => {
    renderTripWithRouter(`/trips/${trip.id}/expenses`)

    // Click Add first expense
    fireEvent.click(screen.getByRole('button', { name: /Add first expense/i }))
    expect(screen.getByRole('heading', { name: /^Add Expense$/i })).toBeInTheDocument()

    // Fill What was it?
    fireEvent.change(screen.getByLabelText(/What was it\?/i), { target: { value: 'Petrol' } })

    // Fill Amount
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '600' } })

    // Select Paid by
    fireEvent.change(screen.getByLabelText(/Paid by/i), { target: { value: p1.id } })

    // Submit (Record Expense button in modal)
    const submitBtn = screen.getByRole('button', { name: /Record Expense/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Petrol' })).toBeInTheDocument()
      expect(screen.getByText(/Paid by/i)).toHaveTextContent('Pritish')
      expect(screen.getByText(/3 people/i)).toBeInTheDocument()
      expect(screen.getByText('₹600 spent')).toBeInTheDocument()
    })
  })

  it('adds an expense with custom selected participants', async () => {
    renderTripWithRouter(`/trips/${trip.id}/expenses`)

    // Open add modal
    const addButtons = screen.getAllByRole('button', { name: /Add Expense/i })
    fireEvent.click(addButtons[0])

    // Fill details
    fireEvent.change(screen.getByLabelText(/What was it\?/i), { target: { value: 'Dinner' } })
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '880' } })
    fireEvent.change(screen.getByLabelText(/Paid by/i), { target: { value: p2.id } })

    // Switch to Select people
    fireEvent.click(screen.getByRole('button', { name: /Select people/i }))

    // Deselect Rohan (p3)
    const rohanCheckbox = screen.getByRole('checkbox', { name: 'Rohan' })
    fireEvent.click(rohanCheckbox)

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Record Expense/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Dinner' })).toBeInTheDocument()
      expect(screen.getByText(/Paid by/i)).toHaveTextContent('Deba')
      expect(screen.getByText(/2 people/i)).toBeInTheDocument()
      expect(screen.getByText('₹880 spent')).toBeInTheDocument()
    })
  })

  it('edits an existing expense while preserving its ID', async () => {
    const expense = useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Dinner',
      amount: 880,
      paidBy: p2.id,
      participantIds: [p1.id, p2.id],
      date: '2026-10-10',
    })

    renderTripWithRouter(`/trips/${trip.id}/expenses`)

    expect(screen.getByRole('heading', { level: 3, name: 'Dinner' })).toBeInTheDocument()

    // Click edit
    fireEvent.click(screen.getByLabelText('Edit Dinner'))
    expect(screen.getByRole('heading', { name: /Edit Expense/i })).toBeInTheDocument()

    // Modify description and amount
    fireEvent.change(screen.getByLabelText(/What was it\?/i), { target: { value: 'Seafood Dinner' } })
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '950' } })

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Seafood Dinner' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { level: 3, name: /^Dinner$/ })).not.toBeInTheDocument()
      expect(screen.getByText('₹950 spent')).toBeInTheDocument()
    })

    // Verify ID remains unchanged in store
    const inStore = useExpenseStore.getState().getExpenseById(expense.id)
    expect(inStore.description).toBe('Seafood Dinner')
    expect(inStore.amount).toBe(950)
    expect(inStore.id).toBe(expense.id)
  })

  it('deletes an expense after confirmation modal', async () => {
    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Petrol',
      amount: 600,
      paidBy: p1.id,
      participantIds: [p1.id, p2.id, p3.id],
      date: '2026-10-10',
    })

    renderTripWithRouter(`/trips/${trip.id}/expenses`)

    expect(screen.getByRole('heading', { level: 3, name: 'Petrol' })).toBeInTheDocument()

    // Click delete
    fireEvent.click(screen.getByLabelText('Delete Petrol'))

    expect(screen.getByRole('heading', { name: /Delete this expense\?/i })).toBeInTheDocument()
    expect(screen.getByText(/Petrol — ₹600/i)).toBeInTheDocument()

    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: /Delete Expense/i }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Petrol' })).not.toBeInTheDocument()
      expect(screen.getByText(/No damage reported yet/i)).toBeInTheDocument()
    })
  })

  it('dynamically reflects total spent and expense count on Trip Overview', () => {
    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Hotel Booking',
      amount: 4200,
      paidBy: p1.id,
      participantIds: [p1.id, p2.id],
      date: '2026-10-10',
    })
    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Breakfast',
      amount: 450,
      paidBy: p2.id,
      participantIds: [p1.id, p2.id, p3.id],
      date: '2026-10-11',
    })

    renderTripWithRouter(`/trips/${trip.id}`)

    // Total spent should be ₹4,650
    expect(screen.getByText('₹4,650')).toBeInTheDocument()
    // Expenses count should be 2
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('handles the real-world Digha scenario with multiple expenses and subsets', () => {
    // Digha trip items
    const expensesData = [
      { description: 'Petrol', amount: 600, payer: p1.id, participants: [p1.id, p2.id, p3.id] },
      { description: 'Hotel', amount: 4000, payer: p2.id, participants: [p1.id, p2.id, p3.id] },
      { description: 'Lunch', amount: 850, payer: p1.id, participants: [p1.id, p2.id] },
      { description: 'Chicken Kabab', amount: 420, payer: p3.id, participants: [p2.id, p3.id] },
      { description: 'Water & Snacks', amount: 150, payer: p1.id, participants: [p1.id, p2.id, p3.id] },
      { description: 'Smirnoff', amount: 1200, payer: p2.id, participants: [p1.id, p2.id] },
    ]

    for (const exp of expensesData) {
      useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: exp.description,
        amount: exp.amount,
        paidBy: exp.payer,
        participantIds: exp.participants,
        date: '2026-10-10',
      })
    }

    renderTripWithRouter(`/trips/${trip.id}/expenses`)

    // Total sum: 600 + 4000 + 850 + 420 + 150 + 1200 = 7220
    expect(screen.getByText('₹7,220 spent')).toBeInTheDocument()
    expect(screen.getByText('6 expenses')).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 3, name: 'Petrol' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Hotel' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Chicken Kabab' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Smirnoff' })).toBeInTheDocument()
  })
})

