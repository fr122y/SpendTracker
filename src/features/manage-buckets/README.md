# Manage Buckets Feature

CRUD operations for allocation buckets (savings, investments, etc.).

## Public API (`index.ts`)

- `BucketEditor`: Component for editing allocation bucket percentages

## State & Data

- **Store:** Uses `useBucketStore` (Persistence Key: `smartspend-buckets`)
- **Actions:** Update bucket percentages, add/remove buckets

## Features

- Edit allocation percentages for each bucket
- Edit bucket labels
- Add new buckets
- Delete existing buckets
- Validates total doesn't exceed 100%
- Shows remaining percentage for "Operations"

## Dependencies

- Uses: `@/entities/bucket`, `@/shared/ui`
