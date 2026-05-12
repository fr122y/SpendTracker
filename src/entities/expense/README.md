# Expense Entity

Manages money operation records through DB-backed query hooks and mutation
actions. The database table is still named `expense`, but records may represent
real expenses, project withdrawals, or project returns.

## Public API (`index.ts`)

- `useExpenses`: Query hook for the expense list
- `useAddExpense`: Mutation hook for creating a new expense
- `useDeleteExpense`: Mutation hook for deleting an expense by ID
- `useUpdateExpense`: Mutation hook for partial expense updates
- `ExpenseCard`: Presentational component displaying a single operation with optional date, type badge, and inline amount editing for real expenses
- `ExpenseList`: Component rendering a sorted list of operations with optional date display

## State & Data

- **Source of truth:** Database via Server Actions
- **Client cache:** TanStack Query
- **Data shape:** Records include amount, category, date, optional project link, and `operationType`
- **Operation types:** `expense`, `project_withdrawal`, `project_return`

## Dependencies

- Uses: `@/shared/api` (server actions + query client)
- Uses: `@/shared/types` (Expense type)
- Uses: `@/shared/ui/math-input` (MathInput component for inline editing)
- Uses: `lucide-react` (Trash2 icon)
