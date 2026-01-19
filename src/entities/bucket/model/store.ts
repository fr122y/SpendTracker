import { atom, action, wrap, withLocalStorage } from '@reatom/core'
import { useSyncExternalStore } from 'react'

import type { AllocationBucket } from '@/shared/types'

const DEFAULT_BUCKETS: AllocationBucket[] = [
  { id: '1', label: 'Накопления', percentage: 20 },
  { id: '2', label: 'Инвестиции', percentage: 10 },
]

// Atoms with persistence
export const bucketsAtom = atom(DEFAULT_BUCKETS, 'bucketsAtom').extend(
  withLocalStorage('smartspend-buckets')
)

// Actions
export const updateBuckets = action(
  (buckets: AllocationBucket[]) => bucketsAtom.set(buckets),
  'updateBuckets'
)

// Store state type
interface BucketState {
  buckets: AllocationBucket[]
  updateBuckets: (buckets: AllocationBucket[]) => void
}

// Action wrapper (stable reference)
const actionUpdateBuckets = (buckets: AllocationBucket[]) =>
  wrap(updateBuckets)(buckets)

// Cached state for useSyncExternalStore
let cachedState: BucketState | null = null
let cachedBuckets: AllocationBucket[] | undefined

const getState = (): BucketState => {
  const buckets = bucketsAtom()

  if (cachedState === null || cachedBuckets !== buckets) {
    cachedBuckets = buckets
    cachedState = {
      buckets,
      updateBuckets: actionUpdateBuckets,
    }
  }

  return cachedState
}

const subscribe = (callback: () => void) => {
  return bucketsAtom.subscribe(callback)
}

// Adapter Hook (Matches old Zustand API with selector support)
export function useBucketStore(): BucketState
export function useBucketStore<T>(selector: (state: BucketState) => T): T
export function useBucketStore<T>(selector?: (state: BucketState) => T) {
  const state = useSyncExternalStore(subscribe, getState, getState)

  if (selector) {
    return selector(state)
  }
  return state
}
