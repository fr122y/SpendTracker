# Add Expense Feature

Handles money operation creation with local keyword-based categorization for
real expenses.

## Public API (`index.ts`)

- `ExpenseForm`: Form component for adding personal expenses, shared budget
  expenses, project expenses, project withdrawals, and project returns

## State & Data

- `useCategoryStore`: Category list for suggestion/manual override
- `useSharedBudgets`: Shared budget list for available shared expense scopes
- `useSharedBudgetCategories`: Shared category list for the selected shared
  budget
- `useExpenseStore`: Mutation adapter for saving expense
- `useProjectStore`: Project list for project-linked expenses and movements
- `useCategorize`: Shared hook over `keyword-mapping` entity and Fuse.js matcher

## Logic Flow

1. User selects a scenario: personal expense, shared expense, project expense,
   project withdrawal, or project return
2. Personal expense remains the default fast path
3. Shared expense appears only when active shared budgets exist and requires a
   shared budget category
4. Project scenarios require project selection
5. Personal and project real expenses use keyword category suggestions/manual
   override
6. Project withdrawals and returns use the technical `Проектные деньги` category

## Dependencies

- Uses: `@/entities/expense`, `@/entities/category`,
  `@/entities/shared-budget`, `@/entities/project`,
  `@/entities/keyword-mapping`, `@/shared/ui`
