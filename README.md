# 🧳 TripSplit

> **Record the money. TripSplit does the math.**

TripSplit is a playful, product-focused trip expense splitting web
application designed to replace the messy spreadsheet approach people
often use after a trip.

Instead of manually maintaining rows, columns, formulas, balances, and
"who owes whom" calculations, TripSplit lets a group:

-   👥 Create a trip and add the squad
-   💸 Record expenses in seconds
-   🙋 Choose who paid
-   🧑‍🤝‍🧑 Choose who shared an expense
-   🧮 Split expenses using multiple methods
-   📊 Automatically calculate each person's financial position
-   🔄 Recalculate balances whenever expenses change
-   🤝 Generate simplified settlement instructions
-   💾 Keep the current trip data persisted locally in the browser

The idea is simple:

``` text
You record what happened with the money.
                         ↓
              TripSplit handles the math.
                         ↓
             You see who pays whom.
```

------------------------------------------------------------------------

## 🎯 Why TripSplit Exists

After a real trip to Digha, expenses were maintained manually in an
Excel sheet.

The spreadsheet worked, but the person maintaining it had to think
about:

-   who paid for each expense
-   who participated in each expense
-   total trip spending
-   each person's contribution
-   each person's fair share
-   positive and negative balances
-   and finally, who should pay whom

That is exactly the problem TripSplit is designed to simplify.

### The product principle

> **Don't expose accounting complexity unless the user needs it.**

The user should be able to say:

> "Pot paid ₹3,000 for the hotel. Everyone shared it."

and move on.

TripSplit takes care of the calculations underneath.

------------------------------------------------------------------------

# ✨ What TripSplit Does

## 🗺️ Trip Management

Create and manage trips with:

-   Trip name
-   Destination
-   Start/end dates
-   Currency
-   Description
-   Active/archived status

Trips are isolated from one another using stable trip IDs.

------------------------------------------------------------------------

## 👥 People Management

Each trip has its own squad.

Users can:

-   Add people
-   Rename people
-   View the squad
-   Remove people when it is safe to do so

Participant IDs remain stable when a person's name changes.

A participant with existing financial history cannot simply be deleted
because doing so could orphan existing expenses.

------------------------------------------------------------------------

## 💸 Expense Management

Expenses are the core input of the application.

A quick expense flow asks:

``` text
What was it?
How much?
Who paid?
Who shared it?
```

Example:

``` text
🏨 Hotel
₹4,000
Paid by Deba
Shared by Everyone
```

Advanced splitting is available when required:

-   ⚖️ Everyone equally
-   👥 Selected people
-   💰 Custom amounts
-   📈 Percentage
-   🧩 Shares

The default experience stays simple instead of forcing users into
accounting-style forms.

------------------------------------------------------------------------

# 🧠 The Most Important Part: How TripSplit Calculates Money

TripSplit separates **recording an expense** from **settling the trip**.

When an expense is entered, the application does not immediately decide
a final payment between two people.

Instead, every expense produces two pieces of information:

``` text
WHO PAID?
+
WHO OWES A SHARE?
```

After all expenses are processed, TripSplit calculates:

``` text
Total Paid
      ↓
Total Owed
      ↓
Net Balance
      ↓
Debtors + Creditors
      ↓
Settlement Transactions
```

------------------------------------------------------------------------

# 🧮 Mathematical Model

For every participant:

``` text
Net Balance = Total Paid - Total Owed
```

Where:

-   **Total Paid** = money that person actually paid
-   **Total Owed** = that person's responsibility across all expenses
-   **Positive balance** = person should receive money
-   **Negative balance** = person needs to pay money

### Example

Suppose six people share a ₹600 expense and Denis pays the entire amount.

``` text
₹600 ÷ 6 = ₹100 per person
```

The financial state becomes:

  Person         Paid   Owed     Net
  ------------ ------ ------ -------
  Denis           ₹600   ₹100   +₹500
  Pot             ₹0   ₹100   -₹100
  Rohan            ₹0   ₹100   -₹100
  Siva         ₹0   ₹100   -₹100
  Sayan         ₹0   ₹100   -₹100
  Krishnendu       ₹0   ₹100   -₹100

TripSplit therefore knows:

``` text
Denis should receive ₹500
```

and the other five people collectively need to provide ₹500.

------------------------------------------------------------------------

# 🪙 Exact Money Handling

TripSplit does not rely on floating-point arithmetic for financial
calculations.

Money is represented using integer **minor currency units**.

For INR:

``` text
₹1 = 100 paise
```

Therefore:

``` text
₹3,000 = 300,000 paise
```

This avoids common floating-point problems such as:

``` text
0.1 + 0.2 !== exactly 0.3
```

for financial calculations.

When an amount cannot divide evenly, the remaining minor units are
allocated deterministically.

Example:

``` text
₹100 ÷ 3

Person A → ₹33.34
Person B → ₹33.33
Person C → ₹33.33
```

Total:

``` text
₹33.34 + ₹33.33 + ₹33.33
= ₹100.00
```

Nothing disappears.

------------------------------------------------------------------------

# 🧩 Supported Split Algorithms

## ⚖️ Equal Split

``` text
Expense = ₹1,000
People = 4

₹1,000 ÷ 4
= ₹250 each
```

------------------------------------------------------------------------

## 👥 Selected People

An expense can belong to only a subset of the squad.

``` text
Trip has 6 people

Dinner:
₹900

Shared by:
A
B
C

₹900 ÷ 3
= ₹300 each
```

The other three participants receive no obligation for that expense.

------------------------------------------------------------------------

## 💰 Custom Amounts

Users can explicitly define:

``` text
A → ₹500
B → ₹700
C → ₹800
```

The financial engine verifies:

``` text
₹500 + ₹700 + ₹800
= ₹2,000
```

The split must reconcile exactly with the expense amount.

------------------------------------------------------------------------

## 📈 Percentage Split

Example:

``` text
₹1,000

A → 50%
B → 30%
C → 20%
```

Result:

``` text
A → ₹500
B → ₹300
C → ₹200
```

------------------------------------------------------------------------

## 🧩 Shares Split

Example:

``` text
₹1,000

A → 1 share
B → 2 shares
C → 1 share
```

Total shares:

``` text
1 + 2 + 1 = 4
```

Therefore:

``` text
A → ₹250
B → ₹500
C → ₹250
```

------------------------------------------------------------------------

# 🧠 Behind the Scenes: Full Financial Pipeline

``` mermaid
flowchart TD
    A["👤 User enters expense"] --> B["💸 Expense Model"]
    B --> C["🧩 Calculate Expense Split"]
    C --> D["📊 Calculate Trip Totals"]
    D --> E["⚖️ Calculate Participant Balances"]
    E --> F{"Balance"}
    F -->|"Positive"| G["💰 Creditor"]
    F -->|"Negative"| H["💸 Debtor"]
    G --> I["🤝 Settlement Engine"]
    H --> I
    I --> J["🧾 Settlement Transactions"]
    J --> K["🖥️ Settle Up UI"]
```

The React UI does not contain the financial formulas.

The calculation lives in the domain/finance layer.

That separation is intentional.

------------------------------------------------------------------------

# 🏗️ Application Architecture

``` mermaid
flowchart TB
    UI["🎨 React UI"]

    ROUTER["🧭 React Router"]

    STORES["🗃️ Zustand Stores"]
    TRIP["🧳 Trip Store"]
    PEOPLE["👥 Participant Store"]
    EXPENSE["💸 Expense Store"]
    UISTORE["🪄 UI Store"]

    PERSIST["💾 Persistence Adapter"]
    STORAGE["🗄️ Browser LocalStorage"]

    DOMAIN["🧠 Finance Domain"]
    SPLIT["⚖️ Expense Split"]
    TOTALS["📊 Trip Totals"]
    BALANCE["💰 Balances"]
    SETTLE["🤝 Settlements"]

    UI --> ROUTER
    ROUTER --> STORES

    STORES --> TRIP
    STORES --> PEOPLE
    STORES --> EXPENSE
    STORES --> UISTORE

    TRIP --> PERSIST
    PEOPLE --> PERSIST
    EXPENSE --> PERSIST
    PERSIST --> STORAGE

    EXPENSE --> DOMAIN
    PEOPLE --> DOMAIN

    DOMAIN --> SPLIT
    DOMAIN --> TOTALS
    DOMAIN --> BALANCE
    DOMAIN --> SETTLE

    SETTLE --> UI
```

------------------------------------------------------------------------

# 🔄 What Happens When You Add an Expense?

Imagine the user enters:

``` text
🏨 Hotel
Amount: ₹4,000
Paid by: Denis
Shared by: Everyone
```

The flow is:

``` text
1. User submits the form
        ↓
2. React validates the input
        ↓
3. Expense model creates a structured expense
        ↓
4. Zustand expense store updates
        ↓
5. Persistence adapter saves the state
        ↓
6. Financial summary sees the new expense
        ↓
7. Expense split is calculated
        ↓
8. Total paid/owed values are recalculated
        ↓
9. Net balances are recalculated
        ↓
10. Settlement transactions are recalculated
        ↓
11. Dashboard + Settle Up update automatically
```

No manual refresh is required.

------------------------------------------------------------------------

# ⚡ Reactive Updates

TripSplit uses Zustand subscriptions together with the financial summary
hook.

Conceptually:

``` text
Expense Store changes
        ↓
Zustand notifies subscribers
        ↓
Financial summary recalculates
        ↓
React components re-render
        ↓
Dashboard changes immediately
```

So if:

``` text
Hotel = ₹4,000
```

is edited to:

``` text
Hotel = ₹4,500
```

the application can immediately update:

``` text
Total Spent
Balances
Who Pays
Who Receives
Settlement Transactions
```

------------------------------------------------------------------------

# 🤝 How "Who Pays Whom" Is Calculated

Once all expenses have been processed, TripSplit has a net balance for
every participant.

Example:

``` text
Pot         +₹1,266.67
Denis        +₹277.67
Siva    +₹177.67

Rohan       -₹102.33
Sayan    -₹840.33
Krishnendu  -₹819.33
```

Positive balances are people who should receive money.

Negative balances are people who need to pay.

The settlement engine then matches these two groups.

Conceptually:

``` text
                 NET BALANCES
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
     💰 RECEIVE               💸 PAY
          │                       │
          └───────────┬───────────┘
                      ↓
             🤝 MATCH BALANCES
                      ↓
             🧾 SETTLEMENTS
                      ↓
          A → B ₹X
          C → D ₹Y
          E → F ₹Z
```

The purpose is to avoid showing users the entire accounting graph.

They see actionable payment instructions instead.

------------------------------------------------------------------------

# 🧪 Real Digha Spreadsheet Inspiration

TripSplit was inspired by a real Digha trip expense sheet.

The spreadsheet had:

-   Multiple petrol expenses
-   Hotel
-   Lunch
-   Chicken Kabab / Chowmi
-   Dinner
-   Water
-   Breakfast
-   Another lunch
-   Smirnoff
-   Individual payer columns
-   Total expenditure
-   Per-head expense
-   Participant balances

The spreadsheet's total expense was:

``` text
₹13,934
```

The important product lesson was not simply "make the same spreadsheet
in React."

It was:

> **Take the same financial truth and remove the spreadsheet burden.**

------------------------------------------------------------------------

# ⚠️ Data Integrity Example from the Digha Sheet

The supplied spreadsheet contains a useful validation lesson.

Its total expense is:

``` text
₹13,934
```

But the visible individual payment entries add up to:

``` text
₹13,894
```

The difference is:

``` text
₹40
```

The visible water expense is:

``` text
₹472
```

while the individual column contains:

``` text
₹432
```

So the sheet contains a ₹40 reconciliation gap.

TripSplit's financial architecture is designed around invariants so that
these kinds of inconsistencies can be detected rather than silently
turning into incorrect settlement instructions.

The important invariants are:

``` text
Total Paid = Total Expense
Total Owed = Total Expense

and therefore:

Σ Net Balances = 0
```

This is one of the reasons the financial engine is isolated from the UI
and heavily tested.

------------------------------------------------------------------------

# 🧱 Technology Stack

## ⚛️ React

**Role:** UI layer.

React builds the actual TripSplit interface:

-   Pages
-   Cards
-   Forms
-   Modals
-   Expense lists
-   People lists
-   Dashboard
-   Settle Up

React is responsible for presenting state, not owning the financial
mathematics.

------------------------------------------------------------------------

## ⚡ Vite

**Role:** Development server + production build tooling.

Vite provides:

-   Fast local development
-   Hot module replacement
-   Production bundling
-   Build pipeline

Development:

``` bash
npm run dev
```

Production build:

``` bash
npm run build
```

------------------------------------------------------------------------

## 🎨 Tailwind CSS v4

**Role:** Styling and responsive design.

Tailwind is used for:

-   Layout
-   Spacing
-   Typography
-   Responsive behavior
-   States
-   Component styling
-   Product visual system

TripSplit intentionally combines a structured product UI with a playful
travel personality.

------------------------------------------------------------------------

## 🧭 React Router

**Role:** Client-side navigation.

Routes include:

``` text
/
 /trips
 /trips/:tripId
 /trips/:tripId/expenses
 /trips/:tripId/people
 /trips/:tripId/settlement
```

This allows TripSplit to behave like a real SPA rather than a collection
of disconnected pages.

------------------------------------------------------------------------

## 🗃️ Zustand

**Role:** Application state management.

Separate stores handle different responsibilities:

``` text
useTripStore
useParticipantStore
useExpenseStore
useUIStore
```

This keeps state predictable and avoids pushing application state
through deeply nested React props.

------------------------------------------------------------------------

## 💾 LocalStorage + Persistence Adapter

**Role:** Local persistence.

TripSplit currently uses browser-local persistence instead of a remote
backend.

The persistence adapter provides a boundary between:

``` text
Application State
        ↓
Persistence Layer
        ↓
Browser Storage
```

This also makes future persistence changes easier because components do
not need to know how storage works internally.

------------------------------------------------------------------------

## 🧮 Finance Domain Layer

**Role:** Financial correctness.

The finance domain contains the actual money logic:

``` text
calculateExpenseSplit()
calculateTripTotals()
calculateBalances()
calculateSettlements()
```

The finance layer is intentionally independent from React components.

This means:

``` text
UI can change
without rewriting
financial mathematics.
```

------------------------------------------------------------------------

## 📅 date-fns

**Role:** Date handling and formatting.

Used for predictable handling of:

-   Trip date ranges
-   Expense dates
-   Date formatting
-   Date comparisons

------------------------------------------------------------------------

## 🎨 Phosphor Icons

**Role:** Product iconography.

Phosphor provides the application's icon system.

Icons are used to communicate actions and states without turning the UI
into a spreadsheet-like interface.

Examples:

``` text
💸 Expenses
👥 People
🤝 Settlement
🧳 Trips
✓ Completed
→ Payment direction
```

------------------------------------------------------------------------

## 🧪 Vitest

**Role:** Automated testing.

Vitest verifies the application logic and behavior.

------------------------------------------------------------------------

## 🧪 Testing Library

**Role:** User-facing UI testing.

Testing Library helps verify the application from the perspective of
actual user interactions rather than relying only on implementation
details.

------------------------------------------------------------------------

## 🧹 ESLint

**Role:** Code quality and consistency.

It catches common JavaScript/React problems before they become runtime
bugs.

------------------------------------------------------------------------

## 📝 Prettier

**Role:** Consistent code formatting.

This keeps the codebase readable and consistent as the project grows.

------------------------------------------------------------------------

# 🧩 Why the Architecture Is Split This Way

A major design goal is:

> **Separation of concerns.**

For example:

``` text
React Component
     ↓
"What should I display?"

Zustand Store
     ↓
"What is the current application state?"

Persistence
     ↓
"How do I keep the state?"

Finance Domain
     ↓
"What is mathematically correct?"

Settlement Engine
     ↓
"How can the financial result become actionable payments?"
```

Each layer has a specific responsibility.

------------------------------------------------------------------------

# 🔐 Data Integrity

TripSplit contains safeguards against common data corruption scenarios.

### Trip isolation

Every participant and expense belongs to a specific trip.

``` text
expense.tripId
participant.tripId
```

This prevents Trip A's financial data from appearing inside Trip B.

### Safe participant removal

A participant with financial history cannot simply disappear and leave
broken references behind.

### Stable participant IDs

Renaming a person does not change their identity inside existing
expenses.

### Expense identity

Editing an expense preserves its identity and trip relationship.

### Cascading trip deletion

Deleting a trip removes its associated participants and expenses rather
than leaving orphan records.

### Resilient hydration

Malformed or invalid stored data is handled defensively rather than
being allowed to crash the application.

------------------------------------------------------------------------

# ♿ Accessibility

TripSplit is designed to be usable beyond mouse-only interaction.

The interface includes:

-   Keyboard navigation
-   Visible focus states
-   Modal focus handling
-   Escape-to-close behavior
-   Semantic headings
-   Accessible labels
-   Screen-reader descriptions
-   Touch-friendly controls
-   Responsive layouts
-   Reduced-motion support

The goal is not just to make the UI look playful, but to keep it usable.

------------------------------------------------------------------------

# 📱 Responsive Design

TripSplit adapts across:

``` text
🖥️ Desktop
📱 Mobile
📟 Tablet
```

The layout changes rather than simply shrinking.

Examples:

``` text
Desktop
→ multi-column dashboard

Tablet
→ compact multi-column layout

Mobile
→ stacked content
→ touch-friendly actions
→ mobile navigation
```

------------------------------------------------------------------------

# 🧪 Quality Gates

The application has been tested across:

-   Trip creation/edit/archive/delete
-   Participant creation/edit/removal rules
-   Expense creation/edit/delete
-   Equal splits
-   Custom splits
-   Percentage splits
-   Shares
-   Selected participants
-   Balance invariants
-   Settlement generation
-   Trip isolation
-   LocalStorage hydration
-   Invalid/deleted trip routes
-   Dashboard reactivity
-   Settle Up UI
-   Accessibility behavior

Current verified project state:

``` text
✅ 245 tests passing
✅ 19 test suites
✅ 0 lint errors
✅ 0 lint warnings
✅ Production build passing
```

------------------------------------------------------------------------

# 🗂️ High-Level Project Structure

``` text
TripSplit/
│
├── 📁 public/
│   └── _redirects
│
├── 📁 src/
│   │
│   ├── 📁 components/
│   │   └── shared UI / layout components
│   │
│   ├── 📁 features/
│   │   ├── 🧳 trips/
│   │   ├── 👥 participants/
│   │   ├── 💸 expenses/
│   │   ├── 🧮 finance/
│   │   └── 🤝 settlements/
│   │
│   ├── 📁 store/
│   │   ├── useTripStore.js
│   │   ├── useParticipantStore.js
│   │   ├── useExpenseStore.js
│   │   └── useUIStore.js
│   │
│   ├── 📁 lib/
│   │   └── persistence/
│   │
│   ├── 📁 utils/
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── 📄 package.json
├── 📄 vite.config.js
├── 📄 eslint.config.js
├── 📄 README.md
└── 📄 .gitignore
```

------------------------------------------------------------------------

# 🚀 Getting Started

## 1. Clone

``` bash
git clone https://github.com/Krishnendu1910/TripSplit.git
cd TripSplit
```

## 2. Install dependencies

``` bash
npm install
```

## 3. Start development server

``` bash
npm run dev
```

Then open the local URL shown by Vite.

------------------------------------------------------------------------

# 🧪 Development Commands

### Run development server

``` bash
npm run dev
```

### Run tests

``` bash
npm run test
```

### Run lint

``` bash
npm run lint
```

### Create production build

``` bash
npm run build
```

### Preview production build

``` bash
npm run preview
```

------------------------------------------------------------------------

# 🧭 Product Philosophy

TripSplit is intentionally designed around a few rules.

### 1. 🧮 Complexity belongs in the engine

Users should not have to understand the settlement algorithm.

### 2. ✍️ Data entry should be fast

Adding an expense should feel easier than editing an Excel sheet.

### 3. 👀 Results should be obvious

The user should quickly understand:

``` text
Who pays?
Who receives?
How much?
```

### 4. 🔢 Money must be exact

Financial calculations should not depend on approximate floating-point
arithmetic.

### 5. 🧱 Financial logic must be independent

The UI should not contain duplicated accounting formulas.

### 6. 🧹 No fake financial data

Balances, totals, and settlements must come from actual trip records.

### 7. 🧑‍🤝‍🧑 The product should feel like a travel companion

The UI can be playful and animated without sacrificing correctness.

------------------------------------------------------------------------

# 💡 How TripSplit Helps

Without TripSplit:

``` text
Trip
 ↓
Excel
 ↓
Rows
 ↓
Columns
 ↓
Manual formulas
 ↓
Manual balance checking
 ↓
WhatsApp messages
 ↓
"Bro how much do I owe?"
 ↓
More calculations
```

With TripSplit:

``` text
Trip
 ↓
Add people
 ↓
Record expenses
 ↓
TripSplit calculates everything
 ↓
Settle Up
 ↓
"Rohan → Deba ₹X"
```

The person maintaining the expenses no longer needs to behave like the
group's accountant.

------------------------------------------------------------------------

# 🌱 Designed for Further Growth

The current architecture intentionally keeps the core financial engine
independent from storage and UI.

That makes it possible to extend TripSplit later with capabilities such
as:

-   ☁️ Cloud synchronization
-   🔐 Authentication
-   👥 Shared trips across devices
-   🔗 Invite links
-   📱 Shareable settlement summaries
-   📄 CSV/JSON export
-   🧾 Receipt attachments
-   📸 Receipt scanning
-   🤖 Intelligent expense categorization
-   🔔 Settlement reminders

These are extensions of the same product rather than reasons to replace
the underlying financial model.

------------------------------------------------------------------------

# 🏁 The Core Idea

TripSplit is not trying to build a prettier Excel sheet.

It is trying to transform this:

``` text
"Who paid what?"
"Who was included?"
"How much is my share?"
"Who owes whom?"
"How do we settle this?"
```

into:

``` text
        💸 Record the expense
                 ↓
        🧮 TripSplit does the math
                 ↓
          🤝 Settle the trip
```

## **Record the money. TripSplit does the math.**

------------------------------------------------------------------------

## 📜 License

This project is currently maintained as a personal product project.
Licensing terms can be added when the distribution model is finalized.
