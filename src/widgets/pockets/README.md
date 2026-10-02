# Pockets Widget

Shows monthly pocket budgets, usage, operations, and editable history using the dashboard's shared selected date.

## Public API (`index.ts`)

- `PocketsSection`: responsive pocket list and selected-month detail.

## State & Data

- `usePockets` loads active and archived pockets.
- `usePocketMonthBudget` reads or initializes the selected month's budget as
  soon as the selected pocket is known; its query does not wait for expense
  history to finish loading.
- `useExpenses` supplies pocket purchase and transfer history.
- `useSessionStore` supplies the shared dashboard date.
- Shared `SkeletonRect` and `SkeletonText` primitives represent initial widget
  load and first load of a selected month's budget; cached content remains
  visible during background refetch.

## Dependencies

- Uses: `@/entities/pocket`, `@/entities/expense`, `@/entities/category`, `@/entities/session`, `@/features/manage-pockets`, `@/shared/lib`, `@/shared/ui`.
