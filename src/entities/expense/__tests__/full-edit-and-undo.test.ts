import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { toast } from 'sonner'

import { deleteExpense, getExpenses } from '@/shared/api'
import { getMonthlyExpenses } from '@/shared/lib/finance-selectors'

import {
  EXPENSE_DELETE_UNDO_LABEL,
  EXPENSE_DELETE_UNDO_MS,
  EXPENSE_DELETED_TOAST,
  useDeleteExpenseWithUndo,
  useExpenses,
  useUpdateExpense,
} from '../model/queries'

import type { Expense } from '@/shared/types'

jest.mock('sonner', () => ({ toast: jest.fn() }))

jest.mock('@/shared/lib', () => ({
  showMutationRollbackToast: jest.fn(),
}))

jest.mock('@/shared/api', () => ({
  queryKeys: {
    expenses: { all: ['expenses'] },
    pockets: { all: ['pockets'] },
    pocketBudgets: { all: ['pocket-budgets'] },
  },
  getExpenses: jest.fn(),
  addExpense: jest.fn(),
  deleteExpense: jest.fn(async () => ({ status: 'deleted' })),
  updateExpense: jest.fn(async () => undefined),
}))

const lunch: Expense = {
  id: 'lunch',
  description: 'Обед',
  amount: 500,
  date: '2026-01-31',
  category: 'Еда',
  emoji: '🍔',
}
const pocketPurchase: Expense = {
  id: 'pocket-buy',
  description: 'Кроссовки',
  amount: 7000,
  date: '2026-01-20',
  category: 'Одежда',
  emoji: '👟',
  pocketId: 'pocket-1',
}

function createClient(expenses: Expense[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(['expenses'], expenses)
  return queryClient
}

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

describe('full expense edit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getExpenses as jest.Mock).mockImplementation(async () => [lunch])
  })

  it('moves a record to another month: the old month loses it, the new one gains it, and the list is refetched', async () => {
    const queryClient = createClient([lunch])
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ id: 'lunch', data: { date: '2026-02-01' } })
    })

    await waitFor(() => {
      const cached = queryClient.getQueryData<Expense[]>(['expenses']) ?? []
      expect(getMonthlyExpenses(cached, new Date(2026, 0, 15))).toEqual([])
      expect(getMonthlyExpenses(cached, new Date(2026, 1, 15))).toEqual([
        expect.objectContaining({ id: 'lunch', date: '2026-02-01' }),
      ])
    })
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses'] })
    )
  })

  it('also refreshes pocket budgets of both months when a pocket purchase moves', async () => {
    const queryClient = createClient([pocketPurchase])
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        id: 'pocket-buy',
        data: { date: '2026-02-03' },
      })
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses'] })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['pocket-budgets'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pockets'] })
    })
  })
})

describe('delete with undo', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    ;(getExpenses as jest.Mock).mockImplementation(async () => [lunch])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  function renderDeleteHook(queryClient: QueryClient) {
    return renderHook(
      () => ({
        expenses: useExpenses(),
        deleteWithUndo: useDeleteExpenseWithUndo(),
      }),
      { wrapper: createWrapper(queryClient) }
    )
  }

  function undoAction() {
    const options = (toast as unknown as jest.Mock).mock.calls.at(-1)?.[1]
    return options.action as { label: string; onClick: () => void }
  }

  it('hides the row at once and deletes on the server after the undo window', async () => {
    const queryClient = createClient([lunch])
    const { result } = renderDeleteHook(queryClient)

    act(() => result.current.deleteWithUndo('lunch'))

    expect(result.current.expenses.data).toEqual([])
    expect(toast).toHaveBeenCalledWith(
      EXPENSE_DELETED_TOAST,
      expect.objectContaining({ duration: EXPENSE_DELETE_UNDO_MS })
    )
    expect(undoAction().label).toBe(EXPENSE_DELETE_UNDO_LABEL)
    expect(deleteExpense).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(EXPENSE_DELETE_UNDO_MS)
    })

    await waitFor(() => expect(deleteExpense).toHaveBeenCalledWith('lunch'))
  })

  it('restores the row and never calls the server when undone', async () => {
    const queryClient = createClient([lunch])
    const { result } = renderDeleteHook(queryClient)

    act(() => result.current.deleteWithUndo('lunch'))
    act(() => undoAction().onClick())

    expect(result.current.expenses.data).toEqual([lunch])

    await act(async () => {
      jest.advanceTimersByTime(EXPENSE_DELETE_UNDO_MS * 2)
    })
    expect(deleteExpense).not.toHaveBeenCalled()
  })

  it('commits waiting deletes when the page is hidden', async () => {
    const queryClient = createClient([lunch])
    const { result } = renderDeleteHook(queryClient)

    act(() => result.current.deleteWithUndo('lunch'))

    const visibility = jest
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('hidden')
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    visibility.mockRestore()

    await waitFor(() => expect(deleteExpense).toHaveBeenCalledWith('lunch'))
    // The undo arriving after the commit has nothing to cancel.
    act(() => undoAction().onClick())
    await act(async () => {
      jest.advanceTimersByTime(EXPENSE_DELETE_UNDO_MS)
    })
    expect(deleteExpense).toHaveBeenCalledTimes(1)
  })

  it('commits waiting deletes when the journal unmounts', async () => {
    const queryClient = createClient([lunch])
    const { result, unmount } = renderDeleteHook(queryClient)

    act(() => result.current.deleteWithUndo('lunch'))
    unmount()

    await waitFor(() => expect(deleteExpense).toHaveBeenCalledWith('lunch'))
    expect(deleteExpense).toHaveBeenCalledTimes(1)
  })
})
