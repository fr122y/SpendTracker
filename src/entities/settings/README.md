# Settings Entity

Manages user financial settings through DB-backed query hooks and mutation
actions.

## Public API (`index.ts`)

- `useSettings`: Query hook for the current settings snapshot
- `useUpdateSettings`: Mutation hook for partial settings updates
- `FinancialSettings`: Form component for editing financial settings

## State & Data

- **Source of truth:** Database via Server Actions
- **Client cache:** TanStack Query
- **State:** weeklyLimit, salaryDay, advanceDay, salary

## Dependencies

- Uses: `@/shared/api` (server actions + query client)
- Uses: `@/shared/ui` (Input component)
