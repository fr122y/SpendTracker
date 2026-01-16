# Expense Entity

Core business entity representing a financial expense.

## Public API (`index.ts`)

- `useExpenseStore`: Zustand store for expense state management
- `Expense`: TypeScript type for expense object
- `ExpenseCard`: UI component displaying single expense

## State & Data

- **Store:** `useExpenseStore` (Persistence Key: `smartspend-expenses`)
- **Actions:** `addExpense`, `removeExpense`, `updateExpense`, `getByDate`, `getByCategory`, `getByProject`

## Type Definition

```typescript
interface Expense {
  id: string
  amount: number
  description: string
  categoryId: string
  projectId?: string
  date: string
  createdAt: string
}
```

## Dependencies

- Uses: `@/shared/types`, `@/shared/lib`
