'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getBuckets,
  queryKeys,
  updateBuckets as updateBucketsAction,
} from '@/shared/api'

import type { AllocationBucket } from '@/shared/types'

export function useBuckets() {
  return useQuery({
    queryKey: queryKeys.buckets.all,
    queryFn: getBuckets,
  })
}

export function useUpdateBuckets() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (buckets: AllocationBucket[]) => updateBucketsAction(buckets),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all })
    },
  })
}

interface BucketState {
  buckets: AllocationBucket[]
  updateBuckets: (buckets: AllocationBucket[]) => void
}

export function useBucketStore(): BucketState
export function useBucketStore<T>(selector: (state: BucketState) => T): T
export function useBucketStore<T>(selector?: (state: BucketState) => T) {
  const { data: buckets = [] } = useBuckets()
  const updateBuckets = useUpdateBuckets()

  const state: BucketState = {
    buckets,
    updateBuckets: (nextBuckets) => {
      updateBuckets.mutate(nextBuckets)
    },
  }

  if (selector) {
    return selector(state)
  }

  return state
}
