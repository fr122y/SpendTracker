# Analysis Widget

Provides spending analysis with category breakdown for the current view month
and visible-expense scope switching.

## Public API (`index.ts`)

- `AnalysisDashboard`: Visual grid of category boxes showing spending distribution

## State & Data

- `useSessionStore`: selectedDate as the source month for analysis
- `useExpenseStore`: visible expenses list for aggregation
- Local scope state: all visible, personal, or shared expenses

## Features

- Header with month name and total spent
- Local `Все` / `Личные` / `Общие` expense scope filter
- Visual category boxes with size/opacity scaling
- Hover tooltip showing exact personal, shared, project, and total amounts
- Empty state when no data

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/shared/lib`
