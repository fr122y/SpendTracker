# Savings Widget

Tracks savings goals and progress towards financial targets.

## Public API (`index.ts`)

- `SavingsWidget`: Savings goal progress and projections

## State & Data

- **Store:** Reads from `useExpenseStore`, `useBucketStore`
- **Actions:** Goal tracking, savings calculation

## Dependencies

- Uses: `@/entities/expense`, `@/entities/bucket`, `@/shared/lib`
