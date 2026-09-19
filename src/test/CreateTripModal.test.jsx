import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CreateTripModal } from '../features/trips/components/CreateTripModal'
import { useUIStore } from '../store/useUIStore'

describe('CreateTripModal Form & Validation', () => {
  beforeEach(() => {
    useUIStore.getState().openCreateTripModal()
  })

  it('renders modal fields: name, destination, start date, end date, currency', () => {
    render(
      <MemoryRouter>
        <CreateTripModal />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /Plan a new adventure/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Trip Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Destination/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Currency/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description \(Optional\)/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitted empty', () => {
    render(
      <MemoryRouter>
        <CreateTripModal />
      </MemoryRouter>,
    )

    const submitBtn = screen.getByRole('button', { name: /Create Trip/i })
    fireEvent.click(submitBtn)

    expect(screen.getByText(/Every grand adventure needs a name!/i)).toBeInTheDocument()
    expect(screen.getByText(/Where are you heading\?/i)).toBeInTheDocument()
  })
})

