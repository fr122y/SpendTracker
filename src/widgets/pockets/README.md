# Pockets Widget

Shows monthly pocket budgets, usage, operations, and editable history using the dashboard's shared selected date.

## Public API (`index.ts`)

- `PocketsSection`: responsive pocket list and selected-month detail.

## State & Data

- `usePockets` loads active and archived pockets.
- `usePocketMonthBudget` reads or initializes the selected month's budget.
- `useExpenses` supplies pocket purchase and transfer history.
- `useSessionStore` supplies the shared dashboard date.

## Dependencies

- Uses: `@/entities/pocket`, `@/entities/expense`, `@/entities/category`, `@/entities/session`, `@/features/manage-pockets`, `@/shared/lib`, `@/shared/ui`.
