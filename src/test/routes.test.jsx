import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { AppRoutes } from '../App'
import { useTripStore } from '../store/useTripStore'

function renderWithRouter(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </MemoryRouter>,
  )
}

describe('TripSplit Route Navigation', () => {
  let sampleTrip

  beforeEach(() => {
    useTripStore.getState().resetStore()
    sampleTrip = useTripStore.getState().createTrip({
      name: 'Goa Trip',
      destination: 'Goa, India',
      startDate: '2026-09-15',
      endDate: '2026-09-18',
      currency: 'INR',
      description: 'Beach holiday',
    })
  })

  it('renders home page at "/"', () => {
    renderWithRouter('/')
    expect(screen.getByRole('heading', { level: 1, name: /who owes/i })).toBeInTheDocument()
  })

  it('renders trips page at "/trips"', () => {
    renderWithRouter('/trips')
    expect(screen.getByRole('heading', { level: 1, name: /Your Trips/i })).toBeInTheDocument()
    expect(screen.getByText('Goa Trip')).toBeInTheDocument()
  })

  it('renders Trip overview with core metrics at "/trips/:tripId"', () => {
    renderWithRouter(`/trips/${sampleTrip.id}`)
    expect(screen.getByRole('heading', { level: 1, name: /Goa Trip/i })).toBeInTheDocument()
    expect(screen.getByText(/Total spent/i)).toBeInTheDocument()
    expect(screen.getAllByText(/People/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Expenses/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Financial Status/i)).toBeInTheDocument()
    expect(screen.queryByText(/Trip not found/i)).not.toBeInTheDocument()
  })

  it('opens trip detail page when clicking the active trip card on the Home page', () => {
    renderWithRouter('/')
    const tripCardLink = screen.getByRole('link', { name: /Goa Trip/i })
    expect(tripCardLink).toHaveAttribute('href', `/trips/${sampleTrip.id}`)

    fireEvent.click(tripCardLink)

    expect(screen.getByRole('heading', { level: 1, name: /Goa Trip/i })).toBeInTheDocument()
    expect(screen.queryByText(/Trip not found/i)).not.toBeInTheDocument()
  })

  it('renders trip expenses tab at "/trips/:tripId/expenses"', () => {
    renderWithRouter(`/trips/${sampleTrip.id}/expenses`)
    expect(screen.getByText(/No damage reported yet/i)).toBeInTheDocument()
  })

  it('renders trip members tab at "/trips/:tripId/people"', () => {
    renderWithRouter(`/trips/${sampleTrip.id}/people`)
    expect(screen.getByText(/A trip with just you\? Technically possible/i)).toBeInTheDocument()
  })

  it('renders trip settlement tab at "/trips/:tripId/settlement"', () => {
    renderWithRouter(`/trips/${sampleTrip.id}/settlement`)
    expect(screen.getByText(/Nobody owes anybody... yet/i)).toBeInTheDocument()
  })

  it('renders trip settlement tab at alternate alias "/trips/:tripId/settle"', () => {
    renderWithRouter(`/trips/${sampleTrip.id}/settle`)
    expect(screen.getByText(/Nobody owes anybody... yet/i)).toBeInTheDocument()
  })

  it('redirects to active trip settlement on global "/settlement"', () => {
    useTripStore.getState().setActiveTripId(sampleTrip.id)
    renderWithRouter('/settlement')
    expect(screen.getByText(/Nobody owes anybody... yet/i)).toBeInTheDocument()
  })

  it('renders 404 page for unknown route paths', () => {
    renderWithRouter('/some-mysterious-unknown-path')
    expect(
      screen.getByText(/Looks like this page went on a trip without us/i),
    ).toBeInTheDocument()
  })

  it('renders friendly trip not found state for unknown trip id', () => {
    renderWithRouter('/trips/non-existent-id')
    expect(screen.getByText(/Trip not found/i)).toBeInTheDocument()
  })
})
