import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

describe('TripSplit Route Navigation', () => {
  it('renders home page at "/"', () => {
    renderWithRouter('/')
    expect(screen.getByRole('heading', { level: 1, name: /who owes/i })).toBeInTheDocument()
  })

  it('renders trips page at "/trips"', () => {
    renderWithRouter('/trips')
    expect(screen.getByRole('heading', { level: 1, name: /Your Trips/i })).toBeInTheDocument()
  })

  it('renders Goa Trip overview with 4 core metrics at "/trips/goa-trip"', () => {
    renderWithRouter('/trips/goa-trip')
    expect(screen.getByRole('heading', { level: 1, name: /Goa Trip/i })).toBeInTheDocument()
    expect(screen.getByText(/Total spent/i)).toBeInTheDocument()
    expect(screen.getByText(/₹18,750/)).toBeInTheDocument()
    expect(screen.getAllByText(/People/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Expenses/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Your balance/i)).toBeInTheDocument()
    expect(screen.getByText(/\+₹1,650/)).toBeInTheDocument()
  })

  it('renders trip expenses tab at "/trips/goa-trip/expenses"', () => {
    renderWithRouter('/trips/goa-trip/expenses')
    expect(screen.getByRole('heading', { level: 2, name: /Trip Expenses/i })).toBeInTheDocument()
  })

  it('renders trip members tab at "/trips/goa-trip/people"', () => {
    renderWithRouter('/trips/goa-trip/people')
    expect(screen.getByRole('heading', { level: 2, name: /Trip Members/i })).toBeInTheDocument()
  })

  it('renders trip settlement tab at "/trips/goa-trip/settlement"', () => {
    renderWithRouter('/trips/goa-trip/settlement')
    expect(screen.getByRole('heading', { level: 2, name: /Settlement Plan/i })).toBeInTheDocument()
  })

  it('renders 404 page for unknown routes', () => {
    renderWithRouter('/some-mysterious-unknown-path')
    expect(
      screen.getByText(/Looks like this page went on a trip without us/i),
    ).toBeInTheDocument()
  })
})
