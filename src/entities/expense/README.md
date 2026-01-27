# Expense Entity

Manages individual expense records with CRUD operations and persistent storage.

## Public API (`index.ts`)

- `useExpenseStore`: Reatom store hook for expense state management
- `ExpenseCard`: Presentational component displaying a single expense with inline amount editing (supports math expressions via MathInput)
- `ExpenseList`: Component rendering sorted list of expenses (descending by date)

## State & Data

- **Store:** `useExpenseStore` (Persistence Key: `smartspend-expenses`)
- **Actions:**
  - `addExpense(expense)`: Add new expense
  - `deleteExpense(id)`: Remove expense by ID
  - `updateExpense(id, data)`: Partial update of expense

## Dependencies

- Uses: `@/shared/types` (Expense type)
- Uses: `@/shared/ui/math-input` (MathInput component for inline editing)
- Uses: `lucide-react` (Trash2 icon)
