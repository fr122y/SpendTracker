import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { useExpenseStore } from '../model/queries'

import type { Expense } from '@/shared/types'

let expenses: Expense[] = []

jest.mock('@/shared/api', () => ({
  queryKeys: { expenses: { all: ['expenses'] } },
  getExpenses: jest.fn(async () => expenses),
  addExpense: jest.fn(async (expense: Omit<Expense, 'id'>) => {
    const nextExpense = {
      id: `expense-${expenses.length + 1}`,
      ...expense,
    }
    expenses = [...expenses, nextExpense]
    return nextExpense
  }),
  deleteExpense: jest.fn(async (id: string) => {
    expenses = expenses.filter((expense) => expense.id !== id)
  }),
  updateExpense: jest.fn(
    async (id: string, data: Partial<Omit<Expense, 'id'>>) => {
      expenses = expenses.map((expense) =>
        expense.id === id ? { ...expense, ...data } : expense
      )
    }
  ),
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

describe('useExpenseStore', () => {
  beforeEach(() => {
    expenses = []
    jest.clearAllMocks()
  })

  it('exposes an empty expenses list by default', async () => {
    const { result } = renderHook(() => useExpenseStore(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.expenses).toEqual([])
    })
  })

  it('adds, updates, and deletes expenses through the query-backed API', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useExpenseStore(), { wrapper })

    act(() => {
      result.current.addExpense({
        id: 'unused-local-id',
        description: 'Обед',
        amount: 500,
        date: '2024-01-15',
        category: 'Еда',
        emoji: '🍔',
      })
    })

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(1)
      expect(result.current.expenses[0].description).toBe('Обед')
    })

    act(() => {
      result.current.updateExpense(result.current.expenses[0].id, {
        amount: 750,
        emoji: '☕',
      })
    })

    await waitFor(() => {
      expect(result.current.expenses[0].amount).toBe(750)
      expect(result.current.expenses[0].emoji).toBe('☕')
    })

    act(() => {
      result.current.deleteExpense(result.current.expenses[0].id)
    })

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(0)
    })
  })
})
