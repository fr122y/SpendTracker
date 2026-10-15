# Weekly Budget Widget

Displays weekly personal spending coverage against the editable personal limit
plus same-week project top-ups and pocket transfers, and manages the active
shared weekly budget.

## Public API (`index.ts`)

- `WeeklyBudget`: Personal and shared weekly budget coverage and limit editor

## State & Data

- `useSettings`: weeklyLimit snapshot
- `useUpdateSettings`: mutation for weekly limit changes
- `useExpenses`: operations for personal spending and coverage calculations
- `useSharedBudgets`: shared budgets where the current user is a member
- shared budget mutations: create, select active, set weekly limit, archive, and
  invite link generation
- `useProjectStore` and `usePockets`: names for project and pocket coverage segments
- `useSessionStore`: selectedDate for week calculation

## Features

- Week date range display (Mon-Sun)
- Segmented progress bar for personal limit, project additions, pocket transfers,
  and uncovered overage
- Real spent amount against the effective limit (base limit plus same-week
  project and pocket top-ups), with the base limit and top-ups shown when
  top-ups exist
- Remaining amount within budget, or a single over-budget line
- Project and pocket top-up metrics, with the part used to cover overspending,
  shown only when the top-up is above zero
- Direct limit editing via a labelled input field; 0 and negative limits show
  an inline error and are not saved
- Over-budget visual indication
- Shared budget creation with the selected week's initial limit; 0 and
  negative shared limits (creation and edit) show an inline error and are not
  saved
- Active shared budget selection, member list, shared spent, remaining, and
  historical shared weekly limit editing
- Owner-only invite link generation and archival

## Dependencies

- Uses: `@/entities/settings`, `@/entities/expense`, `@/entities/project`,
  `@/entities/pocket`,
  `@/entities/session`, `@/entities/shared-budget`, `@/shared/lib`,
  `@/shared/ui`
