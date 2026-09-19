/**
 * Test fixture for demo trip data used in unit/integration test suites.
 */
export const DEMO_GOA_TRIP = {
  id: 'demo',
  name: 'Goa Trip',
  destination: 'Goa, India',
  startDate: '2026-09-15',
  endDate: '2026-09-18',
  currency: 'INR',
  description: 'Annual beach trip with friends. Seafood, scooters, and sunsets.',
  status: 'active',
  createdAt: '2026-09-15T10:00:00.000Z',
  updatedAt: '2026-09-15T10:00:00.000Z',
  isDemo: true,
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

