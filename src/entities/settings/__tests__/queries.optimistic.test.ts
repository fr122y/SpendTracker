import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { showMutationRollbackToast } from '@/shared/lib'

import { useUpdateSettings } from '../model/queries'

import type { Settings } from '@/shared/api/settings-actions'

let shouldReject = false

jest.mock('@/shared/lib', () => ({
  showMutationRollbackToast: jest.fn(),
}))

jest.mock('@/shared/api', () => ({
  queryKeys: { settings: { all: ['settings'] } },
  getSettings: jest.fn(),
  updateSettings: jest.fn(async () => {
    if (shouldReject) {
      throw new Error('update failed')
    }
  }),
}))

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

const baseSettings: Settings = {
  weeklyLimit: 10000,
  salaryDay: 10,
  advanceDay: 25,
  salary: 50000,
}

describe('useUpdateSettings optimistic', () => {
  beforeEach(() => {
    shouldReject = false
    ;(showMutationRollbackToast as jest.Mock).mockReset()
  })

  it('applies optimistic update immediately and invalidates on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    queryClient.setQueryData(['settings'], baseSettings)

    const { result } = renderHook(() => useUpdateSettings(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ weeklyLimit: 15000 })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['settings'])).toEqual({
        ...baseSettings,
        weeklyLimit: 15000,
      })
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['settings'] })
    })
  })

  it('rolls back optimistic update and shows toast on error', async () => {
    shouldReject = true

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(['settings'], baseSettings)

    const { result } = renderHook(() => useUpdateSettings(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ salaryDay: 15 })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['settings'])).toEqual(baseSettings)
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })
})
