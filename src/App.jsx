import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { CreateTripModal } from './features/trips/components/CreateTripModal'
import { HomePage } from './pages/HomePage'
import { TripsPage } from './pages/TripsPage'
import { TripDetailPage } from './pages/TripDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { useTripStore } from './store/useTripStore'

function GlobalSettlementRedirect() {
  const activeTripId = useTripStore((s) => s.activeTripId)
  const trips = useTripStore((s) => s.trips)
  const targetId = activeTripId || trips[0]?.id
  if (targetId) {
    return <Navigate to={`/trips/${targetId}/settlement`} replace />
  }
  return <Navigate to="/trips" replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/trips" element={<TripsPage />} />
      <Route path="/trips/:tripId" element={<TripDetailPage subview="overview" />} />
      <Route path="/trips/:tripId/expenses" element={<TripDetailPage subview="expenses" />} />
      <Route path="/trips/:tripId/people" element={<TripDetailPage subview="people" />} />
      <Route path="/trips/:tripId/settlement" element={<TripDetailPage subview="settlement" />} />
      <Route path="/trips/:tripId/settle" element={<TripDetailPage subview="settlement" />} />
      <Route path="/settlement" element={<GlobalSettlementRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <AppRoutes />
        <CreateTripModal />
      </AppShell>
    </BrowserRouter>
  )
}
