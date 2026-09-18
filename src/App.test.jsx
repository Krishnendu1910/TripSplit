import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App.jsx'

describe('TripSplit Application Smoke & Shell Tests', () => {
  it('renders application with TripSplit branding', () => {
    render(<App />)
    const brandLink = screen.getByRole('link', { name: /TripSplit/i })
    expect(brandLink).toBeInTheDocument()
  })

  it('renders the core home screen message and supporting copy', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /who owes/i })).toBeInTheDocument()
    expect(
      screen.getByText(/Keep track of the trip money chaos before your group chat turns into a courtroom/i),
    ).toBeInTheDocument()
  })

  it('displays primary and secondary action buttons', () => {
    render(<App />)
    const startTripButtons = screen.getAllByRole('button', { name: /Start a trip/i })
    expect(startTripButtons.length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Join a trip/i })).toBeInTheDocument()
  })
})
