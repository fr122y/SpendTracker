# Expense Log Widget

Displays personal expenses for the selected date with add form and daily totals.

## Public API (`index.ts`)

- `ExpenseLog`: Expense list with form for selected date

## State & Data

- **Stores:**
  - `useSessionStore`: selectedDate for filtering
  - `useExpenseStore`: expenses list

## Features

- Header with formatted Russian date and daily total
- ExpenseForm for adding new expenses
- Scrollable ExpenseList (max 400px)
- Filters out project-linked expenses (personal only)
- Empty state message when no expenses

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/features/add-expense`, `@/shared/lib`
