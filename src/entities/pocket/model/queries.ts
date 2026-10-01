'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archivePocket as archivePocketAction,
  createPocket as createPocketAction,
  getPocketMonthBudgets,
  getPockets,
  initializePocketMonthBudget,
  queryKeys,
  renamePocket as renamePocketAction,
  setPocketMonthBudget as setPocketMonthBudgetAction,
} from '@/shared/api'
import { showMutationRollbackToast } from '@/shared/lib'

import type { Pocket, PocketMonthBudget } from '@/shared/types'

export function usePockets() {
  return useQuery({
    queryKey: queryKeys.pockets.all,
    queryFn: getPockets,
  })
}

export function usePocketMonthBudgets(pocketId: string) {
  return useQuery({
    queryKey: queryKeys.pocketBudgets.byPocket(pocketId),
    queryFn: () => getPocketMonthBudgets(pocketId),
    enabled: Boolean(pocketId),
  })
}

export function usePocketMonthBudget(pocketId: string, period: string) {
  return useQuery({
    queryKey: queryKeys.pocketBudgets.byMonth(pocketId, period),
    queryFn: () => initializePocketMonthBudget(pocketId, period),
    enabled: Boolean(pocketId && period),
  })
}

export function useCreatePocket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name }: { name: string }) => createPocketAction(name),
    onMutate: async ({ name }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pockets.all })
      const previous = queryClient.getQueryData<Pocket[]>(queryKeys.pockets.all)
      const optimisticPocket: Pocket = {
        id: `temp-${crypto.randomUUID()}`,
        name: name.trim(),
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData(queryKeys.pockets.all, (old: Pocket[] = []) => [
        ...old,
        optimisticPocket,
      ])
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.pockets.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pockets.all })
    },
  })
}

export function useRenamePocket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renamePocketAction(id, name),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pockets.all })
      const previous = queryClient.getQueryData<Pocket[]>(queryKeys.pockets.all)
      queryClient.setQueryData(queryKeys.pockets.all, (old: Pocket[] = []) =>
        old.map((pocket) =>
          pocket.id === id ? { ...pocket, name: name.trim() } : pocket
        )
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.pockets.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pockets.all })
    },
  })
}

export function useArchivePocket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string }) => archivePocketAction(id),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pockets.all })
      const previous = queryClient.getQueryData<Pocket[]>(queryKeys.pockets.all)
      queryClient.setQueryData(queryKeys.pockets.all, (old: Pocket[] = []) =>
        old.map((pocket) =>
          pocket.id === id
            ? { ...pocket, archivedAt: new Date().toISOString() }
            : pocket
        )
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.pockets.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pockets.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.pocketBudgets.byPocket(id),
      })
    },
  })
}

export function useSetPocketMonthBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pocketId, period, budget }: PocketMonthBudget) =>
      setPocketMonthBudgetAction(pocketId, period, budget),
    onMutate: async (nextBudget) => {
      const pocketBudgetKey = queryKeys.pocketBudgets.byPocket(
        nextBudget.pocketId
      )
      const monthBudgetKey = queryKeys.pocketBudgets.byMonth(
        nextBudget.pocketId,
        nextBudget.period
      )
      await queryClient.cancelQueries({ queryKey: pocketBudgetKey })
      await queryClient.cancelQueries({ queryKey: monthBudgetKey })
      const previousBudgets =
        queryClient.getQueryData<PocketMonthBudget[]>(pocketBudgetKey)
      const previousMonth = queryClient.getQueryData<PocketMonthBudget | null>(
        monthBudgetKey
      )
      queryClient.setQueryData<PocketMonthBudget[]>(pocketBudgetKey, (old) =>
        old?.map((budget) =>
          budget.period === nextBudget.period
            ? { ...budget, budget: nextBudget.budget }
            : budget
        )
      )
      queryClient.setQueryData<PocketMonthBudget | null>(
        monthBudgetKey,
        (old) => (old ? { ...old, budget: nextBudget.budget } : old)
      )
      return { pocketBudgetKey, monthBudgetKey, previousBudgets, previousMonth }
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(
          context.pocketBudgetKey,
          context.previousBudgets
        )
        queryClient.setQueryData(context.monthBudgetKey, context.previousMonth)
      }
      showMutationRollbackToast()
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pocketBudgets.byPocket(variables.pocketId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.pocketBudgets.byMonth(
          variables.pocketId,
          variables.period
        ),
      })
    },
  })
}
