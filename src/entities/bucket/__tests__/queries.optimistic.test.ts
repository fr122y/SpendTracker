import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { showMutationRollbackToast } from '@/shared/lib'

import { useUpdateBuckets } from '../model/queries'

import type { AllocationBucket } from '@/shared/types'

let shouldReject = false

jest.mock('@/shared/lib', () => ({
  showMutationRollbackToast: jest.fn(),
}))

jest.mock('@/shared/api', () => ({
  queryKeys: { buckets: { all: ['buckets'] } },
  getBuckets: jest.fn(),
  updateBuckets: jest.fn(async () => {
    if (shouldReject) {
      throw new Error('update failed')
    }
  }),
}))

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

const initialBuckets: AllocationBucket[] = [
  { id: '1', label: 'Накопления', percentage: 20 },
  { id: '2', label: 'Инвестиции', percentage: 10 },
]

describe('useUpdateBuckets optimistic', () => {
  beforeEach(() => {
    shouldReject = false
    ;(showMutationRollbackToast as jest.Mock).mockReset()
  })

  it('replaces buckets optimistically and invalidates on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    queryClient.setQueryData(['buckets'], initialBuckets)

    const { result } = renderHook(() => useUpdateBuckets(), {
      wrapper: createWrapper(queryClient),
    })

    const nextBuckets: AllocationBucket[] = [
      { id: '3', label: 'Резерв', percentage: 15 },
    ]

    act(() => {
      result.current.mutate(nextBuckets)
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['buckets'])).toEqual(nextBuckets)
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['buckets'] })
    })
  })

  it('rolls back buckets and shows toast on error', async () => {
    shouldReject = true

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(['buckets'], initialBuckets)

    const { result } = renderHook(() => useUpdateBuckets(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate([{ id: '9', label: 'Тест', percentage: 100 }])
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['buckets'])).toEqual(initialBuckets)
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })
})
