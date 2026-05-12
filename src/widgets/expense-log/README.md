# Expense Log Widget

Displays all money operations for the selected date with add form, filters, and
daily real-expense totals.

## Public API (`index.ts`)

- `ExpenseLog`: Operation list with form and filters for selected date

## State & Data

- `useSessionStore`: selectedDate for filtering
- `useExpenses`: operation list
- `useDeleteExpense` and `useUpdateExpense`: mutations for item actions

## Features

- Header with formatted Russian date and daily total
- ExpenseForm for adding new operations
- Filters: all, real expenses, project-linked operations, movements
- Scrollable ExpenseList
- Empty state message when no operations match the active filter

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/features/add-expense`, `@/shared/lib`
