import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { TripDetailPage } from '../pages/TripDetailPage'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'

function renderTripWithRouter(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell>
        <Routes>
          <Route path="/trips/:tripId" element={<TripDetailPage subview="overview" />} />
          <Route path="/trips/:tripId/people" element={<TripDetailPage subview="people" />} />
        </Routes>
      </AppShell>
    </MemoryRouter>,
  )
}

describe('People / Participant Management UI Flow', () => {
  let trip

  beforeEach(() => {
    useTripStore.getState().resetStore()
    useParticipantStore.getState().resetStore()

    trip = useTripStore.getState().createTrip({
      name: 'Manali Adventure',
      destination: 'Manali, HP',
      startDate: '2026-10-01',
      endDate: '2026-10-06',
      currency: 'INR',
    })
  })

  it('renders clean empty state when no participants exist', () => {
    renderTripWithRouter(`/trips/${trip.id}/people`)

    expect(screen.getByText(/WHO'S ON THIS TRIP\?/i)).toBeInTheDocument()
    expect(screen.getByText('0 people')).toBeInTheDocument()
    expect(screen.getByText(/A trip with just you\? Technically possible/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add a friend/i })).toBeInTheDocument()
  })

  it('adds a participant and renders their card with balance placeholder', async () => {
    renderTripWithRouter(`/trips/${trip.id}/people`)

    // Open add modal
    fireEvent.click(screen.getByRole('button', { name: /Add a friend/i }))
    expect(screen.getByRole('heading', { name: /Add Squad Member/i })).toBeInTheDocument()

    // Enter name
    const input = screen.getByLabelText(/Member Name/i)
    fireEvent.change(input, { target: { value: 'Pkm' } })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Add to Squad/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Pkm' })).toBeInTheDocument()
      expect(screen.getByText(/Add expenses to see this person's balance\./i)).toBeInTheDocument()
      expect(screen.getByText('1 person')).toBeInTheDocument()
    })
  })

  it('prevents duplicate names within the same trip', async () => {
    useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Pkm' })

    renderTripWithRouter(`/trips/${trip.id}/people`)

    expect(screen.getByRole('heading', { level: 3, name: 'Pkm' })).toBeInTheDocument()

    // Open add modal
    fireEvent.click(screen.getByRole('button', { name: /^Add Person$/i }))

    // Try adding duplicate name with different casing
    const input = screen.getByLabelText(/Member Name/i)
    fireEvent.change(input, { target: { value: '  pkm  ' } })

    fireEvent.click(screen.getByRole('button', { name: /Add to Squad/i }))

    await waitFor(() => {
      expect(screen.getByText(/Someone with this name is already on this trip!/i)).toBeInTheDocument()
    })
  })

  it('edits a participant name while preserving their identity', async () => {
    const participant = useParticipantStore.getState().addParticipant({
      tripId: trip.id,
      name: 'Rohan',
    })

    renderTripWithRouter(`/trips/${trip.id}/people`)

    expect(screen.getByRole('heading', { level: 3, name: 'Rohan' })).toBeInTheDocument()

    // Click edit button
    const editBtn = screen.getByLabelText('Edit Rohan')
    fireEvent.click(editBtn)

    expect(screen.getByRole('heading', { name: /Edit Squad Member/i })).toBeInTheDocument()

    // Update name
    const input = screen.getByLabelText(/Member Name/i)
    expect(input.value).toBe('Rohan')
    fireEvent.change(input, { target: { value: 'Rohan Sharma' } })

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Rohan Sharma' })).toBeInTheDocument()
      expect(screen.queryByText(/^Rohan$/)).not.toBeInTheDocument()
    })

    // Stable ID verification
    const updatedInStore = useParticipantStore.getState().getParticipantById(participant.id)
    expect(updatedInStore.name).toBe('Rohan Sharma')
  })

  it('removes a participant after confirmation modal', async () => {
    useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Deba' })
    useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Pkm' })

    renderTripWithRouter(`/trips/${trip.id}/people`)

    expect(screen.getByText('2 people')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Deba' })).toBeInTheDocument()

    // Click remove Deba
    const removeBtn = screen.getByLabelText('Remove Deba')
    fireEvent.click(removeBtn)

    expect(screen.getByRole('heading', { name: /Remove Trip Member\?/i })).toBeInTheDocument()
    expect(screen.getByText(/Remove Deba from squad\?/i)).toBeInTheDocument()

    // Confirm
    fireEvent.click(screen.getByRole('button', { name: /Remove Person/i }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Deba' })).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Pkm' })).toBeInTheDocument()
      expect(screen.getByText('1 person')).toBeInTheDocument()
    })
  })

  it('dynamically reflects people count on Trip Overview', () => {
    useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Member 1' })
    useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Member 2' })
    useParticipantStore.getState().addParticipant({ tripId: trip.id, name: 'Member 3' })

    renderTripWithRouter(`/trips/${trip.id}`)

    // Overview metric tile for People should display 3
    const manageLink = screen.getByText('Manage members →')
    const peopleTile = manageLink.closest('div')
    expect(peopleTile).toBeInTheDocument()
    expect(peopleTile).toHaveTextContent('3')
  })
})

