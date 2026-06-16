import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { showMutationRollbackToast } from '@/shared/lib'

import {
  useArchiveSharedBudget,
  useCreateSharedBudget,
  useSetActiveSharedBudget,
  useSetSharedWeeklyLimitForWeek,
} from '../model/queries'

import type { SharedBudget } from '@/shared/types'

let shouldReject = false

jest.mock('@/shared/lib', () => ({
  ...jest.requireActual('@/shared/lib'),
  showMutationRollbackToast: jest.fn(),
}))

jest.mock('@/shared/api', () => ({
  queryKeys: { sharedBudgets: { all: ['shared-budgets'] } },
  archiveSharedBudget: jest.fn(async () => {
    if (shouldReject) throw new Error('archive failed')
  }),
  createSharedBudget: jest.fn(async () => {
    if (shouldReject) throw new Error('create failed')
  }),
  createSharedBudgetInvite: jest.fn(async () => {
    if (shouldReject) throw new Error('invite failed')
    return { inviteUrl: 'http://localhost:3000/invite/token', expiresAt: '' }
  }),
  getSharedBudgets: jest.fn(),
  setActiveSharedBudget: jest.fn(async () => {
    if (shouldReject) throw new Error('select failed')
  }),
  setSharedWeeklyLimitForWeek: jest.fn(async () => {
    if (shouldReject) throw new Error('limit failed')
  }),
}))

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

const baseBudgets: SharedBudget[] = [
  {
    id: 'shared-1',
    name: 'Дом',
    createdByUserId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    role: 'owner',
    isActive: true,
    members: [],
    weeklyLimits: [{ effectiveWeekStart: '2026-01-19', amount: 8000 }],
  },
  {
    id: 'shared-2',
    name: 'Отпуск',
    createdByUserId: 'user-1',
    createdAt: '2026-01-02T00:00:00.000Z',
    role: 'member',
    isActive: false,
    members: [],
    weeklyLimits: [{ effectiveWeekStart: '2026-01-19', amount: 12000 }],
  },
]

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

describe('shared budget optimistic queries', () => {
  beforeEach(() => {
    shouldReject = false
    ;(showMutationRollbackToast as jest.Mock).mockReset()
  })

  it('optimistically creates an active shared budget', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['shared-budgets'], baseBudgets)

    const { result } = renderHook(() => useCreateSharedBudget(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        name: 'Еженедельный общий',
        initialWeeklyLimit: 8000,
        effectiveWeekStart: '2026-01-19',
      })
    })

    await waitFor(() => {
      const budgets =
        queryClient.getQueryData<SharedBudget[]>(['shared-budgets']) ?? []
      expect(budgets).toHaveLength(3)
      expect(budgets.at(-1)).toMatchObject({
        name: 'Еженедельный общий',
        isActive: true,
        role: 'owner',
      })
      expect(budgets[0].isActive).toBe(false)
    })
  })

  it('optimistically selects an active shared budget', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['shared-budgets'], baseBudgets)

    const { result } = renderHook(() => useSetActiveSharedBudget(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate('shared-2')
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['shared-budgets'])).toMatchObject([
        { id: 'shared-1', isActive: false },
        { id: 'shared-2', isActive: true },
      ])
    })
  })

  it('optimistically upserts a shared weekly limit', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['shared-budgets'], baseBudgets)

    const { result } = renderHook(() => useSetSharedWeeklyLimitForWeek(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        sharedBudgetId: 'shared-1',
        effectiveWeekStart: '2026-01-26',
        amount: 9000,
      })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['shared-budgets'])).toMatchObject([
        {
          id: 'shared-1',
          weeklyLimits: [
            { effectiveWeekStart: '2026-01-19', amount: 8000 },
            { effectiveWeekStart: '2026-01-26', amount: 9000 },
          ],
        },
        { id: 'shared-2' },
      ])
    })
  })

  it('optimistically archives a shared budget and rolls back on error', async () => {
    shouldReject = true
    const queryClient = createQueryClient()
    queryClient.setQueryData(['shared-budgets'], baseBudgets)

    const { result } = renderHook(() => useArchiveSharedBudget(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate('shared-1')
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['shared-budgets'])).toEqual(baseBudgets)
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })
})
