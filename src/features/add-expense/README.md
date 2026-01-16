# Add Expense Feature

Handles expense creation with AI-powered categorization.

## Public API (`index.ts`)

- `AddExpenseForm`: Form component for adding new expenses
- `useAddExpense`: Hook with TanStack Query mutation for expense creation

## State & Data

- **Mutation:** Uses TanStack Query `useMutation` to call Server Action
- **Actions:** Submit expense, AI categorization, optimistic update

## Server Actions

- `createExpense`: Creates expense and triggers AI categorization
- Fallback: Assigns "Other" category on AI failure

## Dependencies

- Uses: `@/entities/expense`, `@/entities/category`, `@/shared/api`, `@/shared/ui`
