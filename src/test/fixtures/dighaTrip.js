/**
 * Digha Group Trip Test Fixture.
 *
 * Used as a realistic benchmark for group expense reconciliation,
 * participant balances, and settlement optimization.
 * (Test fixture only — never loaded into production state).
 */

export const DIGHA_TRIP = {
  id: 'trip-digha',
  name: 'Digha Trip',
  destination: 'Digha, West Bengal',
  startDate: '2026-10-10',
  endDate: '2026-10-12',
  currency: 'INR',
  status: 'active',
}

export const DIGHA_PARTICIPANTS = [
  { id: 'digha-p1', tripId: 'trip-digha', name: 'Pritish' },
  { id: 'digha-p2', tripId: 'trip-digha', name: 'Deba' },
  { id: 'digha-p3', tripId: 'trip-digha', name: 'Rohan' },
  { id: 'digha-p4', tripId: 'trip-digha', name: 'Sibashis' },
  { id: 'digha-p5', tripId: 'trip-digha', name: 'Sayantan' },
  { id: 'digha-p6', tripId: 'trip-digha', name: 'Krishnendu' },
]

export const DIGHA_EXPENSES = [
  // 1. Petrol: ₹600 paid by Pritish, shared by all 6 (₹100 each)
  {
    id: 'digha-e1',
    tripId: 'trip-digha',
    description: 'Petrol',
    amount: 600,
    amountInMinorUnits: 60000,
    paidBy: 'digha-p1',
    participantIds: [
      'digha-p1',
      'digha-p2',
      'digha-p3',
      'digha-p4',
      'digha-p5',
      'digha-p6',
    ],
    splitType: 'equal',
    category: 'fuel',
    date: '2026-10-10',
  },
  // 2. Hotel: ₹4000 paid by Deba, shared by all 6
  {
    id: 'digha-e2',
    tripId: 'trip-digha',
    description: 'Hotel Rooms',
    amount: 4000,
    amountInMinorUnits: 400000,
    paidBy: 'digha-p2',
    participantIds: [
      'digha-p1',
      'digha-p2',
      'digha-p3',
      'digha-p4',
      'digha-p5',
      'digha-p6',
    ],
    splitType: 'equal',
    category: 'hotel',
    date: '2026-10-10',
  },
  // 3. Lunch: ₹850 paid by Pritish, shared by all 6
  {
    id: 'digha-e3',
    tripId: 'trip-digha',
    description: 'Highway Lunch',
    amount: 850,
    amountInMinorUnits: 85000,
    paidBy: 'digha-p1',
    participantIds: [
      'digha-p1',
      'digha-p2',
      'digha-p3',
      'digha-p4',
      'digha-p5',
      'digha-p6',
    ],
    splitType: 'equal',
    category: 'food',
    date: '2026-10-10',
  },
  // 4. Chicken Kabab: ₹420 paid by Rohan, shared by all 6
  {
    id: 'digha-e4',
    tripId: 'trip-digha',
    description: 'Evening Chicken Kabab',
    amount: 420,
    amountInMinorUnits: 42000,
    paidBy: 'digha-p3',
    participantIds: [
      'digha-p1',
      'digha-p2',
      'digha-p3',
      'digha-p4',
      'digha-p5',
      'digha-p6',
    ],
    splitType: 'equal',
    category: 'food',
    date: '2026-10-10',
  },
  // 5. Water & Snacks: ₹150 paid by Pritish, shared by all 6
  {
    id: 'digha-e5',
    tripId: 'trip-digha',
    description: 'Water & Snacks',
    amount: 150,
    amountInMinorUnits: 15000,
    paidBy: 'digha-p1',
    participantIds: [
      'digha-p1',
      'digha-p2',
      'digha-p3',
      'digha-p4',
      'digha-p5',
      'digha-p6',
    ],
    splitType: 'equal',
    category: 'food',
    date: '2026-10-11',
  },
  // 6. Smirnoff: ₹1200 paid by Deba, shared by all 6
  {
    id: 'digha-e6',
    tripId: 'trip-digha',
    description: 'Night Drinks (Smirnoff)',
    amount: 1200,
    amountInMinorUnits: 120000,
    paidBy: 'digha-p2',
    participantIds: [
      'digha-p1',
      'digha-p2',
      'digha-p3',
      'digha-p4',
      'digha-p5',
      'digha-p6',
    ],
    splitType: 'equal',
    category: 'drinks',
    date: '2026-10-11',
  },
]

