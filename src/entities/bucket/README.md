# Bucket Entity

Business entity representing a budget bucket (spending limit category).

## Public API (`index.ts`)

- `useBucketStore`: Zustand store for bucket state management
- `Bucket`: TypeScript type for bucket object
- `BucketCard`: UI component displaying bucket with limit progress

## State & Data

- **Store:** `useBucketStore` (Persistence Key: `smartspend-buckets`)
- **Actions:** `addBucket`, `removeBucket`, `updateBucket`, `getById`

## Type Definition

```typescript
interface Bucket {
  id: string
  name: string
  limit: number
  period: 'daily' | 'weekly' | 'monthly'
  categoryIds: string[]
}
```

## Dependencies

- Uses: `@/shared/types`, `@/shared/lib`
