# Manage Buckets Feature

CRUD operations for budget buckets (spending limits).

## Public API (`index.ts`)

- `BucketForm`: Form for creating/editing budget buckets
- `useManageBuckets`: Hook with mutations for bucket CRUD

## State & Data

- **Mutation:** Uses TanStack Query mutations for CRUD operations
- **Actions:** Create, update, delete buckets, set limits

## Dependencies

- Uses: `@/entities/bucket`, `@/shared/api`, `@/shared/ui`
