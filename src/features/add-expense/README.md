# Add Expense Feature

Handles expense creation with AI-powered categorization.

## Public API (`index.ts`)

- `ExpenseForm`: Form component for adding new expenses with AI categorization

## State & Data

- `useCategories`: Query hook for category suggestions
- `useAddExpense`: Mutation hook for saving the new expense
- `useMutation`: Used to call the `categorizeExpenseAction` Server Action

## Logic Flow

1. User enters description and amount
2. On submit, the form calls `categorizeExpenseAction`
3. On success, the mutation saves the expense through `useAddExpense`
4. On error, the form falls back to "Другое" and still saves the expense

## Dependencies

- Uses: `@/entities/expense`, `@/entities/category`, `@/shared/api`, `@/shared/ui`
