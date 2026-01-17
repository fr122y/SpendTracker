import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AllocationBucket } from '@/shared/types'

const DEFAULT_BUCKETS: AllocationBucket[] = [
  { id: '1', label: 'Накопления', percentage: 20 },
  { id: '2', label: 'Инвестиции', percentage: 10 },
]

interface BucketState {
  buckets: AllocationBucket[]
  updateBuckets: (buckets: AllocationBucket[]) => void
}

export const useBucketStore = create<BucketState>()(
  persist(
    (set) => ({
      buckets: DEFAULT_BUCKETS,

      updateBuckets: (buckets) => set({ buckets }),
    }),
    {
      name: 'smartspend-buckets',
    }
  )
)
