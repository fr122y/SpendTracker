'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addExpense as addExpenseAction,
  deleteExpense as deleteExpenseAction,
  getExpenses,
  queryKeys,
  updateExpense as updateExpenseAction,
} from '@/shared/api'
import { showMutationRollbackToast } from '@/shared/lib'

import type { Expense } from '@/shared/types'

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses.all,
    queryFn: getExpenses,
  })
}

export function useAddExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<Expense, 'id'>) => addExpenseAction(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all })
      const previous = queryClient.getQueryData<Expense[]>(
        queryKeys.expenses.all
      )
      const optimisticExpense: Expense = {
        id: `temp-${crypto.randomUUID()}`,
        ...data,
      }
      queryClient.setQueryData(
        queryKeys.expenses.all,
        (old: Expense[] = []) => [...old, optimisticExpense]
      )
      return { previous }
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(queryKeys.expenses.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteExpenseAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all })
      const previous = queryClient.getQueryData<Expense[]>(
        queryKeys.expenses.all
      )
      queryClient.setQueryData(queryKeys.expenses.all, (old: Expense[] = []) =>
        old.filter((expense) => expense.id !== id)
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(queryKeys.expenses.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<Expense, 'id'>>
    }) => updateExpenseAction(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all })
      const previous = queryClient.getQueryData<Expense[]>(
        queryKeys.expenses.all
      )
      queryClient.setQueryData(queryKeys.expenses.all, (old: Expense[] = []) =>
        old.map((expense) =>
          expense.id === id ? { ...expense, ...data } : expense
        )
      )
      return { previous }
    },
    onError: (_error, _payload, context) => {
      queryClient.setQueryData(queryKeys.expenses.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
    },
  })
}

interface ExpenseState {
  expenses: Expense[]
  isLoading: boolean
  addExpense: (expense: Expense) => void
  deleteExpense: (id: string) => void
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id'>>) => void
}

export function useExpenseStore(): ExpenseState
export function useExpenseStore<T>(selector: (state: ExpenseState) => T): T
export function useExpenseStore<T>(selector?: (state: ExpenseState) => T) {
  const { data: expenses = [], isLoading } = useExpenses()
  const addExpense = useAddExpense()
  const deleteExpense = useDeleteExpense()
  const updateExpense = useUpdateExpense()

  const state: ExpenseState = {
    expenses,
    isLoading,
    addExpense: (expense) => {
      addExpense.mutate({
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        emoji: expense.emoji,
        projectId: expense.projectId,
      })
    },
    deleteExpense: (id) => {
      deleteExpense.mutate(id)
    },
    updateExpense: (id, data) => {
      updateExpense.mutate({ id, data })
    },
  }

  if (selector) {
    return selector(state)
  }

  return state
}
