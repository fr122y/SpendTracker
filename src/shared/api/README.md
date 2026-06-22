# Shared API

Server Actions and shared query infrastructure for the application.

## Public API (`index.ts`)

- `registerUser({ name, email, password })`: credentials registration with validation and default seeding
- `requestPasswordReset({ email })`: start a neutral credentials password reset
  flow without exposing whether the email exists
- `getPasswordResetTokenStatus(token)`: resolve reset-token page state
- `resetPassword({ token, password })`: set a new bcrypt-hashed password for a
  valid one-time reset token
- `getKeywordMappings()`: get user keyword mappings joined with category metadata
- `saveKeywordMapping(keyword, categoryId)`: upsert keyword mapping for user
- `deleteKeywordMapping(id)`: delete mapping
- `getSharedKeywordMappings(sharedBudgetId)`: get shared budget keyword
  mappings joined with shared category metadata
- `saveSharedKeywordMapping(sharedBudgetId, keyword, categoryId)`: upsert a
  shared budget keyword mapping
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
- `createSharedBudgetInvite(sharedBudgetId)`: generate a one-time invite URL
  for a shared budget owner
- `getSharedBudgetInvitePreview(token)`: resolve invite state for the public
  invite page
- `acceptSharedBudgetInvite(token)`: accept a valid invite for the current user
- `queryClient`: TanStack Query client instance with default options

## Architecture

- All data mutations use Server Actions (`'use server'`)
- DB-backed entities read and write through TanStack Query hooks in their model layer
- No API Routes - Server Actions only
- Credentials auth uses `bcryptjs` hashing and shared auth seeding helper
- Keyword mappings are stored in DB and consumed client-side by Fuse.js matcher
- Shared keyword mappings are scoped to a shared budget and can only target
  active categories from that same shared budget
- Expense reads return the current user's private expenses plus shared-budget
  expenses from budgets where the current user is a member
- Shared expenses cannot be linked to project operations; project money remains
  private task-scoped behavior until a later product decision
- Shared budget invite tokens are stored as hashes and accepted through Server
  Actions only
- Password reset tokens are stored as hashes, expire after 15 minutes, and are
  invalidated after successful use

## Error Handling

- Mutations rely on optimistic updates in entity layer with rollback toast on failure
- Registration returns user-facing validation and duplicate-email messages
- Password reset requests return neutral success for existing credentials users,
  OAuth-only users, and unknown email addresses
- Shared budget actions throw authorization errors before mutating data
- Invite acceptance returns explicit invalid/expired/used/archived/duplicate
  states instead of mutating on failure
- Account email delivery errors are normalized by the server-only shared email
  wrapper before password reset or email verification flows consume them.

## Account Email Delivery

Account-related Server Actions should call `sendAccountEmail` from
`@/shared/lib/account-email` instead of using Resend directly. Import the module
only from server code; it is intentionally not exported from the general
`@/shared/lib` barrel. The wrapper requires typed email payloads, text and HTML
bodies, and an idempotency key so future retry or outbox work can reuse the
same contract.

Production environment:

- `RESEND_API_KEY`
- `ACCOUNT_EMAIL_FROM`
- `ACCOUNT_EMAIL_REPLY_TO` (optional)

Development and tests without `RESEND_API_KEY` use console preview mode.
