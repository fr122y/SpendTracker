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
- **Data shape:** Records include amount, category, date, optional project link,
  optional shared budget link, author metadata, and `operationType`
- **Operation types:** `expense`, `project_withdrawal`, `project_return`
- **Visibility:** The list contains the current user's private expenses and
  shared expenses from budgets where the current user is a member
- **Scope rule:** Shared expenses cannot be linked to projects or project money
  operations

## Dependencies

- Uses: `@/shared/api` (server actions + query client)
- Uses: `@/shared/types` (Expense type)
- Uses: `@/shared/ui` (ConfirmDialog and MathInput components)
- Uses: `lucide-react` (Trash2 icon)
