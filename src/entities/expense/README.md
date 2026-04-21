# Expense Entity

Manages individual expense records through DB-backed query hooks and mutation
actions.

## Public API (`index.ts`)

- `useExpenses`: Query hook for the expense list
- `useAddExpense`: Mutation hook for creating a new expense
- `useDeleteExpense`: Mutation hook for deleting an expense by ID
- `useUpdateExpense`: Mutation hook for partial expense updates
- `ExpenseCard`: Presentational component displaying a single expense with optional date and inline amount editing
- `ExpenseList`: Component rendering a sorted list of expenses with optional date display

## State & Data

- **Source of truth:** Database via Server Actions
- **Client cache:** TanStack Query
- **Data shape:** Expense records include amount, category, date, and optional project link

## Dependencies

- Uses: `@/shared/api` (server actions + query client)
- Uses: `@/shared/types` (Expense type)
- Uses: `@/shared/ui/math-input` (MathInput component for inline editing)
- Uses: `lucide-react` (Trash2 icon)
