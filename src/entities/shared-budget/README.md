# Shared Budget Entity

Client-side access layer for shared weekly budgets.

## Public API (`index.ts`)

- `useSharedBudgets`: Query hook for budgets where the current user is a member
- `useCreateSharedBudget`: Mutation hook for creating a shared budget
- `useSetActiveSharedBudget`: Mutation hook for selecting the active budget
- `useSetSharedWeeklyLimitForWeek`: Mutation hook for effective weekly limits
- `useArchiveSharedBudget`: Mutation hook for owner archival
- `useCreateSharedBudgetInvite`: Mutation hook for owner invite links
- `getActiveSharedBudget`: Helper for resolving the current active budget
- `getEffectiveSharedWeeklyLimit`: Helper for historical limit lookup

## State & Actions

- Server state is stored in TanStack Query under `queryKeys.sharedBudgets.all`.
- Mutations use optimistic cache updates with rollback and refetch.
- Invite generation is not cached because every generated link is one-time.

## Dependencies

- Uses: `@/shared/api`, `@/shared/lib`, `@/shared/types`
