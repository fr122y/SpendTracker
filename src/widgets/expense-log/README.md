# Expense Log Widget

Displays all money operations for the selected date with add form, filters, and
daily real-expense totals.

## Public API (`index.ts`)

- `ExpenseLog`: Operation list with form and filters for selected date

## State & Data

- `useSessionStore`: selectedDate for filtering
- `useExpenses`: operation list
- `useDeleteExpense` and `useUpdateExpense`: mutations for item actions
- `usePockets`: names of active and archived pockets for operation cards; the
  journal does not wait for this query

## Features

- Header with formatted Russian date and daily total
- ExpenseForm for adding new operations
- Budget scope filters: all visible operations, personal operations, and shared
  budget operations
- Operation filters: all, real expenses, project-linked operations, pocket
  operations, movements
- Scrollable ExpenseList
- Pocket operation cards show the pocket name, including an archived pocket;
  until pockets are loaded the cards keep the badge without a name
- Operations of an archived pocket have no edit or delete actions and show a
  hint to restore the pocket
- Empty state message when no operations match the active filter

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/entities/pocket`, `@/features/add-expense`, `@/shared/lib`
