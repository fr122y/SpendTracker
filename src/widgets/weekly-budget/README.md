# Weekly Budget Widget

Displays weekly spending progress against budget limits.

## Public API (`index.ts`)

- `WeeklyBudgetWidget`: Progress bar and daily breakdown for current week

## State & Data

- **Store:** Reads from `useExpenseStore`, `useBucketStore`
- **Actions:** Week navigation, budget adjustment

## Dependencies

- Uses: `@/entities/expense`, `@/entities/bucket`, `@/shared/lib`
