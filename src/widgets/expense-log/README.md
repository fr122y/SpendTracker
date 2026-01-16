# Expense Log Widget

Displays a list of expenses with filtering and sorting capabilities.

## Public API (`index.ts`)

- `ExpenseLogWidget`: Scrollable expense list with category grouping

## State & Data

- **Store:** Reads from `useExpenseStore`
- **Actions:** Filter by date range, category, project

## Dependencies

- Uses: `@/entities/expense`, `@/entities/category`, `@/features/add-expense`, `@/shared/ui`
