# Settings Entity

Manages user financial settings through DB-backed query hooks and mutation
actions.

## Public API (`index.ts`)

- `useSettings`: Query hook for the current settings snapshot
- `useUpdateSettings`: Mutation hook for partial settings updates
- `useSetWeeklyLimitForWeek`: Mutation hook for an effective weekly budget
  limit
- `useSettingsStore`: Convenience hook exposing current settings and update
  actions

## State & Data

- **Source of truth:** Database via Server Actions
- **Client cache:** TanStack Query
- **State:** weeklyLimit, weeklyLimits, salaryDay, advanceDay, salary
- **Weekly limits:** Effective-week records preserve historical personal
  budget limits while future weeks inherit the latest record

## Dependencies

- Uses: `@/shared/api` (server actions + query client)
- Uses: `@/shared/lib` (weekly limit selectors)
