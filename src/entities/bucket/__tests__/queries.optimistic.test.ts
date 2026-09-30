import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { showMutationRollbackToast } from '@/shared/lib'

import { useUpdateBuckets } from '../model/queries'

import type { AllocationBucket } from '@/shared/types'

let mockFailureId: string | null = null
let mockHoldFirst = false
let mockReleaseFirst: (() => void) | null = null
let mockActionStarts: string[] = []

jest.mock('@/shared/lib', () => ({
  showMutationRollbackToast: jest.fn(),
}))

jest.mock('@/shared/api', () => ({
  queryKeys: { buckets: { all: ['buckets'] } },
  getBuckets: jest.fn(),
  updateBuckets: jest.fn(async (buckets: AllocationBucket[]) => {
    const firstId = buckets[0]?.id ?? ''
    mockActionStarts.push(firstId)
    if (mockHoldFirst && firstId === 'first') {
      await new Promise<void>((resolve) => {
        mockReleaseFirst = resolve
      })
    }
    if (firstId === mockFailureId) {
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
    mockFailureId = null
    mockHoldFirst = false
    mockReleaseFirst = null
    mockActionStarts = []
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
    mockFailureId = '9'

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
      result.current.mutate([
        {
          id: '9',
          label: 'Тест',
          percentage: 100,
        },
      ])
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['buckets'])).toEqual(initialBuckets)
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })

  it('serializes saves and keeps a newer optimistic snapshot after an older failure', async () => {
    mockFailureId = 'first'
    mockHoldFirst = true

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
    const firstSnapshot: AllocationBucket[] = [
      { id: 'first', label: 'Первый ввод', percentage: 25 },
    ]
    const secondSnapshot: AllocationBucket[] = [
      { id: 'second', label: 'Последний ввод', percentage: 30 },
    ]

    act(() => {
      result.current.mutate(firstSnapshot)
      result.current.mutate(secondSnapshot)
    })

    await waitFor(() => {
      expect(mockActionStarts).toEqual(['first'])
      expect(queryClient.getQueryData(['buckets'])).toEqual(secondSnapshot)
    })

    act(() => {
      mockReleaseFirst?.()
    })

    await waitFor(() => {
      expect(mockActionStarts).toEqual(['first', 'second'])
      expect(queryClient.getQueryData(['buckets'])).toEqual(secondSnapshot)
    })
  })
})
