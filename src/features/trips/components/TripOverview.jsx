import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Archive,
  ArrowCounterClockwise,
  Sparkle,
} from '@phosphor-icons/react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { EditTripModal } from './EditTripModal'
import { DeleteTripModal } from './DeleteTripModal'
import { AddExpenseModal } from '../../expenses/components/AddExpenseModal'
import { AddPersonModal } from '../../participants/components/AddPersonModal'
import { TripHeader } from './TripHeader'
import { TripStatsTiles } from './TripStatsTiles'
import { TripFinancialSnapshot } from './TripFinancialSnapshot'
import { TripRecentExpenses } from './TripRecentExpenses'
import { TripSquadSnapshot } from './TripSquadSnapshot'
import { TripQuickActions } from './TripQuickActions'
import { useTripStore } from '../../../store/useTripStore'
import { useParticipantStore } from '../../../store/useParticipantStore'
import { useExpenseStore } from '../../../store/useExpenseStore'
import { useTripFinancialSummary } from '../../finance'
import { useUIStore } from '../../../store/useUIStore'

/**
 * Real Trip Command Center.
 * Unifies trip metadata, live statistics, financial status, recent expenses,
 * squad snapshot, and quick actions using actual persisted trip data.
 *
 * @param {{ trip: Object }} props
 */
export function TripOverview({ trip }) {
  const navigate = useNavigate()
  const archiveTrip = useTripStore((s) => s.archiveTrip)
  const unarchiveTrip = useTripStore((s) => s.unarchiveTrip)
  const showToast = useUIStore((s) => s.showToast)

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false)

  const isArchived = trip.status === 'archived'
  const isDemo = Boolean(trip.isDemo)

  // Reactive store subscriptions (no cross-trip leakage)
  const allExpenses = useExpenseStore((s) => s.expenses)
  const tripExpenses = allExpenses.filter((e) => e.tripId === trip.id)

  const allParticipants = useParticipantStore((s) => s.participants)
  const tripParticipants = allParticipants.filter((p) => p.tripId === trip.id)

  // Real financial engine summary
  const financialSummary = useTripFinancialSummary(trip.id)
  const totalSpent = financialSummary?.totalSpent || 0

  const handleToggleArchive = () => {
    if (isArchived) {
      unarchiveTrip(trip.id)
      showToast(`Trip "${trip.name}" restored to active trips!`, 'success')
    } else {
      archiveTrip(trip.id)
      showToast(`Trip "${trip.name}" was moved to archives.`, 'info')
    }
  }

  return (
    <div className="space-y-6">
      {/* Demo Mock Data Banner (only if explicitly a demo fixture) */}
      {isDemo && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-100/90 border-2 border-zinc-900 rounded-3xl shadow-playful-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-300 rounded-2xl border border-zinc-900 flex items-center justify-center text-zinc-950 shrink-0">
              <Sparkle className="w-5 h-5" weight="fill" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-zinc-900">
                Demo UI Preview Mode
              </p>
              <p className="text-xs text-zinc-700">
                All numbers shown below are placeholder values for UI review only.
              </p>
            </div>
          </div>
          <Badge variant="demo" className="shrink-0">
            UI MOCK DATA
          </Badge>
        </div>
      )}

      {/* Archived Banner */}
      {isArchived && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-zinc-200 border-2 border-zinc-900 rounded-3xl shadow-playful-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-300 rounded-2xl border border-zinc-900 flex items-center justify-center text-zinc-800 shrink-0">
              <Archive className="w-5 h-5" weight="bold" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-zinc-900">
                This trip is currently archived.
              </p>
              <p className="text-xs text-zinc-600">
                Its expenses and balances remain safely preserved, but it is hidden from your active trips list.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={ArrowCounterClockwise}
            onClick={handleToggleArchive}
          >
            Unarchive Trip
          </Button>
        </div>
      )}

      {/* 1. Trip Hero Header with Actions */}
      <TripHeader
        trip={trip}
        isArchived={isArchived}
        onEdit={() => setIsEditModalOpen(true)}
        onToggleArchive={handleToggleArchive}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      {/* 2. Live Trip Statistics */}
      <TripStatsTiles
        trip={trip}
        totalSpent={totalSpent}
        expensesCount={tripExpenses.length}
        peopleCount={tripParticipants.length}
      />

      {/* 3. Financial Status Snapshot */}
      <TripFinancialSnapshot
        trip={trip}
        financialSummary={financialSummary}
        expensesCount={tripExpenses.length}
        onAddExpense={() => setIsAddExpenseOpen(true)}
      />

      {/* 4. Recent Expenses & 5. Squad Snapshot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <TripRecentExpenses
          trip={trip}
          expenses={tripExpenses}
          participants={tripParticipants}
          onAddExpense={() => setIsAddExpenseOpen(true)}
        />

        <TripSquadSnapshot
          trip={trip}
          participants={tripParticipants}
          onAddPerson={() => setIsAddPersonOpen(true)}
        />
      </div>

      {/* 6. Quick Actions */}
      <TripQuickActions
        trip={trip}
        onAddExpense={() => setIsAddExpenseOpen(true)}
        onAddPerson={() => setIsAddPersonOpen(true)}
      />

      {/* Modals */}
      <EditTripModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        trip={trip}
      />

      <DeleteTripModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        trip={trip}
        onDeleted={() => navigate('/trips')}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        trip={trip}
      />

      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        tripId={trip.id}
      />
    </div>
  )
}
