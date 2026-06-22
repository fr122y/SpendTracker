# Database (shared/db)

Drizzle ORM database layer for the app's PostgreSQL backend.

## Public API (`index.ts`)

- `db`: server-only Drizzle client instance
- Table schemas from `schema.ts`

## State & Data

- Driver: `postgres` via singleton client
- Config: `drizzle.config.ts` at the repo root
- Source of truth: PostgreSQL tables for auth and app data
- Weekly personal budget history is stored in `weekly_budget_limit` with one
  effective limit per user/week start
- Shared budget data is stored in:
  - `shared_budget` for the budget record and archival state
  - `shared_budget_member` for per-user role and active selection
  - `shared_budget_invite` for one-time invite token hashes and acceptance
    state
  - `shared_budget_weekly_limit` for effective weekly limits per shared budget
- `expense.sharedBudgetId` links a record to a shared budget; private expenses
  keep this field null
- Auth users table stores:
  - OAuth profile fields (`name`, `email`, `image`, `emailVerified`)
  - Nullable `password` for credentials auth users
- `password_reset_token` stores one-time credentials password reset token
  hashes, expiry, and use state

## Dependencies

- Uses: `drizzle-orm`, `postgres`, `@auth/core/adapters`, `@/shared/types`
