import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { CreateTripModal } from '../features/trips/components/CreateTripModal'
import { HomePage } from '../pages/HomePage'
import { TripsPage } from '../pages/TripsPage'
import { TripDetailPage } from '../pages/TripDetailPage'
import { useTripStore } from '../store/useTripStore'

function renderAppWithRouter(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage subview="overview" />} />
          <Route path="/trips/:tripId/expenses" element={<TripDetailPage subview="expenses" />} />
          <Route path="/trips/:tripId/people" element={<TripDetailPage subview="people" />} />
          <Route path="/trips/:tripId/settlement" element={<TripDetailPage subview="settlement" />} />
        </Routes>
        <CreateTripModal />
      </AppShell>
    </MemoryRouter>,
  )
}

describe('Trip Management Full UI Flow', () => {
  beforeEach(() => {
    useTripStore.getState().resetStore()
  })

  it('renders clean empty state on home and trips page when no trips exist', () => {
    renderAppWithRouter('/')
    expect(screen.getByText(/Your wallet is suspiciously peaceful/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Start a trip/i }).length).toBeGreaterThan(0)
  })

  it('creates a new trip through the CreateTripModal and opens the trip detail page', async () => {
    renderAppWithRouter('/')

    // Trigger Create Trip modal
    const startTripButtons = screen.getAllByRole('button', { name: /Start a trip/i })
    fireEvent.click(startTripButtons[0])

    expect(screen.getByRole('heading', { name: /Plan a new adventure/i })).toBeInTheDocument()

    // Fill form
    fireEvent.change(screen.getByLabelText(/Trip Name/i), { target: { value: 'Ladakh Bike Tour' } })
    fireEvent.change(screen.getByLabelText(/Destination/i), { target: { value: 'Leh Ladakh' } })
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-07-01' } })
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2026-07-10' } })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Create Trip/i }))

    // Should navigate to trip detail
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Ladakh Bike Tour/i })).toBeInTheDocument()
      expect(screen.getByText(/Leh Ladakh/i)).toBeInTheDocument()
    })
  })

  it('allows editing an existing trip and immediately updates details', async () => {
    const trip = useTripStore.getState().createTrip({
      name: 'Kerala Backwaters',
      destination: 'Alleppey',
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      currency: 'INR',
      description: 'Houseboat stay',
    })

    renderAppWithRouter(`/trips/${trip.id}`)

    expect(screen.getByRole('heading', { level: 1, name: /Kerala Backwaters/i })).toBeInTheDocument()

    // Click Edit
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))

    expect(screen.getByRole('heading', { name: /Edit Trip Details/i })).toBeInTheDocument()

    // Modify name and destination
    fireEvent.change(screen.getByLabelText(/Trip Name/i), { target: { value: 'Grand Kerala Tour' } })
    fireEvent.change(screen.getByLabelText(/Destination/i), { target: { value: 'Alleppey & Munnar' } })

    // Save
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Grand Kerala Tour/i })).toBeInTheDocument()
      expect(screen.getByText(/Alleppey & Munnar/i)).toBeInTheDocument()
    })
  })

  it('archives and unarchives a trip with banner and tab updates', async () => {
    const trip = useTripStore.getState().createTrip({
      name: 'Rishikesh Rafting',
      destination: 'Rishikesh',
      startDate: '2026-05-01',
      endDate: '2026-05-04',
      currency: 'INR',
    })

    renderAppWithRouter(`/trips/${trip.id}`)

    // Click Archive
    const archiveBtn = screen.getByRole('button', { name: /^Archive$/i })
    fireEvent.click(archiveBtn)

    // Should display archived banner
    expect(screen.getByText(/This trip is currently archived/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Unarchive$/i })).toBeInTheDocument()

    // Click Unarchive
    const unarchiveBtn = screen.getByRole('button', { name: /^Unarchive$/i })
    fireEvent.click(unarchiveBtn)

    expect(screen.queryByText(/This trip is currently archived/i)).not.toBeInTheDocument()
  })

  it('permanently deletes a trip with modal confirmation and redirects to /trips', async () => {
    const trip = useTripStore.getState().createTrip({
      name: 'Temporary Weekend Trip',
      destination: 'Lonavala',
      startDate: '2026-06-01',
      endDate: '2026-06-02',
      currency: 'INR',
    })

    renderAppWithRouter(`/trips/${trip.id}`)

    expect(screen.getByRole('heading', { level: 1, name: /Temporary Weekend Trip/i })).toBeInTheDocument()

    // Click Delete
    fireEvent.click(screen.getByRole('button', { name: /^Delete$/i }))

    // Confirmation dialog appears
    expect(screen.getByRole('heading', { name: /Delete Trip Permanently\?/i })).toBeInTheDocument()
    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument()

    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: /Delete Permanently/i }))

    // Should redirect to Trips page and trip should no longer exist
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Your Trips/i })).toBeInTheDocument()
      expect(screen.queryByText('Temporary Weekend Trip')).not.toBeInTheDocument()
    })
  })

  it('switches between Active and Archived tabs on the Trips page', () => {
    useTripStore.getState().createTrip({
      name: 'Active Bali Trip',
      destination: 'Bali, Indonesia',
      startDate: '2026-09-01',
      endDate: '2026-09-10',
      currency: 'USD',
    })

    const archived = useTripStore.getState().createTrip({
      name: 'Past Paris Trip',
      destination: 'Paris, France',
      startDate: '2025-05-01',
      endDate: '2025-05-08',
      currency: 'EUR',
    })
    useTripStore.getState().archiveTrip(archived.id)

    renderAppWithRouter('/trips')

    // Default active tab shows Active Bali Trip
    expect(screen.getByText('Active Bali Trip')).toBeInTheDocument()
    expect(screen.queryByText('Past Paris Trip')).not.toBeInTheDocument()

    // Switch to Archived tab
    fireEvent.click(screen.getByRole('button', { name: /Archived/i }))

    expect(screen.getByText('Past Paris Trip')).toBeInTheDocument()
    expect(screen.queryByText('Active Bali Trip')).not.toBeInTheDocument()
  })
})
