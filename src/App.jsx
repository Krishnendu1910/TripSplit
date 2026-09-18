import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { CreateTripModal } from './features/trips/components/CreateTripModal'
import { HomePage } from './pages/HomePage'
import { TripsPage } from './pages/TripsPage'
import { TripDetailPage } from './pages/TripDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/trips" element={<TripsPage />} />
      <Route path="/trips/:tripId" element={<TripDetailPage subview="overview" />} />
      <Route path="/trips/:tripId/expenses" element={<TripDetailPage subview="expenses" />} />
      <Route path="/trips/:tripId/people" element={<TripDetailPage subview="people" />} />
      <Route path="/trips/:tripId/settlement" element={<TripDetailPage subview="settlement" />} />
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
