# Weekly Budget Widget

Displays weekly personal spending progress against the editable personal limit
and a separate project-money segment.

## Public API (`index.ts`)

- `WeeklyBudget`: Personal budget progress, project-money segment, and limit editor

## State & Data

- `useSettings`: weeklyLimit snapshot
- `useUpdateSettings`: mutation for weekly limit changes
- `useExpenses`: operations for personal and project envelope calculation
- `useSessionStore`: selectedDate for week calculation

## Features

- Week date range display (Mon-Sun)
- Progress bar with percentage and color coding
- Spent and remaining amounts display
- Separate project-money block with available, spent, and remaining amounts
- Direct limit editing via input field
- Over-budget visual indication

## Dependencies

- Uses: `@/entities/settings`, `@/entities/expense`, `@/entities/session`, `@/shared/lib`, `@/shared/ui`
