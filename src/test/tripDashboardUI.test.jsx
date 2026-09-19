import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { AppRoutes } from '../App'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useExpenseStore } from '../store/useExpenseStore'
import { formatCurrency } from '../utils/formatters'

function renderWithRouter(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </MemoryRouter>,
  )
}

describe('Trip Dashboard & Financial Integration Tests (Step 7)', () => {
  let tripA, tripB, personA1, personA2, personA3, personB1

  beforeEach(() => {
    useTripStore.getState().resetStore()
    useParticipantStore.getState().resetStore()
    useExpenseStore.getState().resetStore()

    // Trip A
    tripA = useTripStore.getState().createTrip({
      name: 'Goa Beach Bash',
      destination: 'Goa, India',
      startDate: '2026-11-10',
      endDate: '2026-11-15',
      currency: 'INR',
      description: 'Annual college reunion beach retreat',
    })

    personA1 = useParticipantStore.getState().addParticipant({
      tripId: tripA.id,
      name: 'Aarav Sharma',
    })
    personA2 = useParticipantStore.getState().addParticipant({
      tripId: tripA.id,
      name: 'Diya Patel',
    })
    personA3 = useParticipantStore.getState().addParticipant({
      tripId: tripA.id,
      name: 'Kabir Mehta',
    })

    // Trip B (for multi-trip isolation testing)
    tripB = useTripStore.getState().createTrip({
      name: 'Tokyo Tech Summit',
      destination: 'Tokyo, Japan',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      currency: 'JPY',
      description: 'Conference and city exploration',
    })
    personB1 = useParticipantStore.getState().addParticipant({
      tripId: tripB.id,
      name: 'Kenji Sato',
    })
  })

  // 1. Real trip info appears on dashboard
  it('1. displays real trip info (name, destination, dates, currency, description) on dashboard', () => {
    renderWithRouter(`/trips/${tripA.id}`)

    expect(screen.getByRole('heading', { level: 1, name: /Goa Beach Bash/i })).toBeInTheDocument()
    expect(screen.getByText(/Goa, India/i)).toBeInTheDocument()
    expect(screen.getByText(/10–15 November 2026/i)).toBeInTheDocument()
    expect(screen.getByText(/Currency: INR/i)).toBeInTheDocument()
    expect(screen.getByText(/Annual college reunion beach retreat/i)).toBeInTheDocument()
  })

  // 2. Total spent matches actual expenses
  it('2. calculates and displays total spent from actual expenses (not mock data)', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Seafood Dinner',
      amount: 4500,
      paidBy: personA1.id,
      participantIds: [personA1.id, personA2.id, personA3.id],
      date: '2026-11-11',
    })
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Scooter Rentals',
      amount: 1500,
      paidBy: personA2.id,
      participantIds: [personA1.id, personA2.id, personA3.id],
      date: '2026-11-12',
    })

    renderWithRouter(`/trips/${tripA.id}`)

    // 4500 + 1500 = 6000 INR
    const totalTile = screen.getByTestId('stats-tile-total-spent')
    expect(totalTile).toHaveTextContent(formatCurrency(6000, 'INR'))
  })

  // 3. Expense count matches actual expenses
  it('3. displays the exact number of expenses recorded for this trip', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Breakfast',
      amount: 600,
      paidBy: personA1.id,
      participantIds: [personA1.id, personA2.id],
      date: '2026-11-10',
    })
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Beach Shack Drinks',
      amount: 1200,
      paidBy: personA2.id,
      participantIds: [personA1.id, personA2.id],
      date: '2026-11-11',
    })

    renderWithRouter(`/trips/${tripA.id}`)

    const expenseTile = screen.getByTestId('stats-tile-expenses')
    expect(expenseTile).toHaveTextContent('2')
  })

  // 4. People count matches actual participants
  it('4. displays the exact participant count for this trip', () => {
    renderWithRouter(`/trips/${tripA.id}`)

    const peopleTile = screen.getByTestId('stats-tile-people')
    expect(peopleTile).toHaveTextContent('3')
  })

  // 5. Financial snapshot reflects domain calculation engine output
  it('5. financial snapshot reflects domain calculation engine output with correct money to settle', () => {
    // Aarav pays 3000 split equally among Aarav, Diya, Kabir (1000 each)
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Villa Advance',
      amount: 3000,
      paidBy: personA1.id,
      participantIds: [personA1.id, personA2.id, personA3.id],
      date: '2026-11-10',
    })

    renderWithRouter(`/trips/${tripA.id}`)

    expect(screen.getByText('Money to Settle')).toBeInTheDocument()
    expect(screen.getByText(/2 payments remaining/i)).toBeInTheDocument()
    // Total remaining money moving = 2000 (Diya owes 1000, Kabir owes 1000)
    expect(screen.getAllByText(formatCurrency(2000, 'INR')).length).toBeGreaterThan(0)
  })

  // 6. Recent expenses show only this trip's expenses
  it('6. recent expenses list shows only this trip\'s expenses and isolates them', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Goa Surf Lessons',
      amount: 2500,
      paidBy: personA1.id,
      participantIds: [personA1.id],
      date: '2026-11-10',
    })
    useExpenseStore.getState().createExpense({
      tripId: tripB.id,
      description: 'Tokyo Ramen',
      amount: 1800,
      paidBy: personB1.id,
      participantIds: [personB1.id],
      date: '2026-12-02',
    })

    renderWithRouter(`/trips/${tripA.id}`)

    expect(screen.getByText('Goa Surf Lessons')).toBeInTheDocument()
    expect(screen.queryByText('Tokyo Ramen')).not.toBeInTheDocument()
  })

  // 7. Squad section shows only this trip's participants
  it('7. squad section displays only this trip\'s participants', () => {
    renderWithRouter(`/trips/${tripA.id}`)

    expect(screen.getByText('Aarav Sharma')).toBeInTheDocument()
    expect(screen.getByText('Diya Patel')).toBeInTheDocument()
    expect(screen.getByText('Kabir Mehta')).toBeInTheDocument()
    expect(screen.queryByText('Kenji Sato')).not.toBeInTheDocument()
  })

  // 8. Empty trip state (no people, no expenses)
  it('8. displays friendly empty states when a trip has neither expenses nor people', () => {
    const emptyTrip = useTripStore.getState().createTrip({
      name: 'Fresh Empty Trip',
      destination: 'Paris, France',
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      currency: 'EUR',
    })

    renderWithRouter(`/trips/${emptyTrip.id}`)

    expect(screen.getByText(/No expenses yet\./i)).toBeInTheDocument()
    expect(screen.getByText(/Who's coming\?/i)).toBeInTheDocument()
    expect(screen.getByText(/No spending recorded/i)).toBeInTheDocument()
    expect(screen.getByText(/No money drama yet/i)).toBeInTheDocument()
  })

  // 9. Trip with people but no expenses
  it('9. handles trip with people but no expenses gracefully', () => {
    renderWithRouter(`/trips/${tripA.id}`)

    expect(screen.getByTestId('stats-tile-people')).toHaveTextContent('3')
    expect(screen.getByTestId('stats-tile-total-spent')).toHaveTextContent(formatCurrency(0, 'INR'))
    expect(screen.getByText(/No expenses yet\./i)).toBeInTheDocument()
    expect(screen.queryByText('Money to Settle')).not.toBeInTheDocument()
  })

  // 10. Clicking 'View all expenses' navigates to expenses tab
  it('10. clicking "View all expenses" navigates to the expenses tab', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Resort Booking',
      amount: 8000,
      paidBy: personA1.id,
      participantIds: [personA1.id],
      date: '2026-11-10',
    })

    renderWithRouter(`/trips/${tripA.id}`)

    const viewAllLink = screen.getByRole('link', { name: /View all expenses/i })
    expect(viewAllLink).toHaveAttribute('href', `/trips/${tripA.id}/expenses`)
    fireEvent.click(viewAllLink)

    expect(screen.getByRole('heading', { level: 2, name: /Trip Expenses/i })).toBeInTheDocument()
  })

  // 11. Clicking '+ Add Expense' opens the real Add Expense modal
  it('11. clicking "+ Add Expense" opens the real Add Expense modal', () => {
    renderWithRouter(`/trips/${tripA.id}`)

    const addExpenseBtn = screen.getByRole('button', { name: /\+ Add Expense/i })
    fireEvent.click(addExpenseBtn)

    expect(screen.getByRole('heading', { level: 2, name: /^Add Expense$/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/What was it\?/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument()
  })

  // 12. Clicking '+ Add Person' opens the real Add Person modal
  it('12. clicking "+ Add Person" opens the real Add Person modal', () => {
    renderWithRouter(`/trips/${tripA.id}`)

    const addPersonBtn = screen.getByRole('button', { name: /\+ Add Person/i })
    fireEvent.click(addPersonBtn)

    expect(screen.getByRole('heading', { level: 2, name: /^Add Squad Member$/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Member Name/i)).toBeInTheDocument()
  })

  // 13. Creating an expense via modal immediately updates dashboard totals
  it('13. creating an expense via modal immediately updates dashboard totals', async () => {
    renderWithRouter(`/trips/${tripA.id}`)

    expect(screen.getByTestId('stats-tile-total-spent')).toHaveTextContent(formatCurrency(0, 'INR'))

    // Open Add Expense modal
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Expense/i }))

    // Fill form
    fireEvent.change(screen.getByLabelText(/What was it\?/i), {
      target: { value: 'Sunset Cruise' },
    })
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: '2400' },
    })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Record Expense/i }))

    await waitFor(() => {
      // Total spent should update to ₹2,400
      expect(screen.getByTestId('stats-tile-total-spent')).toHaveTextContent(formatCurrency(2400, 'INR'))
      expect(screen.getByText('Sunset Cruise')).toBeInTheDocument()
    })
  })

  // 14. Deleting an expense immediately updates dashboard totals
  it('14. deleting an expense immediately updates dashboard totals', () => {
    const expense = useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Scuba Diving',
      amount: 5000,
      paidBy: personA1.id,
      participantIds: [personA1.id, personA2.id],
      date: '2026-11-10',
    })

    const { unmount } = renderWithRouter(`/trips/${tripA.id}`)
    expect(screen.getByTestId('stats-tile-total-spent')).toHaveTextContent(formatCurrency(5000, 'INR'))
    unmount()

    // Delete the expense from store
    useExpenseStore.getState().deleteExpense(expense.id)

    renderWithRouter(`/trips/${tripA.id}`)
    expect(screen.getByTestId('stats-tile-total-spent')).toHaveTextContent(formatCurrency(0, 'INR'))
    expect(screen.queryByText('Scuba Diving')).not.toBeInTheDocument()
  })

  // 15. Adding a participant immediately updates people count on dashboard
  it('15. adding a participant immediately updates people count on dashboard', async () => {
    renderWithRouter(`/trips/${tripA.id}`)

    const peopleTile = screen.getByTestId('stats-tile-people')
    expect(peopleTile).toHaveTextContent('3')

    // Open Add Person modal
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Person/i }))

    // Fill name
    fireEvent.change(screen.getByLabelText(/Member Name/i), {
      target: { value: 'Rohan Sen' },
    })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Add to Squad/i }))

    await waitFor(() => {
      expect(screen.getByText('Rohan Sen')).toBeInTheDocument()
      expect(peopleTile).toHaveTextContent('4')
    })
  })

  // 16. Multi-trip isolation: Trip A data never appears on Trip B dashboard
  it('16. strictly isolates data: Trip A data never appears on Trip B dashboard', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Trip A Big Spender',
      amount: 9999,
      paidBy: personA1.id,
      participantIds: [personA1.id],
      date: '2026-11-10',
    })

    renderWithRouter(`/trips/${tripB.id}`)

    expect(screen.queryByText('Trip A Big Spender')).not.toBeInTheDocument()
    expect(screen.queryByText('Aarav Sharma')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Tokyo Tech Summit/i })).toBeInTheDocument()
    expect(screen.getByText('Kenji Sato')).toBeInTheDocument()
    expect(screen.getByTestId('stats-tile-total-spent')).toHaveTextContent(formatCurrency(0, 'JPY'))
  })

  // 17. Archived trip still displays historical dashboard data correctly
  it('17. archived trip still displays all its historical dashboard data correctly', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Farewell Dinner',
      amount: 3200,
      paidBy: personA1.id,
      participantIds: [personA1.id, personA2.id],
      date: '2026-11-10',
    })

    useTripStore.getState().archiveTrip(tripA.id)

    renderWithRouter(`/trips/${tripA.id}`)

    expect(screen.getByText('ARCHIVED')).toBeInTheDocument()
    expect(screen.getByText(/This trip is currently archived/i)).toBeInTheDocument()
    expect(screen.getByTestId('stats-tile-total-spent')).toHaveTextContent(formatCurrency(3200, 'INR'))
    expect(screen.getByText('Farewell Dinner')).toBeInTheDocument()
    expect(screen.getAllByText('Aarav Sharma').length).toBeGreaterThan(0)
  })

  // 18. Settled state: when all balances are zero, shows 'All Settled' state
  it('18. displays "All Settled" when all participant balances are zero', () => {
    // Aarav pays 2000 for Diya
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Aarav pays for Diya',
      amount: 2000,
      paidBy: personA1.id,
      participantIds: [personA2.id],
      date: '2026-11-10',
    })
    // Diya pays 2000 for Aarav (exact reciprocal payment)
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Diya pays for Aarav',
      amount: 2000,
      paidBy: personA2.id,
      participantIds: [personA1.id],
      date: '2026-11-10',
    })

    renderWithRouter(`/trips/${tripA.id}`)

    expect(screen.getByRole('heading', { name: /All Settled/i })).toBeInTheDocument()
    expect(screen.getByText(/Everyone is square\. No payments are currently needed\./i)).toBeInTheDocument()
    expect(screen.queryByText('Money to Settle')).not.toBeInTheDocument()
  })

  // 19. Settlement snapshot CTA navigates to settlement tab
  it('19. settlement snapshot CTA navigates to /trips/:tripId/settlement', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Taxi Ride',
      amount: 1000,
      paidBy: personA1.id,
      participantIds: [personA1.id, personA2.id],
      date: '2026-11-10',
    })

    renderWithRouter(`/trips/${tripA.id}`)

    const settleUpLinks = screen.getAllByRole('link', { name: /Settle Up/i })
    expect(settleUpLinks.length).toBeGreaterThan(0)
    expect(settleUpLinks[0]).toHaveAttribute('href', `/trips/${tripA.id}/settlement`)

    fireEvent.click(settleUpLinks[0])
    expect(screen.getByRole('heading', { level: 2, name: /Settle Up/i })).toBeInTheDocument()
  })

  // 20. No fake 'You owe' / 'You are owed' balance card appears anywhere
  it('20. does NOT display fake "You owe" or "You are owed" balance cards anywhere on dashboard', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Dinner Party',
      amount: 5000,
      paidBy: personA1.id,
      participantIds: [personA1.id, personA2.id, personA3.id],
      date: '2026-11-10',
    })

    renderWithRouter(`/trips/${tripA.id}`)

    expect(screen.queryByText(/Your balance/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/You are owed in total/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/You owe/i)).not.toBeInTheDocument()
  })
})
