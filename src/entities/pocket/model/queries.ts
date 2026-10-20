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
  restorePocket as restorePocketAction,
  setPocketMonthBudget as setPocketMonthBudgetAction,
} from '@/shared/api'
import { showMutationRollbackToast } from '@/shared/lib'
import {
  createTempId,
  isPendingIdLostError,
  isTempId,
  replaceRecordId,
  resolveId,
  trackPendingId,
} from '@/shared/lib/pending-ids'

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
    // A pocket that is still being created has no budgets on the server.
    enabled: Boolean(pocketId) && !isTempId(pocketId),
  })
}

export function usePocketMonthBudget(pocketId: string, period: string) {
  return useQuery({
    queryKey: queryKeys.pocketBudgets.byMonth(pocketId, period),
    queryFn: () => initializePocketMonthBudget(pocketId, period),
    enabled: Boolean(pocketId && period) && !isTempId(pocketId),
  })
}

/**
 * Thrown by `useCreatePocket`, `useRenamePocket`, and `useRestorePocket` when
 * an active pocket already uses the name.
 */
export class PocketNameConflictError extends Error {
  constructor(readonly conflictingName: string) {
    super('Active pocket with the same name exists')
    this.name = 'PocketNameConflictError'
  }
}

export function useCreatePocket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const result = await createPocketAction(name)
      if (result.status === 'name_conflict') {
        throw new PocketNameConflictError(result.conflictingName)
      }
      return result.pocket
    },
    onMutate: async ({ name }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pockets.all })
      const previous = queryClient.getQueryData<Pocket[]>(queryKeys.pockets.all)
      const optimisticPocket: Pocket = {
        id: createTempId(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData(queryKeys.pockets.all, (old: Pocket[] = []) => [
        ...old,
        optimisticPocket,
      ])
      const pending = trackPendingId(optimisticPocket.id)
      return { previous, tempId: optimisticPocket.id, pending }
    },
    onSuccess: (pocket, _variables, context) => {
      const storedId = pocket?.id ?? context.tempId
      queryClient.setQueryData<Pocket[]>(queryKeys.pockets.all, (old) =>
        replaceRecordId(old, context.tempId, storedId)
      )
      context.pending.resolve(storedId)
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(queryKeys.pockets.all, context?.previous)
      context?.pending.reject()
      if (!(error instanceof PocketNameConflictError)) {
        showMutationRollbackToast()
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pockets.all })
    },
  })
}

export function useRenamePocket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const result = await renamePocketAction(await resolveId(id), name)
      if (result.status === 'name_conflict') {
        throw new PocketNameConflictError(result.conflictingName)
      }
      return result.status === 'renamed' ? result.pocket : undefined
    },
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
    onError: (error, _variables, context) => {
      if (isPendingIdLostError(error)) return
      queryClient.setQueryData(queryKeys.pockets.all, context?.previous)
      if (!(error instanceof PocketNameConflictError)) {
        showMutationRollbackToast()
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pockets.all })
    },
  })
}

export function useArchivePocket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) =>
      archivePocketAction(await resolveId(id)),
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
    onError: (error, _variables, context) => {
      if (isPendingIdLostError(error)) return
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

export function useRestorePocket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const result = await restorePocketAction(await resolveId(id))
      if (result.status === 'name_conflict') {
        throw new PocketNameConflictError(result.conflictingName)
      }
      return result.status === 'restored' ? result.pocket : undefined
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pockets.all })
      const previous = queryClient.getQueryData<Pocket[]>(queryKeys.pockets.all)
      queryClient.setQueryData(queryKeys.pockets.all, (old: Pocket[] = []) =>
        old.map((pocket) =>
          pocket.id === id ? { ...pocket, archivedAt: undefined } : pocket
        )
      )
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (isPendingIdLostError(error)) return
      queryClient.setQueryData(queryKeys.pockets.all, context?.previous)
      if (!(error instanceof PocketNameConflictError)) {
        showMutationRollbackToast()
      }
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
    mutationFn: async ({ pocketId, period, budget }: PocketMonthBudget) =>
      setPocketMonthBudgetAction(await resolveId(pocketId), period, budget),
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
    onError: (error, _variables, context) => {
      if (isPendingIdLostError(error)) return
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
