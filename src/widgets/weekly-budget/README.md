# Weekly Budget Widget

Displays weekly personal spending coverage against the editable personal limit
plus same-week project top-ups, and manages the active shared weekly budget.

## Public API (`index.ts`)

- `WeeklyBudget`: Personal and shared weekly budget coverage and limit editor

## State & Data

- `useSettings`: weeklyLimit snapshot
- `useUpdateSettings`: mutation for weekly limit changes
- `useExpenses`: operations for personal spending and project top-up calculation
- `useSharedBudgets`: shared budgets where the current user is a member
- shared budget mutations: create, select active, set weekly limit, archive, and
  invite link generation
- `useProjectStore`: project colors and names for top-up segments
- `useSessionStore`: selectedDate for week calculation

## Features

- Week date range display (Mon-Sun)
- Segmented progress bar for personal limit, project additions, and uncovered overage
- Personal, project-covered, project top-up, remaining, and over-budget amounts
- Direct limit editing via input field
- Over-budget visual indication
- Shared budget creation with the selected week's initial limit
- Active shared budget selection, member list, shared spent, remaining, and
  historical shared weekly limit editing
- Owner-only invite link generation and archival

## Dependencies

- Uses: `@/entities/settings`, `@/entities/expense`, `@/entities/project`,
  `@/entities/session`, `@/entities/shared-budget`, `@/shared/lib`,
  `@/shared/ui`
