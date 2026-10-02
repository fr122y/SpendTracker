import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { showMutationRollbackToast } from '@/shared/lib'

import { useCreatePocket, useSetPocketMonthBudget } from '../model/queries'

import type { Pocket, PocketMonthBudget } from '@/shared/types'

let rejectCreate = false
let rejectSetBudget = false

jest.mock('@/shared/lib', () => ({
  showMutationRollbackToast: jest.fn(),
}))

jest.mock('@/shared/api', () => ({
  queryKeys: {
    pockets: { all: ['pockets'] },
    pocketBudgets: {
      all: ['pocket-budgets'],
      byPocket: (pocketId: string) => ['pocket-budgets', pocketId],
      byMonth: (pocketId: string, period: string) => [
        'pocket-budgets',
        pocketId,
        period,
      ],
    },
  },
  getPockets: jest.fn(),
  getPocketMonthBudgets: jest.fn(),
  initializePocketMonthBudget: jest.fn(),
  createPocket: jest.fn(async () => {
    if (rejectCreate) throw new Error('create failed')
    return {
      id: 'pocket-server',
      name: 'Дом',
      createdAt: '2026-10-01T00:00:00.000Z',
    }
  }),
  setPocketMonthBudget: jest.fn(async () => {
    if (rejectSetBudget) throw new Error('set budget failed')
  }),
  renamePocket: jest.fn(),
  archivePocket: jest.fn(),
}))

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

describe('pocket optimistic mutations', () => {
  beforeEach(() => {
    rejectCreate = false
    rejectSetBudget = false
    ;(showMutationRollbackToast as jest.Mock).mockReset()
  })

  it('rolls back a failed pocket creation', async () => {
    rejectCreate = true
    const initialPockets: Pocket[] = [
      {
        id: 'pocket-1',
        name: 'Квартира',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(['pockets'], initialPockets)

    const { result } = renderHook(() => useCreatePocket(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ name: 'Дом' })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['pockets'])).toEqual(initialPockets)
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })

  it('rolls back a failed monthly budget update without changing another month', async () => {
    rejectSetBudget = true
    const may: PocketMonthBudget = {
      pocketId: 'pocket-1',
      period: '2026-05',
      budget: 10_000,
    }
    const june: PocketMonthBudget = {
      pocketId: 'pocket-1',
      period: '2026-06',
      budget: 12_000,
    }
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(['pocket-budgets', 'pocket-1'], [may, june])
    queryClient.setQueryData(['pocket-budgets', 'pocket-1', '2026-05'], may)

    const { result } = renderHook(() => useSetPocketMonthBudget(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ ...may, budget: 9_000 })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['pocket-budgets', 'pocket-1'])).toEqual([
        may,
        june,
      ])
      expect(
        queryClient.getQueryData(['pocket-budgets', 'pocket-1', '2026-05'])
      ).toEqual(may)
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })
})
