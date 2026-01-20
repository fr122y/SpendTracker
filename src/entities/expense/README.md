# Expense Entity

Manages individual expense records with CRUD operations and persistent storage.

## Public API (`index.ts`)

- `useExpenseStore`: Reatom store hook for expense state management
- `ExpenseCard`: Presentational component displaying a single expense
- `ExpenseList`: Component rendering sorted list of expenses (descending by date)

## State & Data

- **Store:** `useExpenseStore` (Persistence Key: `smartspend-expenses`)
- **Actions:**
  - `addExpense(expense)`: Add new expense
  - `deleteExpense(id)`: Remove expense by ID
  - `updateExpense(id, data)`: Partial update of expense

## Dependencies

- Uses: `@/shared/types` (Expense type)
- Uses: `lucide-react` (Trash2 icon)
