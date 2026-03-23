# Database (shared/db)

Drizzle ORM database layer for the app's PostgreSQL backend.

## Public API (`index.ts`)

- `db`: server-only Drizzle client instance
- Table schemas from `schema.ts`

## State & Data

- Driver: `postgres` via singleton client
- Config: `drizzle.config.ts` at the repo root
- Source of truth: PostgreSQL tables for auth and app data

## Dependencies

- Uses: `drizzle-orm`, `postgres`, `@auth/core/adapters`, `@/shared/types`
