# Manage Buckets Feature

CRUD operations for allocation buckets (savings, investments, etc.).

## Public API (`index.ts`)

- `BucketEditor`: Component for editing allocation categories by percentage or amount

## State & Data

- `useBuckets`: Query hook for bucket data
- `useUpdateBuckets`: Mutation hook for replacing the bucket list
- `useSettings`: Query hook for salary/settings values
- `useUpdateSettings`: Mutation hook for salary updates

## Features

- Input monthly salary/income
- Edit allocation percentage and amount for each category
- Keep the last edited field as the category's saved basis
- Calculate money and the operations remainder in kopecks
- Show an over-budget warning without changing the entered plan
- Edit bucket labels
- Add new buckets
- Delete existing buckets
- Validates finite, non-negative values and supported currency precision
- Shows remaining percentage and amount for "Operations"
- Allows amount-based categories before income is set
- Formats calculated percentages to at most two decimal places

## Dependencies

- Uses: `@/entities/bucket`, `@/entities/settings`, `@/shared/ui`
