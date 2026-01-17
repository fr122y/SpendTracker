# Add Expense Feature

Handles expense creation with AI-powered categorization.

## Public API (`index.ts`)

- `ExpenseForm`: Form component for adding new expenses with AI categorization

## State & Data

- **Mutation:** Uses TanStack Query `useMutation` to call Server Action
- **Actions:** Submit expense, AI categorization, fallback to "Другое" on error

## Logic Flow

1. User enters description and amount
2. On Submit: Calls `categorizeExpenseAction` via mutation
3. On Success: Receives `{ category, emoji }` from server, calls `addExpense` store action
4. On Error: Falls back to "Другое" category and saves

## Dependencies

- Uses: `@/entities/expense`, `@/entities/category`, `@/shared/api`, `@/shared/ui`
