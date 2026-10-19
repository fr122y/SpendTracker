# Edit Expense Feature

Full editor for one money operation: amount, description, category, and date,
including a move to another day or month.

## Public API (`index.ts`)

- `ExpenseEditDialog`: modal form opened from a journal card or a row of the
  analysis category details. Saving sends one optimistic `updateExpense` call
  with only the changed fields.
- `getExpenseEditRules`: which fields an operation allows, mirroring the
  server guards (shared expenses keep their category, pocket transfers keep
  their category and may drop to zero, project withdrawals and returns change
  only description and date).
- `buildExpensePatch`: the partial update for the changed, allowed fields.

## Rules

- Operations of an archived pocket open read-only with the archive hint.
- Changing the category saves an `exact` keyword rule for the whole final
  description (`useSaveKeywordMapping`); it does not affect other
  descriptions.
- Moving a record to another period needs no extra cache work: every period
  derives from the one expense list, which the update refetches.

## Dependencies

- Uses: `@/entities/expense`, `@/entities/category`, `@/entities/pocket`,
  `@/entities/keyword-mapping`
- Uses: `@/shared/ui`, `@/shared/lib`
