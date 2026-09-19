import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { AppShell } from '../components/layout/AppShell'
import { TripNavigationTabs } from '../components/layout/TripNavigationTabs'
import { ExpensesList } from '../features/expenses/components/ExpensesList'
import { PeopleList } from '../features/participants/components/PeopleList'
import { DeleteTripModal } from '../features/trips/components/DeleteTripModal'
import { DeleteExpenseModal } from '../features/expenses/components/DeleteExpenseModal'
import { useTripStore } from '../store/useTripStore'
import { useParticipantStore } from '../store/useParticipantStore'
import { useExpenseStore } from '../store/useExpenseStore'
import { useUIStore } from '../store/useUIStore'
import { Trash, Sparkle } from '@phosphor-icons/react'

describe('Step 9: Responsive UX & Accessibility (a11y) Test Suite', () => {
  beforeEach(() => {
    useTripStore.getState().resetStore()
    useParticipantStore.getState().resetStore()
    useExpenseStore.getState().resetStore()
    useUIStore.getState().clearToast()
  })

  // 1. Modal Dialog Semantics
  it('Modal renders with proper accessibility attributes (dialog, aria-modal, labelledby, describedby)', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Edit Adventure"
        description="Change your trip parameters safely."
      >
        <p>Modal Content</p>
      </Modal>,
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description')
    expect(screen.getByText('Edit Adventure')).toHaveAttribute('id', 'modal-title')
    expect(screen.getByText('Change your trip parameters safely.')).toHaveAttribute(
      'id',
      'modal-description',
    )
  })

  // 2. Modal Focus Trapping
  it('traps Tab focus inside the Modal cycling from last element to first element', async () => {
    function TestModal() {
      return (
        <Modal isOpen={true} onClose={() => {}} title="Test Trap">
          <input data-testid="input-1" placeholder="First" />
          <input data-testid="input-2" placeholder="Second" />
          <button data-testid="btn-submit">Submit</button>
        </Modal>
      )
    }

    render(<TestModal />)

    const closeBtn = screen.getByRole('button', { name: /Close dialog/i })
    const btnSubmit = screen.getByTestId('btn-submit')

    // Initially focus moves into modal
    await waitFor(() => {
      expect(document.activeElement).toBe(closeBtn)
    })

    // Focus last element
    btnSubmit.focus()
    expect(document.activeElement).toBe(btnSubmit)

    // Press Tab on the last element -> should cycle back to the first element (closeBtn)
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: false })
    expect(document.activeElement).toBe(closeBtn)

    // Press Shift+Tab on the first element -> should cycle to the last element (btnSubmit)
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(btnSubmit)
  })

  // 3. Modal Escape to close
  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Escape">
        <p>Content</p>
      </Modal>,
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  // 4. Modal restores focus on close
  it('restores focus to previous active element after modal closes', async () => {
    function HostComponent() {
      const [isOpen, setIsOpen] = useState(false)
      return (
        <div>
          <button data-testid="trigger-btn" onClick={() => setIsOpen(true)}>
            Open Dialog
          </button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test Return Focus">
            <button data-testid="close-btn" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </Modal>
        </div>
      )
    }

    render(<HostComponent />)

    const trigger = screen.getByTestId('trigger-btn')
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    // Open modal
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Close modal
    const closeBtn = screen.getByTestId('close-btn')
    fireEvent.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(document.activeElement).toBe(trigger)
    })
  })

  // 5. Button renders semantic Link when to prop is provided
  it('Button renders semantic Link when to prop is passed', () => {
    render(
      <MemoryRouter>
        <Button to="/trips/123/expenses" variant="primary">
          View Expenses
        </Button>
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: /View Expenses/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/trips/123/expenses')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  // 6. Button renders semantic button when to prop is omitted
  it('Button renders semantic button when to prop is not provided', () => {
    const handleClick = vi.fn()
    render(
      <Button onClick={handleClick} variant="primary">
        Submit Expense
      </Button>,
    )

    const btn = screen.getByRole('button', { name: /Submit Expense/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('type', 'button')
    fireEvent.click(btn)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // 7. Button destructive variant styling
  it('Button destructive variant applies high-contrast danger styling', () => {
    render(
      <Button variant="destructive" icon={Trash}>
        Delete Permanently
      </Button>,
    )

    const btn = screen.getByRole('button', { name: /Delete Permanently/i })
    expect(btn.className).toContain('bg-red-600')
    expect(btn.className).toContain('text-white')
  })

  // 8. Button icons have aria-hidden="true"
  it('Button decorative icons have aria-hidden="true" to prevent screen reader noise', () => {
    render(
      <Button variant="primary" icon={Sparkle}>
        Magic Button
      </Button>,
    )

    const svg = document.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  // 9. Input aria-describedby and role="alert"
  it('Input associates error text via aria-describedby and marks role="alert"', () => {
    render(
      <Input
        id="expense-amount"
        label="Amount"
        value=""
        error="Amount must be greater than zero"
        onChange={() => {}}
      />,
    )

    const input = screen.getByLabelText(/Amount/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'expense-amount-error')

    const errorMsg = screen.getByRole('alert')
    expect(errorMsg).toHaveTextContent('Amount must be greater than zero')
    expect(errorMsg).toHaveAttribute('id', 'expense-amount-error')
  })

  // 10. Select aria-describedby and role="alert"
  it('Select associates error text via aria-describedby and marks role="alert"', () => {
    render(
      <Select
        id="payer-select"
        label="Who Paid?"
        error="Please select who paid"
        value=""
        onChange={() => {}}
      >
        <option value="">Choose someone</option>
        <option value="p1">Rohan</option>
      </Select>,
    )

    const select = screen.getByLabelText(/Who Paid\?/i)
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAttribute('aria-describedby', 'payer-select-error')

    const errorMsg = screen.getByRole('alert')
    expect(errorMsg).toHaveTextContent('Please select who paid')
    expect(errorMsg).toHaveAttribute('id', 'payer-select-error')
  })

  // 11. AppShell skip-to-content link
  it('AppShell renders an accessible skip-to-content link pointing to #main-content', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <p>Page Content</p>
        </AppShell>
      </MemoryRouter>,
    )

    const skipLink = screen.getByRole('link', { name: /Skip to main content/i })
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')

    const main = document.getElementById('main-content')
    expect(main).toBeInTheDocument()
  })

  // 12. AppShell toast status and dismiss button accessibility
  it('AppShell toast renders with role="status", aria-live="polite", and accessible dismiss button', () => {
    useUIStore.getState().showToast('Expense recorded successfully!', 'success')

    render(
      <MemoryRouter>
        <AppShell>
          <p>Page Content</p>
        </AppShell>
      </MemoryRouter>,
    )

    const toastRegion = screen.getByRole('status')
    expect(toastRegion).toBeInTheDocument()
    expect(toastRegion).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Expense recorded successfully!')).toBeInTheDocument()

    const dismissBtn = screen.getByRole('button', { name: /Dismiss notification/i })
    expect(dismissBtn).toBeInTheDocument()
    fireEvent.click(dismissBtn)

    expect(useUIStore.getState().toast).toBeNull()
  })

  // 13. TripNavigationTabs accessibility
  it('TripNavigationTabs renders with aria-label="Trip tabs" and touch scrolling container', () => {
    render(
      <MemoryRouter initialEntries={['/trips/trip-100']}>
        <Routes>
          <Route path="/trips/:tripId/*" element={<TripNavigationTabs />} />
        </Routes>
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation', { name: /Trip tabs/i })
    expect(nav).toBeInTheDocument()
    expect(nav.className).toContain('overflow-x-auto')
    expect(nav.className).toContain('touch-pan-x')

    const overviewLink = screen.getByRole('link', { name: /Overview/i })
    expect(overviewLink).toBeInTheDocument()
    expect(overviewLink).toHaveAttribute('href', '/trips/trip-100')
  })

  // 14. ExpensesList accessible action buttons
  it('ExpensesList action buttons provide accessible names for screen readers', () => {
    const trip = useTripStore.getState().createTrip({
      name: 'Goa Holiday',
      destination: 'Goa',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      currency: 'INR',
    })
    const p1 = useParticipantStore.getState().addParticipant({
      tripId: trip.id,
      name: 'Rohan',
    })
    useExpenseStore.getState().createExpense({
      tripId: trip.id,
      description: 'Breakfast Cafe',
      amount: 450,
      paidBy: p1.id,
      participantIds: [p1.id],
      date: '2026-10-01',
    })

    render(
      <MemoryRouter>
        <ExpensesList trip={trip} />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('button', { name: /Edit Breakfast Cafe/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Delete Breakfast Cafe/i }),
    ).toBeInTheDocument()
  })

  // 15. PeopleList accessible action buttons
  it('PeopleList action buttons provide accessible names with participant context', () => {
    const trip = useTripStore.getState().createTrip({
      name: 'Goa Holiday',
      destination: 'Goa',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      currency: 'INR',
    })
    useParticipantStore.getState().addParticipant({
      tripId: trip.id,
      name: 'Pritish',
    })

    render(
      <MemoryRouter>
        <PeopleList trip={trip} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /Edit Pritish/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Remove Pritish/i })).toBeInTheDocument()
  })

  // 16. DeleteTripModal destructive confirmation
  it('DeleteTripModal renders safe cancel button as default and clear destructive delete action', () => {
    const trip = { id: 'trip-1', name: 'Manali Snow Trek' }
    const handleDelete = vi.fn()
    const handleClose = vi.fn()

    render(
      <DeleteTripModal
        isOpen={true}
        onClose={handleClose}
        trip={trip}
        onDeleted={handleDelete}
      />,
    )

    const keepBtn = screen.getByRole('button', { name: /Keep Trip/i })
    const deleteBtn = screen.getByRole('button', { name: /Delete Permanently/i })

    expect(keepBtn).toBeInTheDocument()
    expect(deleteBtn).toBeInTheDocument()
    expect(deleteBtn.className).toContain('bg-red-600')

    fireEvent.click(keepBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  // 17. DeleteExpenseModal destructive confirmation
  it('DeleteExpenseModal renders safe cancel button and clear destructive delete action', () => {
    const trip = { id: 'trip-1', currency: 'INR' }
    const expense = { id: 'exp-1', description: 'Kayaking', amount: 1500 }
    const handleClose = vi.fn()

    render(
      <DeleteExpenseModal
        isOpen={true}
        onClose={handleClose}
        expense={expense}
        trip={trip}
      />,
    )

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    const deleteBtn = screen.getByRole('button', { name: /Delete Expense/i })

    expect(cancelBtn).toBeInTheDocument()
    expect(deleteBtn).toBeInTheDocument()
    expect(deleteBtn.className).toContain('bg-red-600')

    fireEvent.click(cancelBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
