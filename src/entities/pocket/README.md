# Pocket Entity

Manages user-owned named pockets and saved monthly budget snapshots.

## Public API (`index.ts`)

- `usePockets`: query all active and archived pockets for the current user
- `usePocketMonthBudget`: query and initialize a selected month for an active pocket; returns `null` when an archived pocket has no saved period
- `usePocketMonthBudgets`: query all saved monthly budgets for one pocket
- `useCreatePocket`, `useRenamePocket`, `useArchivePocket`, `useRestorePocket`: optimistic pocket mutations
- `PocketNameConflictError`: thrown by `useRestorePocket` when an active pocket already has the same trimmed, case-insensitive name
- `useSetPocketMonthBudget`: optimistic update to an existing period
- `Pocket`, `PocketMonthBudget`: public entity types

## State & Data

- **Source of truth:** Database through authenticated Server Actions
- **Client cache:** TanStack Query
- **Operation records:** The expense entity stores pocket purchases and transfers with a pocket link
- **Archive behavior:** An archived pocket is read-only: its budgets and operations cannot be created, changed, or deleted until it is restored

## Dependencies

- Uses: `@/shared/api` (Server Actions and query keys)
- Uses: `@/shared/types` (`Pocket`, `PocketMonthBudget`)
- Uses: `@/shared/lib` (mutation rollback feedback)
