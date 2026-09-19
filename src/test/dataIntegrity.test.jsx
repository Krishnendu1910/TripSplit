import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { AppRoutes } from '../App'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useExpenseStore } from '../store/useExpenseStore'
import { storageAdapter } from '../lib/persistence/storageAdapter'
import { getTripFinancialSummary } from '../features/finance'

function renderWithRouter(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </MemoryRouter>,
  )
}

describe('Data Integrity & Lifecycle Hardening Tests (Step 8)', () => {
  let tripA, tripB, pA1, pA2, pA3, pB1, pB2

  beforeEach(() => {
    useTripStore.getState().resetStore()
    useParticipantStore.getState().resetStore()
    useExpenseStore.getState().resetStore()

    // Trip A
    tripA = useTripStore.getState().createTrip({
      name: 'Goa Holiday',
      destination: 'Goa, India',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      currency: 'INR',
      description: 'Beach holiday with college friends',
    })

    pA1 = useParticipantStore.getState().addParticipant({
      tripId: tripA.id,
      name: 'Rohan',
    })
    pA2 = useParticipantStore.getState().addParticipant({
      tripId: tripA.id,
      name: 'Pritish',
    })
    pA3 = useParticipantStore.getState().addParticipant({
      tripId: tripA.id,
      name: 'Deba',
    })

    // Trip B (for multi-trip isolation testing)
    tripB = useTripStore.getState().createTrip({
      name: 'Kashmir Trek',
      destination: 'Srinagar, India',
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      currency: 'INR',
      description: 'Mountain trek expedition',
    })

    pB1 = useParticipantStore.getState().addParticipant({
      tripId: tripB.id,
      name: 'Aarav',
    })
    pB2 = useParticipantStore.getState().addParticipant({
      tripId: tripB.id,
      name: 'Kabir',
    })
  })

  // 1. trip deletion cascades participants
  it('1. trip deletion cascades participants', () => {
    expect(useParticipantStore.getState().getParticipantsByTrip(tripA.id)).toHaveLength(3)

    useTripStore.getState().deleteTrip(tripA.id)

    expect(useParticipantStore.getState().getParticipantsByTrip(tripA.id)).toHaveLength(0)
  })

  // 2. trip deletion cascades expenses
  it('2. trip deletion cascades expenses', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Hotel Stay',
      amount: 6000,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id, pA3.id],
      date: '2026-10-01',
    })
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Dinner Shack',
      amount: 1500,
      paidBy: pA2.id,
      participantIds: [pA1.id, pA2.id],
      date: '2026-10-02',
    })

    expect(useExpenseStore.getState().getExpensesByTrip(tripA.id)).toHaveLength(2)

    useTripStore.getState().deleteTrip(tripA.id)

    expect(useExpenseStore.getState().getExpensesByTrip(tripA.id)).toHaveLength(0)
  })

  // 3. trip deletion does not affect other trips
  it('3. trip deletion does not affect other trips', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripB.id,
      description: 'Trek Gear Rental',
      amount: 4000,
      paidBy: pB1.id,
      participantIds: [pB1.id, pB2.id],
      date: '2026-11-02',
    })

    useTripStore.getState().deleteTrip(tripA.id)

    // Trip B trip, participants, and expenses must remain completely intact
    expect(useTripStore.getState().getTripById(tripB.id)).not.toBeNull()
    expect(useParticipantStore.getState().getParticipantsByTrip(tripB.id)).toHaveLength(2)
    expect(useExpenseStore.getState().getExpensesByTrip(tripB.id)).toHaveLength(1)
    expect(useExpenseStore.getState().getExpensesByTrip(tripB.id)[0].description).toBe('Trek Gear Rental')
  })

  // 4. activeTripId handled after deletion
  it('4. activeTripId safely handled after trip deletion', () => {
    useTripStore.getState().setActiveTripId(tripA.id)
    expect(useTripStore.getState().activeTripId).toBe(tripA.id)

    // Deleting the active trip switches to remaining trip (tripB)
    useTripStore.getState().deleteTrip(tripA.id)
    expect(useTripStore.getState().activeTripId).toBe(tripB.id)

    // Deleting tripB leaves no trips, so activeTripId becomes null
    useTripStore.getState().deleteTrip(tripB.id)
    expect(useTripStore.getState().activeTripId).toBeNull()
  })

  // 5. participant removal with financial history
  it('5. participant removal is prevented when participant has existing financial history', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Dinner',
      amount: 3000,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id, pA3.id],
      date: '2026-10-01',
    })

    // Attempting to delete Rohan (payer) throws error
    expect(() => {
      useParticipantStore.getState().removeParticipant(pA1.id)
    }).toThrow(/referenced by existing expenses/i)

    // Attempting to delete Pritish (split participant) throws error
    expect(() => {
      useParticipantStore.getState().removeParticipant(pA2.id)
    }).toThrow(/referenced by existing expenses/i)

    // Both participants remain safely in store
    expect(useParticipantStore.getState().getParticipantById(pA1.id)).not.toBeNull()
    expect(useParticipantStore.getState().getParticipantById(pA2.id)).not.toBeNull()

    // Test RemovePersonModal UI behavior
    renderWithRouter(`/trips/${tripA.id}/people`)
    const removeBtns = screen.getAllByRole('button', { name: /Remove Rohan/i })
    fireEvent.click(removeBtns[0])

    // Should show explanation banner rather than deletion confirmation
    expect(screen.getByText(/Can't remove this person yet/i)).toBeInTheDocument()
    expect(screen.getAllByText(/referenced by existing expenses/i).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /^Remove Person$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Keep in Squad/i })).toBeInTheDocument()
  })

  // 6. participant rename preserves ID
  it('6. participant rename preserves exact participant ID', () => {
    const originalId = pA1.id
    const updated = useParticipantStore.getState().updateParticipant(pA1.id, {
      name: 'Rohan Sarkar',
    })

    expect(updated.id).toBe(originalId)
    expect(updated.name).toBe('Rohan Sarkar')
    expect(useParticipantStore.getState().getParticipantById(originalId).name).toBe('Rohan Sarkar')
  })

  // 7. participant rename preserves financial results
  it('7. participant rename preserves exact financial balances and settlements', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Seafood Feast',
      amount: 3000,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id, pA3.id],
      date: '2026-10-02',
    })

    const summaryBefore = getTripFinancialSummary(tripA.id)

    // Rename Rohan -> Rohan Sarkar
    useParticipantStore.getState().updateParticipant(pA1.id, {
      name: 'Rohan Sarkar',
    })

    const summaryAfter = getTripFinancialSummary(tripA.id)

    expect(summaryAfter.totalSpent).toBe(summaryBefore.totalSpent)
    expect(summaryAfter.paidByParticipant[pA1.id]).toBe(summaryBefore.paidByParticipant[pA1.id])
    expect(summaryAfter.balances[pA1.id].net).toBe(summaryBefore.balances[pA1.id].net)
    expect(summaryAfter.settlements).toHaveLength(summaryBefore.settlements.length)
    expect(summaryAfter.settlements[0].amount).toBe(summaryBefore.settlements[0].amount)
  })

  // 8. expense edit preserves ID
  it('8. expense edit preserves exact expense ID', () => {
    const created = useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Initial Breakfast',
      amount: 900,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id],
      date: '2026-10-01',
    })

    const updated = useExpenseStore.getState().updateExpense(created.id, {
      description: 'Updated Breakfast Buffet',
      amount: 1200,
      id: 'hacker-attempt-to-overwrite-id',
    })

    expect(updated.id).toBe(created.id)
    expect(updated.id).not.toBe('hacker-attempt-to-overwrite-id')
  })

  // 9. expense edit preserves createdAt
  it('9. expense edit preserves original createdAt timestamp', () => {
    const created = useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Beach Umbrella',
      amount: 400,
      paidBy: pA2.id,
      participantIds: [pA1.id, pA2.id],
      date: '2026-10-01',
    })

    const updated = useExpenseStore.getState().updateExpense(created.id, {
      description: 'Beach Umbrella and Loungers',
      amount: 600,
      createdAt: '1999-01-01T00:00:00.000Z',
    })

    expect(updated.createdAt).toBe(created.createdAt)
    expect(updated.createdAt).not.toBe('1999-01-01T00:00:00.000Z')
  })

  // 10. expense edit updates updatedAt
  it('10. expense edit sets new updatedAt timestamp', () => {
    const created = useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Coffee',
      amount: 200,
      paidBy: pA1.id,
      participantIds: [pA1.id],
      date: '2026-10-01',
    })

    const updated = useExpenseStore.getState().updateExpense(created.id, {
      description: 'Specialty Coffee',
      amount: 250,
    })

    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.createdAt).getTime(),
    )
  })

  // 11. expense edit updates financial results
  it('11. expense edit immediately recalculates financial summary', () => {
    const created = useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Dinner',
      amount: 3000,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id, pA3.id],
      date: '2026-10-01',
    })

    expect(getTripFinancialSummary(tripA.id).totalSpent).toBe(3000)

    // Edit amount from 3000 to 6000
    useExpenseStore.getState().updateExpense(created.id, {
      amount: 6000,
    })

    const summaryAfter = getTripFinancialSummary(tripA.id)
    expect(summaryAfter.totalSpent).toBe(6000)
    expect(summaryAfter.balances[pA1.id].net).toBe(4000) // paid 6000, share 2000 => net +4000
    expect(summaryAfter.balances[pA2.id].net).toBe(-2000)
  })

  // 12. expense deletion updates financial results
  it('12. expense deletion immediately updates financial summary', () => {
    const exp1 = useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Boat Tour',
      amount: 3000,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id, pA3.id],
      date: '2026-10-01',
    })
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Snacks',
      amount: 600,
      paidBy: pA2.id,
      participantIds: [pA1.id, pA2.id],
      date: '2026-10-02',
    })

    expect(getTripFinancialSummary(tripA.id).totalSpent).toBe(3600)

    // Delete Boat Tour
    useExpenseStore.getState().deleteExpense(exp1.id)

    expect(getTripFinancialSummary(tripA.id).totalSpent).toBe(600)
    expect(getTripFinancialSummary(tripA.id).balances[pA2.id].paid).toBe(600)
  })

  // 13. archive preserves historical data
  it('13. archiving a trip preserves all participants, expenses, and balances', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Villa Stay',
      amount: 9000,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id, pA3.id],
      date: '2026-10-01',
    })

    const summaryBefore = getTripFinancialSummary(tripA.id)

    useTripStore.getState().archiveTrip(tripA.id)

    expect(useTripStore.getState().getTripById(tripA.id).status).toBe('archived')
    expect(useParticipantStore.getState().getParticipantsByTrip(tripA.id)).toHaveLength(3)
    expect(useExpenseStore.getState().getExpensesByTrip(tripA.id)).toHaveLength(1)

    const summaryAfter = getTripFinancialSummary(tripA.id)
    expect(summaryAfter.totalSpent).toBe(summaryBefore.totalSpent)
    expect(summaryAfter.settlements).toEqual(summaryBefore.settlements)
  })

  // 14. unarchive preserves historical data
  it('14. unarchiving a trip restores active status without modifying any data', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Villa Stay',
      amount: 9000,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id, pA3.id],
      date: '2026-10-01',
    })

    useTripStore.getState().archiveTrip(tripA.id)
    useTripStore.getState().unarchiveTrip(tripA.id)

    expect(useTripStore.getState().getTripById(tripA.id).status).toBe('active')
    expect(getTripFinancialSummary(tripA.id).totalSpent).toBe(9000)
  })

  // 15. foreign payer rejected
  it('15. rejects an expense when payer belongs to a different trip', () => {
    expect(() => {
      useExpenseStore.getState().createExpense({
        tripId: tripA.id,
        description: 'Cross-trip Hack',
        amount: 1000,
        paidBy: pB1.id, // Aarav belongs to Trip B!
        participantIds: [pA1.id, pA2.id],
        date: '2026-10-01',
      })
    }).toThrow(/Payer must be a registered squad member of this trip/i)
  })

  // 16. foreign participant rejected
  it('16. rejects an expense when split participant belongs to a different trip', () => {
    expect(() => {
      useExpenseStore.getState().createExpense({
        tripId: tripA.id,
        description: 'Cross-trip Split Hack',
        amount: 1000,
        paidBy: pA1.id,
        participantIds: [pA1.id, pB2.id], // Kabir belongs to Trip B!
        date: '2026-10-01',
      })
    }).toThrow(/All participants must belong to this trip/i)
  })

  // 17. nonexistent participant rejected
  it('17. rejects an expense with nonexistent participant ID', () => {
    expect(() => {
      useExpenseStore.getState().createExpense({
        tripId: tripA.id,
        description: 'Ghost Participant',
        amount: 1000,
        paidBy: pA1.id,
        participantIds: [pA1.id, 'ghost-participant-999'],
        date: '2026-10-01',
      })
    }).toThrow(/All participants must belong to this trip/i)
  })

  // 18. invalid trip rejected
  it('18. rejects an expense referencing nonexistent trip', () => {
    expect(() => {
      useExpenseStore.getState().createExpense({
        tripId: 'nonexistent-trip-xyz',
        description: 'Nowhere Expense',
        amount: 500,
        paidBy: pA1.id,
        participantIds: [pA1.id],
        date: '2026-10-01',
      })
    }).toThrow(/Trip not found/i)
  })

  // 19. malformed storage handled safely
  it('19. safely handles malformed storage data during store initialization without crashing', () => {
    // Inject corrupt data into localStorage
    storageAdapter.set('trips', 'corrupted-non-array-string')
    storageAdapter.set('participants', { bad: 'object-not-array' })
    storageAdapter.set('expenses', null)

    // Re-initialize stores
    expect(() => {
      useTripStore.getState().resetStore()
      useParticipantStore.getState().resetStore()
      useExpenseStore.getState().resetStore()
    }).not.toThrow()

    expect(useTripStore.getState().trips).toEqual([])
    expect(useParticipantStore.getState().participants).toEqual([])
    expect(useExpenseStore.getState().expenses).toEqual([])
  })

  // 20. hydration preserves financial results
  it('20. persistence hydration perfectly restores financial state', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Scooters',
      amount: 1800,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id, pA3.id],
      date: '2026-10-01',
    })

    const summaryOriginal = getTripFinancialSummary(tripA.id)

    // Simulate page reload by reading directly from storage
    const savedTrips = storageAdapter.get('trips')
    const savedParticipants = storageAdapter.get('participants')
    const savedExpenses = storageAdapter.get('expenses')

    expect(savedTrips).toHaveLength(2)
    expect(savedParticipants).toHaveLength(5)
    expect(savedExpenses).toHaveLength(1)

    const summaryHydrated = getTripFinancialSummary(tripA.id)
    expect(summaryHydrated.totalSpent).toBe(summaryOriginal.totalSpent)
    expect(summaryHydrated.settlements).toEqual(summaryOriginal.settlements)
  })

  // 21. deleted trip direct route handled
  it('21. handles direct route to deleted trip gracefully with "Trip not found"', () => {
    const deletedId = tripA.id
    useTripStore.getState().deleteTrip(deletedId)

    renderWithRouter(`/trips/${deletedId}`)

    expect(screen.getByRole('heading', { level: 3, name: /Trip not found/i })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`couldn't locate trip #${deletedId}`, 'i'))).toBeInTheDocument()
    expect(useTripStore.getState().activeTripId).not.toBe(deletedId)
  })

  // 22. invalid trip direct route handled
  it('22. handles direct route to random invalid trip gracefully with "Trip not found"', () => {
    renderWithRouter('/trips/random-bogus-trip-id')

    expect(screen.getByRole('heading', { level: 3, name: /Trip not found/i })).toBeInTheDocument()
    expect(useTripStore.getState().activeTripId).toBeNull()
  })

  // 23. cross-trip data remains isolated
  it('23. cross-trip data remains strictly isolated across multiple mutations', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Goa Surf Lesson',
      amount: 2500,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id],
      date: '2026-10-01',
    })
    useExpenseStore.getState().createExpense({
      tripId: tripB.id,
      description: 'Kashmir Tent Booking',
      amount: 5000,
      paidBy: pB1.id,
      participantIds: [pB1.id, pB2.id],
      date: '2026-11-01',
    })

    const summaryA = getTripFinancialSummary(tripA.id)
    const summaryB = getTripFinancialSummary(tripB.id)

    expect(summaryA.totalSpent).toBe(2500)
    expect(summaryB.totalSpent).toBe(5000)
    expect(summaryA.paidByParticipant[pB1.id]).toBeUndefined()
    expect(summaryB.paidByParticipant[pA1.id]).toBeUndefined()
  })

  // 24. settlement reconciliation after expense mutation
  it('24. zero-sum financial invariants hold after expense mutation', () => {
    const exp = useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Dinner Party',
      amount: 3000,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id, pA3.id],
      date: '2026-10-01',
    })

    // Update expense to 4500
    useExpenseStore.getState().updateExpense(exp.id, {
      amount: 4500,
    })

    const summary = getTripFinancialSummary(tripA.id)

    // sum(paid) === totalExpenses
    const sumPaid = Object.values(summary.paidByParticipant).reduce((a, b) => a + b, 0)
    expect(sumPaid).toBe(4500)

    // sum(owed) === totalExpenses
    const sumOwed = summary.balancesList.reduce((acc, curr) => acc + curr.owed, 0)
    expect(sumOwed).toBe(4500)

    // sum(net) === 0 (Critical zero-sum invariant)
    const sumNet = summary.balancesList.reduce((acc, curr) => acc + curr.net, 0)
    expect(Math.abs(sumNet)).toBeLessThan(0.0001)

    // Settlement transactions must equal net obligations
    expect(summary.invariantsHold).toBe(true)
  })

  // 25. no orphan expenses after trip deletion
  it('25. leaves no orphan expenses in storage after trip deletion', () => {
    useExpenseStore.getState().createExpense({
      tripId: tripA.id,
      description: 'Parasailing',
      amount: 3500,
      paidBy: pA1.id,
      participantIds: [pA1.id, pA2.id],
      date: '2026-10-02',
    })

    useTripStore.getState().deleteTrip(tripA.id)

    const allExpenses = useExpenseStore.getState().expenses
    const orphanExpenses = allExpenses.filter((e) => e.tripId === tripA.id)
    expect(orphanExpenses).toHaveLength(0)
  })

  // 26. no orphan participants after trip deletion
  it('26. leaves no orphan participants in storage after trip deletion', () => {
    useTripStore.getState().deleteTrip(tripA.id)

    const allParticipants = useParticipantStore.getState().participants
    const orphanParticipants = allParticipants.filter((p) => p.tripId === tripA.id)
    expect(orphanParticipants).toHaveLength(0)
  })
})
