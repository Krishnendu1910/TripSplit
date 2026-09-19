import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { AppRoutes } from '../App'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useExpenseStore } from '../store/useExpenseStore'
import { DIGHA_TRIP, DIGHA_PARTICIPANTS, DIGHA_EXPENSES } from './fixtures/dighaTrip'

function renderWithRouter(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </MemoryRouter>,
  )
}

describe('Settle Up Experience UI Integration Tests', () => {
  let trip

  beforeEach(() => {
    useTripStore.getState().resetStore()
    useParticipantStore.getState().resetStore()
    useExpenseStore.getState().resetStore()

    trip = useTripStore.getState().createTrip({
      name: 'Manali Expedition',
      destination: 'Manali, India',
      startDate: '2026-10-10',
      endDate: '2026-10-15',
      currency: 'INR',
      description: 'Mountain road trip',
    })
  })

  // 1. Settle Up route renders
  it('renders Settle Up route at /trips/:tripId/settlement and /trips/:tripId/settle', () => {
    const { unmount } = renderWithRouter(`/trips/${trip.id}/settlement`)
    expect(screen.getByRole('heading', { level: 2, name: /settle up/i })).toBeInTheDocument()
    unmount()

    renderWithRouter(`/trips/${trip.id}/settle`)
    expect(screen.getByRole('heading', { level: 2, name: /settle up/i })).toBeInTheDocument()
  })

  // 2. No-expenses empty state
  it('displays friendly empty state when trip has no expenses', () => {
    renderWithRouter(`/trips/${trip.id}/settlement`)

    expect(screen.getByText(/no money drama yet/i)).toBeInTheDocument()
    expect(
      screen.getByText(/nobody owes anybody\.\.\. yet\. add your first expense/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument()
    // Does NOT display fake ₹0 balances or settlement list
    expect(screen.queryByText(/optimized settlements/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/squad balances/i)).not.toBeInTheDocument()
  })

  // 3. Fully settled state
  it('displays celebratory fully settled state when all participant net balances are zero', () => {
    const p1 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Aarav' })
    const p2 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Diya' })

    // Aarav pays 500 for both (250 each)
    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Fuel',
      amount: 500,
      paidBy: p1.id,
      participantIds: [p1.id, p2.id],
      splitType: 'equal',
      date: '2026-10-11',
    })

    // Diya pays 500 for both (250 each) -> perfectly balanced!
    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Groceries',
      amount: 500,
      paidBy: p2.id,
      participantIds: [p1.id, p2.id],
      splitType: 'equal',
      date: '2026-10-12',
    })

    renderWithRouter(`/trips/${trip.id}/settlement`)

    expect(screen.getByText(/you're all settled!/i)).toBeInTheDocument()
    expect(
      screen.getByText(/everyone's share matches what they paid/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/all balances are zero/i)).toBeInTheDocument()
    // No settlement transactions are generated
    expect(screen.queryByText(/optimized settlements/i)).not.toBeInTheDocument()
    // But squad balances show ₹0.00 / settled for everyone
    expect(screen.getByText('Aarav')).toBeInTheDocument()
    expect(screen.getByText('Diya')).toBeInTheDocument()
    expect(screen.getAllByText(/settled/i).length).toBeGreaterThan(0)
  })

  // 4 & 5. Participant balances and settlement transactions render from financial engine
  it('renders participant balances and settlement transactions from financial engine', () => {
    const pA = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Kabir' })
    const pB = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Meera' })

    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Cottage Stay',
      amount: 3000,
      paidBy: pA.id,
      participantIds: [pA.id, pB.id],
      splitType: 'equal',
      date: '2026-10-10',
    })

    renderWithRouter(`/trips/${trip.id}/settlement`)

    // Header Trip Total
    expect(screen.getAllByText('₹3,000').length).toBeGreaterThan(0)

    // Who owes vs who receives
    expect(screen.getByRole('heading', { name: /who needs to pay/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /who receives/i })).toBeInTheDocument()
    expect(screen.getAllByText(/owes ₹1,500/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/receives ₹1,500/i).length).toBeGreaterThan(0)

    // Settlement Card
    expect(screen.getAllByText(/meera/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/kabir/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText('₹1,500').length).toBeGreaterThan(0)
  })

  // 6. Settlement count is dynamically rendered from settlements.length
  it('dynamically displays settlement count badge from settlements.length', () => {
    const p1 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'P1' })
    const p2 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'P2' })
    const p3 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'P3' })

    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Dinner',
      amount: 900,
      paidBy: p1.id,
      participantIds: [p1.id, p2.id, p3.id],
      splitType: 'equal',
      date: '2026-10-10',
    })

    renderWithRouter(`/trips/${trip.id}/settlement`)

    // 2 payments (P2 -> P1, P3 -> P1)
    expect(screen.getByText(/2 payments to settle this trip/i)).toBeInTheDocument()
  })

  // 7. Digha benchmark renders the exact verified transactions
  it('correctly renders the Digha benchmark settlements and participant breakdown', () => {
    // Setup Digha trip
    const dighaTrip = useTripStore.getState().createTrip({
      name: DIGHA_TRIP.name,
      destination: DIGHA_TRIP.destination,
      startDate: DIGHA_TRIP.startDate,
      endDate: DIGHA_TRIP.endDate,
      currency: DIGHA_TRIP.currency,
      description: DIGHA_TRIP.description,
    })

    for (const p of DIGHA_PARTICIPANTS) {
      useParticipantStore.getState().addParticipant({
        id: p.id,
        tripId: dighaTrip.id,
        name: p.name,
      })
    }

    for (const exp of DIGHA_EXPENSES) {
      useExpenseStore.getState().createExpense({
        tripId: dighaTrip.id,
        description: exp.description,
        amount: exp.amount,
        paidBy: exp.paidBy,
        participantIds: exp.participantIds,
        splitType: exp.splitType,
        splitData: exp.splitData,
        date: exp.date,
      })
    }

    renderWithRouter(`/trips/${dighaTrip.id}/settlement`)

    // Total Trip Spending = ₹7,220
    expect(screen.getByText('₹7,220')).toBeInTheDocument()

    // 5 payments to settle this trip
    expect(screen.getByText(/5 payments to settle this trip/i)).toBeInTheDocument()

    // Creditors
    expect(screen.getAllByText(/receives ₹3,996\.66/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/receives ₹396\.66/i).length).toBeGreaterThan(0)

    // Debtors
    expect(screen.getAllByText(/owes ₹783\.34/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/owes ₹1,203\.32/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/owes ₹1,203\.34/i).length).toBeGreaterThan(0)

    // Expected settlement amounts
    expect(screen.getByText('₹386.68')).toBeInTheDocument()
    expect(screen.getByText('₹396.66')).toBeInTheDocument()
  })

  // 8. Trip isolation: switching trips isolates financial data
  it('isolates financial data between different trips', () => {
    const trip2 = useTripStore.getState().createTrip({
      name: 'Kerala Backwaters',
      destination: 'Alleppey',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      currency: 'INR',
    })

    const pA = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Manali Camper' })
    useParticipantStore.getState().addParticipant({ tripId: trip2.id, name: 'Kerala Sailor' })

    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Campfire Wood',
      amount: 1200,
      paidBy: pA.id,
      participantIds: [pA.id],
      splitType: 'equal',
      date: '2026-10-10',
    })

    // Render trip 1
    const { unmount } = renderWithRouter(`/trips/${trip.id}/settlement`)
    expect(screen.getByText('Manali Camper')).toBeInTheDocument()
    expect(screen.queryByText('Kerala Sailor')).not.toBeInTheDocument()
    unmount()

    // Render trip 2
    renderWithRouter(`/trips/${trip2.id}/settlement`)
    expect(screen.queryByText('Manali Camper')).not.toBeInTheDocument()
    expect(screen.getByText(/no money drama yet/i)).toBeInTheDocument()
  })

  // 9. Live updates: adding, editing, or deleting an expense updates settlement data
  it('updates settlement data live when an expense is added or deleted', () => {
    const p1 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Tarun' })
    const p2 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Simran' })

    renderWithRouter(`/trips/${trip.id}/settlement`)
    expect(screen.getByText(/no money drama yet/i)).toBeInTheDocument()

    // Add expense via store wrapped in act
    let exp
    act(() => {
      exp = useExpenseStore.getState().createExpense({
        tripId: trip.id,
        description: 'Zip-line Tickets',
        amount: 2400,
        paidBy: p1.id,
        participantIds: [p1.id, p2.id],
        splitType: 'equal',
        date: '2026-10-11',
      })
    })

    // Now Settle Up should reactively display the settlement
    expect(screen.getAllByText('₹2,400').length).toBeGreaterThan(0)
    expect(screen.getAllByText('₹1,200').length).toBeGreaterThan(0)
    expect(screen.getByText(/1 payment to settle this trip/i)).toBeInTheDocument()

    // Delete expense via store wrapped in act
    act(() => {
      useExpenseStore.getState().deleteExpense(exp.id)
    })

    // Should return to empty state
    expect(screen.getByText(/no money drama yet/i)).toBeInTheDocument()
  })

  // 10. No fake current-user assumption exists
  it('does not assume a logged-in user and shows trip-wide summary', () => {
    const p1 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Alex' })
    const p2 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Jordan' })

    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Tent Rental',
      amount: 1000,
      paidBy: p1.id,
      participantIds: [p1.id, p2.id],
      splitType: 'equal',
      date: '2026-10-10',
    })

    renderWithRouter(`/trips/${trip.id}/settlement`)

    // Does NOT render "You need to pay" or "You should receive"
    expect(screen.queryByText(/^you need to pay/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^you should receive/i)).not.toBeInTheDocument()
    // Renders trip-wide headings
    expect(screen.getByRole('heading', { name: /who needs to pay/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /who receives/i })).toBeInTheDocument()
  })

  // 11. Accessible settlement descriptions
  it('renders screen-reader accessible descriptions for settlement cards', () => {
    const p1 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Ananya' })
    const p2 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Dev' })

    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Rafting',
      amount: 800,
      paidBy: p1.id,
      participantIds: [p1.id, p2.id],
      splitType: 'equal',
      date: '2026-10-10',
    })

    renderWithRouter(`/trips/${trip.id}/settlement`)

    // Accessible aria-label: "Dev pays Ananya ₹400"
    const card = screen.getByLabelText(/dev pays ananya ₹400/i)
    expect(card).toBeInTheDocument()
  })

  // 12. Mark paid toast interaction
  it('triggers toast notification when clicking Mark Paid on a settlement card', () => {
    const p1 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Ravi' })
    const p2 = useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Sunil' })

    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Breakfast Buffet',
      amount: 600,
      paidBy: p1.id,
      participantIds: [p1.id, p2.id],
      splitType: 'equal',
      date: '2026-10-10',
    })

    renderWithRouter(`/trips/${trip.id}/settlement`)

    const markPaidBtn = screen.getByRole('button', { name: /mark paid/i })
    fireEvent.click(markPaidBtn)

    expect(screen.getByText(/payment of ₹300 from sunil to ravi marked as recorded!/i)).toBeInTheDocument()
  })
})
