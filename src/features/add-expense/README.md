# Add Expense Feature

Handles money operation creation with local keyword-based categorization for
real expenses.

## Public API (`index.ts`)

- `ExpenseForm`: Form component for adding personal expenses, shared budget
  expenses, project expenses, project withdrawals, project returns, and pocket
  purchases

## State & Data

- `useCategoryStore`: Category list for suggestion/manual override
- `useSharedBudgets`: Shared budget list for available shared expense scopes
- `useSharedBudgetCategories`: Shared category list for the selected shared
  budget
- `useExpenseStore`: Mutation adapter for saving expense
- `useProjectStore`: Project list for project-linked expenses and movements
- `usePockets`: Pocket list for the pocket purchase scenario; archived pockets
  are filtered out
- Uses `useCategorize` and `useSharedCategorize` from `@/entities/category` for
  keyword suggestions, manual override, and mapping persistence

## Logic Flow

1. User selects a scenario: personal expense, shared expense, project expense,
   project withdrawal, project return, or pocket purchase
2. Personal expense remains the default fast path
3. Shared expense appears only when active shared budgets exist and uses shared
   budget keyword mappings to suggest a shared budget category
4. Project scenarios require project selection
5. Pocket purchase appears only when the loaded pocket list has a non-archived
   pocket. The only active pocket is preselected; with several, the select
   starts empty and a pocket must be chosen
6. A pocket purchase is saved as an `expense` with `pocketId` on the dashboard
   `selectedDate`, the same record the pockets widget creates. The form has no
   date field, no balance check, and no pocket transfer
7. Personal, project, pocket, and shared real expenses use keyword category
   suggestions/manual override; pocket purchases use the personal categories
8. Project withdrawals and returns use the technical `Проектные деньги` category
9. Project scenarios are offered only while the user has a project; otherwise
   a hint points to creating one in «Проекты». A project return larger than
   the project's cash on hand shows an inline error and cannot be submitted

## Dependencies

- Uses: `@/entities/expense`, `@/entities/category`,
  `@/entities/shared-budget`, `@/entities/project`, `@/entities/pocket`,
  `@/entities/session`, `@/shared/lib`, `@/shared/ui`
