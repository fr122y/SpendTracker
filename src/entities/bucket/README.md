# Bucket Entity

Manages allocation buckets for savings and investment percentages.

## Public API (`index.ts`)

- `useBucketStore`: Reatom store hook for bucket state management

## State & Data

- **Store:** `useBucketStore` (Persistence Key: `smartspend-buckets`)
- **Default Buckets:**
  - Накопления (Savings): 20%
  - Инвестиции (Investments): 10%
- **Actions:**
  - `updateBuckets(buckets)`: Full replace of buckets array

## Testing

Comprehensive test suite located at `__tests__/store.test.ts` covering:
- Initial state and default buckets
- `updateBuckets` action with various scenarios (empty arrays, edge cases, unicode)
- Selector support for derived values
- Store stability and reference equality
- Direct atom access and synchronization
- Subscription and reactivity
- Edge cases (large arrays, rapid updates, special characters)

Run tests: `npm run test src/entities/bucket/__tests__/store.test.ts`

## Dependencies

- Uses: `@/shared/types` (AllocationBucket type)
