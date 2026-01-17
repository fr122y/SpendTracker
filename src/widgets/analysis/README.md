# Analysis Widget

Provides spending analysis with category breakdown for the current view month.

## Public API (`index.ts`)

- `AnalysisDashboard`: Visual grid of category boxes showing spending distribution

## State & Data

- **Stores:**
  - `useSessionStore`: viewDate for month selection
  - `useExpenseStore`: expenses list for aggregation

## Features

- Header with month name and total spent
- Visual category boxes with:
  - Size proportional to spending percentage
  - Opacity based on relative spending
  - Emoji and category name display
  - Hover tooltip showing exact amount
- Empty state when no data

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/shared/lib`
