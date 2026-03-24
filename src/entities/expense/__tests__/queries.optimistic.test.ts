import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { showMutationRollbackToast } from '@/shared/lib'

import {
  useAddExpense,
  useDeleteExpense,
  useUpdateExpense,
} from '../model/queries'

import type { Expense } from '@/shared/types'

let shouldRejectAdd = false
let shouldRejectDelete = false
let shouldRejectUpdate = false

jest.mock('@/shared/lib', () => ({
  showMutationRollbackToast: jest.fn(),
}))

jest.mock('@/shared/api', () => ({
  queryKeys: { expenses: { all: ['expenses'] } },
  getExpenses: jest.fn(),
  addExpense: jest.fn(async () => {
    if (shouldRejectAdd) {
      throw new Error('add failed')
    }
  }),
  deleteExpense: jest.fn(async () => {
    if (shouldRejectDelete) {
      throw new Error('delete failed')
    }
  }),
  updateExpense: jest.fn(async () => {
    if (shouldRejectUpdate) {
      throw new Error('update failed')
    }
  }),
}))

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

const initialExpenses: Expense[] = [
  {
    id: '1',
    description: 'Обед',
    amount: 500,
    date: '2026-03-20',
    category: 'Еда',
    emoji: '🍔',
    projectId: 'p1',
  },
]

describe('expense optimistic mutations', () => {
  beforeEach(() => {
    shouldRejectAdd = false
    shouldRejectDelete = false
    shouldRejectUpdate = false
    ;(showMutationRollbackToast as jest.Mock).mockReset()
  })

  it('adds expense optimistically with temp id', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(['expenses'], initialExpenses)

    const { result } = renderHook(() => useAddExpense(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        description: 'Кофе',
        amount: 250,
        date: '2026-03-21',
        category: 'Еда',
        emoji: '☕',
      })
    })

    await waitFor(() => {
      const optimistic = queryClient.getQueryData<Expense[]>(['expenses'])
      expect(optimistic).toHaveLength(2)
      expect(optimistic?.[1].id).toMatch(/^temp-/)
      expect(optimistic?.[1]).toEqual(
        expect.objectContaining({
          description: 'Кофе',
          amount: 250,
        })
      )
    })
  })

  it('rolls back update on error and shows toast', async () => {
    shouldRejectUpdate = true

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(['expenses'], initialExpenses)

    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        id: '1',
        data: { amount: 999, emoji: '🔥' },
      })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['expenses'])).toEqual(initialExpenses)
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })

  it('rolls back delete on error and invalidates on settled', async () => {
    shouldRejectDelete = true

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    queryClient.setQueryData(['expenses'], initialExpenses)

    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate('1')
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['expenses'])).toEqual(initialExpenses)
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses'] })
    })
  })
})
