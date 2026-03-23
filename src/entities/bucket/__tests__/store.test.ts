import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { useBucketStore } from '../model/queries'

import type { AllocationBucket } from '@/shared/types'

let buckets: AllocationBucket[] = []

jest.mock('@/shared/api', () => ({
  queryKeys: { buckets: { all: ['buckets'] } },
  getBuckets: jest.fn(async () => buckets),
  updateBuckets: jest.fn(async (nextBuckets: AllocationBucket[]) => {
    buckets = nextBuckets
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useBucketStore', () => {
  beforeEach(() => {
    buckets = [
      { id: '1', label: 'Накопления', percentage: 20 },
      { id: '2', label: 'Инвестиции', percentage: 10 },
    ]
    jest.clearAllMocks()
  })

  it('reads and updates buckets through the query-backed store', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useBucketStore(), { wrapper })

    await waitFor(() => {
      expect(result.current.buckets).toHaveLength(2)
    })

    act(() => {
      result.current.updateBuckets([
        { id: '3', label: 'Резерв', percentage: 15 },
      ])
    })

    await waitFor(() => {
      expect(result.current.buckets).toEqual([
        { id: '3', label: 'Резерв', percentage: 15 },
      ])
    })
  })
})
