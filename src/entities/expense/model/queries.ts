'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import {
  addExpense as addExpenseAction,
  deleteExpense as deleteExpenseAction,
  getExpenses,
  queryKeys,
  updateExpense as updateExpenseAction,
} from '@/shared/api'
import { showMutationRollbackToast } from '@/shared/lib'

import {
  flushExpenseDeletes,
  scheduleExpenseDelete,
  undoExpenseDelete,
  usePendingExpenseDeleteIds,
} from './pending-deletes'

import type { AddExpenseInput, Expense } from '@/shared/types'

export function useExpenses() {
  const pendingDeleteIds = usePendingExpenseDeleteIds()
  // Records waiting for their undo window are hidden from every reader, so the
  // journal, totals, analysis, and budgets agree before the server delete.
  const select = useCallback(
    (data: Expense[]) =>
      pendingDeleteIds.size === 0
        ? data
        : data.filter((expense) => !pendingDeleteIds.has(expense.id)),
    [pendingDeleteIds]
  )
  return useQuery({
    queryKey: queryKeys.expenses.all,
    queryFn: getExpenses,
    select,
  })
}

export function useAddExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AddExpenseInput) => addExpenseAction(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.all })
      const previous = queryClient.getQueryData<Expense[]>(
        queryKeys.expenses.all
      )
      const isPocketTransfer = data.operationType === 'pocket_transfer'
      const optimisticExpense: Expense = {
        id: `temp-${crypto.randomUUID()}`,
        ...data,
        category:
          data.category ?? (isPocketTransfer ? 'Перевод из кармана' : ''),
        emoji: data.emoji ?? (isPocketTransfer ? '↗️' : ''),
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

export const PROJECT_CASH_NEGATIVE_DELETE_MESSAGE =
  'Нельзя удалить: на руках станет меньше 0 — сначала удалите возврат'

export class ProjectCashNegativeError extends Error {
  constructor() {
    super(PROJECT_CASH_NEGATIVE_DELETE_MESSAGE)
    this.name = 'ProjectCashNegativeError'
  }
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteExpenseAction(id)
      if (result?.status === 'project_cash_negative') {
        throw new ProjectCashNegativeError()
      }
    },
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
    onError: (error, _id, context) => {
      queryClient.setQueryData(queryKeys.expenses.all, context?.previous)
      showMutationRollbackToast(
        error instanceof ProjectCashNegativeError ? error.message : undefined
      )
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
    onSettled: (_result, _error, { id }, context) => {
      // Journal, daily and monthly totals, analysis, and the weekly budget all
      // derive from this one list, so refetching it refreshes the old and the
      // new period of a moved record alike.
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
      const original = context?.previous?.find((expense) => expense.id === id)
      if (original?.pocketId) {
        // Pocket month budgets are read per period on the server.
        queryClient.invalidateQueries({ queryKey: queryKeys.pocketBudgets.all })
        queryClient.invalidateQueries({ queryKey: queryKeys.pockets.all })
      }
    },
  })
}

/** How long a deleted record can be restored from the toast. */
export const EXPENSE_DELETE_UNDO_MS = 5000
export const EXPENSE_DELETED_TOAST = 'Расход удалён'
export const EXPENSE_DELETE_UNDO_LABEL = 'Отменить'

/**
 * Delete with an undo toast. The record is hidden at once and the server
 * delete runs after {@link EXPENSE_DELETE_UNDO_MS} unless the user undoes it.
 * Waiting deletes are committed right away when the page is hidden or the
 * owning component unmounts, so none is lost or left half-done.
 */
export function useDeleteExpenseWithUndo() {
  const deleteExpense = useDeleteExpense()
  const { mutateAsync } = deleteExpense

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushExpenseDeletes()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', flushExpenseDeletes)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', flushExpenseDeletes)
      flushExpenseDeletes()
    }
  }, [])

  return useCallback(
    (id: string) => {
      scheduleExpenseDelete(id, () => mutateAsync(id), EXPENSE_DELETE_UNDO_MS)
      toast(EXPENSE_DELETED_TOAST, {
        id: `expense-delete-${id}`,
        duration: EXPENSE_DELETE_UNDO_MS,
        action: {
          label: EXPENSE_DELETE_UNDO_LABEL,
          onClick: () => {
            undoExpenseDelete(id)
          },
        },
      })
    },
    [mutateAsync]
  )
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
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        emoji: expense.emoji,
        projectId: expense.projectId,
        pocketId: expense.pocketId,
        sharedBudgetId: expense.sharedBudgetId,
        sharedBudgetCategoryId: expense.sharedBudgetCategoryId,
        sharedBudgetName: expense.sharedBudgetName,
        authorName: expense.authorName,
        operationType: expense.operationType,
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
