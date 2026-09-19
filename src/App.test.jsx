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

  it('verifies homepage hero elements and footer text at desktop viewport', () => {
    window.innerWidth = 1280
    render(<App />)

    // 1. Hero heading is present
    expect(screen.getByRole('heading', { level: 1, name: /who owes/i })).toBeInTheDocument()
    expect(screen.getByText(/So\.\.\./i)).toBeInTheDocument()

    // Hero badge is removed
    expect(screen.queryByText(/Playful Travel • Serious Math/i)).not.toBeInTheDocument()

    // Subtitle is preserved
    expect(
      screen.getByText('Keep track of the trip money chaos before your group chat turns into a courtroom.'),
    ).toBeInTheDocument()

    // Buttons and right-side card are preserved
    expect(screen.getAllByRole('button', { name: /Start a trip/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Join a trip/i })).toBeInTheDocument()
    expect(screen.getByText('Smart Split Engine')).toBeInTheDocument()

    // 2. Footer left text is preserved, right text is removed
    const footer = screen.getByRole('contentinfo', { hidden: true })
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveTextContent(/TripSplit • Defusing group vacation money drama before it happens\./i)
    expect(footer).not.toHaveTextContent(/Playful Travel • Serious Math/i)
  })

  it('renders cleanly across tablet and mobile viewports with no overflow', () => {
    // Tablet (768px)
    window.innerWidth = 768
    const { unmount } = render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /who owes/i })).toBeInTheDocument()
    expect(screen.queryByText(/Playful Travel • Serious Math/i)).not.toBeInTheDocument()
    expect(screen.getByText('Smart Split Engine')).toBeInTheDocument()
    unmount()

    // Mobile (375px)
    window.innerWidth = 375
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /who owes/i })).toBeInTheDocument()
    expect(screen.queryByText(/Playful Travel • Serious Math/i)).not.toBeInTheDocument()
    expect(
      screen.getByText('Keep track of the trip money chaos before your group chat turns into a courtroom.'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Start a trip/i }).length).toBeGreaterThan(0)
  })
})
