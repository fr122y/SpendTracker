# Shared API

Server Actions and shared query infrastructure for the application.

## Public API (`index.ts`)

- `registerUser({ name, email, password })`: credentials registration with validation and default seeding
- `getKeywordMappings()`: get user keyword mappings joined with category metadata
- `saveKeywordMapping(keyword, categoryId)`: upsert keyword mapping for user
- `deleteKeywordMapping(id)`: delete mapping
- `getSettings()`: get user settings with effective weekly limit history
- `updateSettings(data)`: update general user settings
- `setWeeklyLimitForWeek(effectiveWeekStart, amount)`: upsert a personal
  weekly limit from a selected week forward
- `getSharedBudgets()`: list shared budgets where the current user is a member
- `createSharedBudget(data)`: create a shared budget, owner membership, and
  initial weekly limit
- `archiveSharedBudget(sharedBudgetId)`: archive a shared budget owned by the
  current user
- `setActiveSharedBudget(sharedBudgetId)`: mark one shared budget active for
  the current user
- `setSharedWeeklyLimitForWeek(sharedBudgetId, effectiveWeekStart, amount)`:
  upsert a shared budget weekly limit
- `queryClient`: TanStack Query client instance with default options

## Architecture

- All data mutations use Server Actions (`'use server'`)
- DB-backed entities read and write through TanStack Query hooks in their model layer
- No API Routes - Server Actions only
- Credentials auth uses `bcryptjs` hashing and shared auth seeding helper
- Keyword mappings are stored in DB and consumed client-side by Fuse.js matcher
- Expense reads return the current user's private expenses plus shared-budget
  expenses from budgets where the current user is a member
- Shared expenses cannot be linked to project operations; project money remains
  private task-scoped behavior until a later product decision

## Error Handling

- Mutations rely on optimistic updates in entity layer with rollback toast on failure
- Registration returns user-facing validation and duplicate-email messages
- Shared budget actions throw authorization errors before mutating data
