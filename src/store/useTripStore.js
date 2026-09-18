import { create } from 'zustand'
import { storageAdapter } from '../lib/persistence/storageAdapter'

export const DEMO_GOA_TRIP = {
  id: 'goa-trip',
  name: 'Goa Trip',
  destination: 'Goa, India',
  startDate: '2026-09-15',
  endDate: '2026-09-18',
  currency: 'INR',
  isDemo: true,
  stats: {
    totalSpent: 18750,
    peopleCount: 5,
    expensesCount: 12,
    userBalance: 1650,
  },
  people: [
    { id: 'p1', name: 'You', isCurrentUser: true, avatarBg: '#f97316' },
    { id: 'p2', name: 'Aditi', isCurrentUser: false, avatarBg: '#0d9488' },
    { id: 'p3', name: 'Rohan', isCurrentUser: false, avatarBg: '#8b5cf6' },
    { id: 'p4', name: 'Kabir', isCurrentUser: false, avatarBg: '#ec4899' },
    { id: 'p5', name: 'Sara', isCurrentUser: false, avatarBg: '#eab308' },
  ],
  sampleExpenses: [
    {
      id: 'e1',
      title: 'Beachside Seafood Dinner',
      amount: 4850,
      paidBy: 'You',
      category: 'food',
      date: '2026-09-15',
    },
    {
      id: 'e2',
      title: 'Scooter Rentals (3 days)',
      amount: 3600,
      paidBy: 'Rohan',
      category: 'car',
      date: '2026-09-15',
    },
    {
      id: 'e3',
      title: 'Villa Stay Advance',
      amount: 10300,
      paidBy: 'Aditi',
      category: 'hotel',
      date: '2026-09-16',
    },
  ],
  sampleSettlements: [
    {
      id: 's1',
      from: 'Kabir',
      to: 'You',
      amount: 1100,
      status: 'pending',
    },
    {
      id: 's2',
      from: 'Sara',
      to: 'You',
      amount: 550,
      status: 'pending',
    },
  ],
}

export const useTripStore = create((set, get) => ({
  trips: [DEMO_GOA_TRIP],
  activeTripId: 'goa-trip',
  showDemoData: true,

  // Action to add trip (persists through storage adapter)
  addTrip: (newTripData) => {
    const id = `trip-${Date.now()}`
    const trip = {
      id,
      name: newTripData.name,
      destination: newTripData.destination,
      startDate: newTripData.startDate,
      endDate: newTripData.endDate,
      currency: newTripData.currency || 'INR',
      isDemo: false,
      stats: {
        totalSpent: 0,
        peopleCount: 1,
        expensesCount: 0,
        userBalance: 0,
      },
      people: [{ id: 'me', name: 'You', isCurrentUser: true, avatarBg: '#f97316' }],
      sampleExpenses: [],
      sampleSettlements: [],
    }

    set((state) => {
      const updated = [trip, ...state.trips]
      storageAdapter.set('trips', updated)
      return { trips: updated, activeTripId: id }
    })

    return id
  },

  // Toggle demo mode so empty states can be easily viewed and tested
  toggleDemoData: () => {
    set((state) => ({ showDemoData: !state.showDemoData }))
  },

  setActiveTripId: (id) => set({ activeTripId: id }),

  getActiveTrip: () => {
    const state = get()
    if (!state.showDemoData) return null
    return state.trips.find((t) => t.id === state.activeTripId) || state.trips[0] || null
  },
}))
