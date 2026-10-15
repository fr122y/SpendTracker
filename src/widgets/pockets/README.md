# Pockets Widget

Shows monthly pocket budgets, usage, operations, and editable history using the dashboard's shared selected date.

## Public API (`index.ts`)

- `PocketsSection`: responsive pocket list and selected-month detail.

## State & Data

- `usePockets` loads active and archived pockets. Without an explicit
  choice, the first active pocket is selected; an archived pocket is selected
  by default only when no active pocket exists.
- An archived pocket is read-only: its budget input is disabled and its
  history has no edit or delete actions. `useRestorePocket` returns it to the
  active list and shows a name-conflict message when an active pocket already
  uses its name.
- `usePocketMonthBudget` reads or initializes the selected month's budget as
  soon as the selected pocket is known; its query does not wait for expense
  history to finish loading.
- `useExpenses` supplies pocket purchase and transfer history.
- The pocket header shows the displayed month («Октябрь 2026»).
- `PocketMonthHistory` is a collapsed per-month overview: budget, spent, and
  remainder or overspend from the pocket's first month to the selected one,
  12 months at a time. It derives months with `getPocketMonthHistory` from
  `usePocketMonthBudgets` (read-only, fetched only when expanded) and
  `useExpenses`; it never initializes past months.
- `useSessionStore` supplies the shared dashboard date.
- Shared `SkeletonRect` and `SkeletonText` primitives represent initial widget
  load and first load of a selected month's budget; cached content remains
  visible during background refetch.

## Dependencies

- Uses: `@/entities/pocket`, `@/entities/expense`, `@/entities/category`, `@/entities/session`, `@/features/manage-pockets`, `@/shared/lib`, `@/shared/ui`.
