# Manage Buckets Feature

CRUD operations for allocation buckets (savings, investments, etc.).

## Public API (`index.ts`)

- `BucketEditor`: Component for editing percentage-based allocation categories; the amount input converts a current-income amount to a percentage

## State & Data

- `useBuckets`: Query hook for bucket data
- `useUpdateBuckets`: Mutation hook for replacing the bucket list
- `useSettings`: Query hook for salary/settings values
- `useUpdateSettings`: Mutation hook for salary updates

## Features

- Input monthly salary/income
- Edit allocation percentage and use an amount input to calculate the percentage for current income
- Keep percentage as the only canonical saved allocation value
- Calculate money and the operations remainder in kopecks
- Show an over-budget warning without changing the entered plan
- Edit bucket labels
- Add new buckets
- Delete existing buckets
- Validates finite, non-negative values and supported currency precision
- Shows remaining percentage and amount for "Operations"
- Disables amount input until a positive income is set; percentage remains editable
- Formats calculated percentages to at most two decimal places

## Dependencies

- Uses: `@/entities/bucket`, `@/entities/settings`, `@/shared/ui`
