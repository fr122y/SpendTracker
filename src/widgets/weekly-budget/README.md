# Weekly Budget Widget

Displays weekly personal spending coverage against the editable personal limit
plus same-week project top-ups.

## Public API (`index.ts`)

- `WeeklyBudget`: Segmented weekly budget coverage and limit editor

## State & Data

- `useSettings`: weeklyLimit snapshot
- `useUpdateSettings`: mutation for weekly limit changes
- `useExpenses`: operations for personal spending and project top-up calculation
- `useProjectStore`: project colors and names for top-up segments
- `useSessionStore`: selectedDate for week calculation

## Features

- Week date range display (Mon-Sun)
- Segmented progress bar for personal limit, project additions, and uncovered overage
- Personal, project-covered, project top-up, remaining, and over-budget amounts
- Direct limit editing via input field
- Over-budget visual indication

## Dependencies

- Uses: `@/entities/settings`, `@/entities/expense`, `@/entities/project`, `@/entities/session`, `@/shared/lib`, `@/shared/ui`
