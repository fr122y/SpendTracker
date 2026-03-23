# Expense Log Widget

Displays personal expenses for the selected date with add form and daily totals.

## Public API (`index.ts`)

- `ExpenseLog`: Expense list with form for selected date

## State & Data

- `useSessionStore`: selectedDate for filtering
- `useExpenses`: expenses list
- `useDeleteExpense` and `useUpdateExpense`: mutations for item actions

## Features

- Header with formatted Russian date and daily total
- ExpenseForm for adding new expenses
- Scrollable ExpenseList
- Filters out project-linked expenses
- Empty state message when no expenses

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/features/add-expense`, `@/shared/lib`
