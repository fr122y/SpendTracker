# Savings Widget

Wrapper widget for income allocation bucket management.

## Public API (`index.ts`)

- `SavingsSection`: Wrapper around BucketEditor feature

## State & Data

- Delegates to `BucketEditor` from `@/features/manage-buckets`

## Features

- Header with section title
- Bucket allocation editor with editable percentage and amount fields
- Per-category basis hint and over-budget remainder warning

## Dependencies

- Uses: `@/features/manage-buckets`
