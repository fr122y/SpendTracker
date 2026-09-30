'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getBuckets,
  queryKeys,
  updateBuckets as updateBucketsAction,
} from '@/shared/api'
import { showMutationRollbackToast } from '@/shared/lib'

import type { AllocationBucket } from '@/shared/types'

function matchesBuckets(
  current: AllocationBucket[] | undefined,
  expected: AllocationBucket[]
): boolean {
  return (
    current?.length === expected.length &&
    current.every((bucket, index) => {
      const expectedBucket = expected[index]
      return (
        bucket.id === expectedBucket.id &&
        bucket.label === expectedBucket.label &&
        bucket.percentage === expectedBucket.percentage
      )
    })
  )
}

export function useBuckets() {
  return useQuery({
    queryKey: queryKeys.buckets.all,
    queryFn: getBuckets,
  })
}

export function useUpdateBuckets() {
  const queryClient = useQueryClient()

  return useMutation({
    scope: { id: 'bucket-allocations' },
    mutationFn: (buckets: AllocationBucket[]) => updateBucketsAction(buckets),
    onMutate: async (nextBuckets) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.buckets.all })
      const previous = queryClient.getQueryData<AllocationBucket[]>(
        queryKeys.buckets.all
      )
      queryClient.setQueryData(queryKeys.buckets.all, nextBuckets)
      return { previous }
    },
    onError: (_error, nextBuckets, context) => {
      if (
        matchesBuckets(
          queryClient.getQueryData(queryKeys.buckets.all),
          nextBuckets
        )
      ) {
        queryClient.setQueryData(queryKeys.buckets.all, context?.previous)
      }
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buckets.all })
    },
  })
}

interface BucketState {
  buckets: AllocationBucket[]
  isLoading: boolean
  updateBuckets: (buckets: AllocationBucket[]) => void
}

export function useBucketStore(): BucketState
export function useBucketStore<T>(selector: (state: BucketState) => T): T
export function useBucketStore<T>(selector?: (state: BucketState) => T) {
  const { data: buckets = [], isLoading } = useBuckets()
  const updateBuckets = useUpdateBuckets()

  const state: BucketState = {
    buckets,
    isLoading,
    updateBuckets: (nextBuckets) => {
      updateBuckets.mutate(nextBuckets)
    },
  }

  if (selector) {
    return selector(state)
  }

  return state
}
