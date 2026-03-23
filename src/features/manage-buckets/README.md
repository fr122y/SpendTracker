# Manage Buckets Feature

CRUD operations for allocation buckets (savings, investments, etc.).

## Public API (`index.ts`)

- `BucketEditor`: Component for editing allocation bucket percentages

## State & Data

- `useBuckets`: Query hook for bucket data
- `useUpdateBuckets`: Mutation hook for replacing the bucket list
- `useSettings`: Query hook for salary/settings values
- `useUpdateSettings`: Mutation hook for salary updates

## Features

- Input monthly salary/income
- Edit allocation percentages for each bucket
- Edit bucket labels
- Add new buckets
- Delete existing buckets
- Validates total doesn't exceed 100%
- Shows remaining percentage for "Operations"
- Displays calculated amounts when salary is set

## Dependencies

- Uses: `@/entities/bucket`, `@/entities/settings`, `@/shared/ui`
