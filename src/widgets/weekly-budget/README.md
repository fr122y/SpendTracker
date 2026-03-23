# Weekly Budget Widget

Displays weekly spending progress against budget limits with editable limit.

## Public API (`index.ts`)

- `WeeklyBudget`: Progress bar with spent/remaining amounts and limit editor

## State & Data

- `useSettings`: weeklyLimit snapshot
- `useUpdateSettings`: mutation for weekly limit changes
- `useExpenses`: expenses for calculation
- `useSessionStore`: selectedDate for week calculation

## Features

- Week date range display (Mon-Sun)
- Progress bar with percentage and color coding
- Spent and remaining amounts display
- Direct limit editing via input field
- Over-budget visual indication

## Dependencies

- Uses: `@/entities/settings`, `@/entities/expense`, `@/entities/session`, `@/shared/lib`, `@/shared/ui`
