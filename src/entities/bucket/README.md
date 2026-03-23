# Bucket Entity

Manages allocation buckets through DB-backed query hooks and mutation actions.

## Public API (`index.ts`)

- `useBuckets`: Query hook for allocation buckets
- `useUpdateBuckets`: Mutation hook for replacing the bucket list

## State & Data

- **Source of truth:** Database via Server Actions
- **Client cache:** TanStack Query
- **Default buckets:** Накопления 20%, Инвестиции 10%

## Dependencies

- Uses: `@/shared/api` (server actions + query client)
- Uses: `@/shared/types` (AllocationBucket type)
