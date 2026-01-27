# Manage Buckets Feature

CRUD operations for allocation buckets (savings, investments, etc.).

## Public API (`index.ts`)

- `BucketEditor`: Component for editing allocation bucket percentages

## State & Data

- **Store:** Uses `useBucketStore` (Persistence Key: `smartspend-buckets`)
- **Store:** Uses `useSettingsStore` for salary (Persistence Key: `smartspend-settings-salary`)
- **Actions:** Update bucket percentages, add/remove buckets, set salary

## Features

- Input monthly salary/income
- Edit allocation percentages for each bucket
- Edit bucket labels
- Add new buckets
- Delete existing buckets
- Validates total doesn't exceed 100%
- Shows remaining percentage for "Operations"
- Displays calculated amounts (salary × percentage) when salary is set

## Dependencies

- Uses: `@/entities/bucket`, `@/entities/settings`, `@/shared/ui`
