# TripSplit

> **A serious expense & settlement engine wrapped inside an adventurous travel companion.**

TripSplit helps groups of friends record trip expenses on the fly and automatically determines who owes whom, defusing vacation money chaos before group chats turn into courtrooms.

---

## Personality & Design Direction

TripSplit avoids the generic corporate SaaS look in favor of an energetic, memorable identity:
- **Playful, tactile visual language**: Expressive typography, rounded cards, tactile shadows (`shadow-playful`), friendly badges, and custom CSS micro-animations.
- **Exclusively Phosphor Icons**: Integrated across all UI primitives and navigation (`@phosphor-icons/react`).
- **Accessible & Motion-Conscious**: Semantic HTML, full keyboard navigation, accessible form labeling, and explicit `prefers-reduced-motion` compliance.

---

## Tech Stack

* **Frontend**: React 19 (JavaScript)
* **Build Tool**: Vite with `@tailwindcss/vite`
* **Styling**: Tailwind CSS v4 + custom tactile design tokens
* **Routing**: React Router v7 (`react-router-dom`)
* **State Management**: Zustand
* **Date Utilities**: date-fns
* **Iconography**: Phosphor Icons (`@phosphor-icons/react`)
* **Testing**: Vitest + Testing Library + jsdom
* **Code Quality**: ESLint 9 (Flat Config) + Prettier

---

## Architecture

The project follows a clean, feature-oriented structure:

```
src/
├── assets/          # Static assets & illustrations
├── components/
│   ├── layout/      # AppShell, Navbar, TripNavigationTabs
│   └── ui/          # Button, Card, Badge, Modal, Input, Select, EmptyState
├── constants/       # Currencies, routes, presets
├── features/
│   ├── dashboard/   # Dashboard widgets & overview
│   ├── expenses/    # Expenses list & expense cards
│   ├── participants/# Travel squad rosters & member cards
│   ├── settlements/ # Settlement plans & debt simplifications
│   └── trips/       # Trip cards, creation modal, overview dashboard
├── hooks/           # Reusable React hooks
├── lib/
│   ├── persistence/ # StorageAdapter abstraction (offline-first ready)
│   └── utils.js     # Class merging utility (clsx + tailwind-merge)
├── pages/           # HomePage, TripsPage, TripDetailPage, NotFoundPage
├── store/           # Zustand stores (useTripStore, useUIStore)
├── styles/          # Global CSS & Tailwind configuration
├── utils/           # Currency & date formatters
└── test/            # Vitest suite & setup
```

---

## Development Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run the development server
```bash
npm run dev
```

### 3. Run ESLint
```bash
npm run lint
```

### 4. Run automated tests
```bash
npm run test
```

### 5. Build for production
```bash
npm run build
```

---

## Current Development Status (Phase 1 Completed)

- [x] Project initialization with React 19, Vite, Tailwind CSS v4, and Phosphor Icons
- [x] Fixed ESLint 9 flat configuration with React runtime and Hooks support
- [x] Configured Vitest test runner with jsdom and testing-library setup
- [x] Application shell with responsive desktop header, mobile bottom navigation, and branding
- [x] Routes registered:
  - `/` — Home dashboard with hero copy, CTAs, and featured trip preview
  - `/trips` — All trips list with playful empty state toggle ("Your wallet is suspiciously peaceful.")
  - `/trips/:tripId` — Trip overview with 4 core metric cards (Total spent, People, Expenses, Your balance)
  - `/trips/:tripId/expenses` — Expenses subview with empty state ("No damage reported yet.")
  - `/trips/:tripId/people` — Squad roster with empty state ("A trip with just you? Technically possible.")
  - `/trips/:tripId/settlement` — Settlement plan with empty state ("Nobody owes anybody... yet.")
  - `*` — Friendly 404 page ("Looks like this page went on a trip without us.")
- [x] Create Trip accessible modal with field validation and currency presets
- [x] Offline-first persistence abstraction layer (`storageAdapter`)
- [x] Demo trip dataset (Goa Trip 15–18 September) clearly tagged as UI preview

---

## Roadmap

- **Phase 2**: Expense Creation, Split Methods (Equal, Exact, Percentage, Shares), and Local Persistence
- **Phase 3**: Debt Simplification & Settlement Algorithm Engine
- **Phase 4**: Offline-First Sync & Multi-User Collaboration
- **Phase 5**: Multi-Currency Live Conversion & PDF/Receipt Export
