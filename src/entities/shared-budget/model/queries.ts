'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveSharedBudget as archiveSharedBudgetAction,
  createSharedBudget as createSharedBudgetAction,
  createSharedBudgetInvite as createSharedBudgetInviteAction,
  getSharedBudgets,
  queryKeys,
  setActiveSharedBudget as setActiveSharedBudgetAction,
  setSharedWeeklyLimitForWeek as setSharedWeeklyLimitForWeekAction,
} from '@/shared/api'
import {
  getEffectiveWeeklyLimit,
  showMutationRollbackToast,
} from '@/shared/lib'
import {
  createTempId,
  isPendingIdLostError,
  replaceRecordId,
  resolveId,
  trackPendingId,
} from '@/shared/lib/pending-ids'

import type {
  CreateSharedBudgetInput,
  SharedBudget,
  SharedBudgetInviteResult,
} from '@/shared/types'

interface SetSharedWeeklyLimitForWeekInput {
  sharedBudgetId: string
  effectiveWeekStart: string
  amount: number
}

function upsertSharedWeeklyLimit(
  budget: SharedBudget,
  effectiveWeekStart: string,
  amount: number
): SharedBudget {
  const weeklyLimits = budget.weeklyLimits
    .filter((limit) => limit.effectiveWeekStart !== effectiveWeekStart)
    .concat({ effectiveWeekStart, amount })
    .sort((a, b) => a.effectiveWeekStart.localeCompare(b.effectiveWeekStart))

  return { ...budget, weeklyLimits }
}

export function getActiveSharedBudget(
  budgets: SharedBudget[]
): SharedBudget | undefined {
  return budgets.find((budget) => !budget.archivedAt && budget.isActive)
}

export function getEffectiveSharedWeeklyLimit(
  budget: SharedBudget,
  date: Date
): number {
  return getEffectiveWeeklyLimit(budget.weeklyLimits, date, 0)
}

export function useSharedBudgets() {
  return useQuery({
    queryKey: queryKeys.sharedBudgets.all,
    queryFn: getSharedBudgets,
  })
}

export function useCreateSharedBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSharedBudgetInput) =>
      createSharedBudgetAction(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sharedBudgets.all })
      const previous = queryClient.getQueryData<SharedBudget[]>(
        queryKeys.sharedBudgets.all
      )
      const now = new Date().toISOString()
      const optimisticBudget: SharedBudget = {
        id: createTempId(),
        name: data.name.trim(),
        createdByUserId: 'current-user',
        createdAt: now,
        role: 'owner',
        isActive: true,
        members: [],
        weeklyLimits: [
          {
            effectiveWeekStart: data.effectiveWeekStart,
            amount: data.initialWeeklyLimit,
          },
        ],
      }

      queryClient.setQueryData(
        queryKeys.sharedBudgets.all,
        (old: SharedBudget[] = []) => [
          ...old.map((budget) => ({ ...budget, isActive: false })),
          optimisticBudget,
        ]
      )

      const pending = trackPendingId(optimisticBudget.id)
      return { previous, tempId: optimisticBudget.id, pending }
    },
    onSuccess: (budget, _data, context) => {
      const storedId = budget?.id ?? context.tempId
      queryClient.setQueryData<SharedBudget[]>(
        queryKeys.sharedBudgets.all,
        (old) => replaceRecordId(old, context.tempId, storedId)
      )
      context.pending.resolve(storedId)
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(queryKeys.sharedBudgets.all, context?.previous)
      context?.pending.reject()
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedBudgets.all })
    },
  })
}

export function useSetActiveSharedBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sharedBudgetId: string) =>
      setActiveSharedBudgetAction(await resolveId(sharedBudgetId)),
    onMutate: async (sharedBudgetId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sharedBudgets.all })
      const previous = queryClient.getQueryData<SharedBudget[]>(
        queryKeys.sharedBudgets.all
      )

      queryClient.setQueryData(
        queryKeys.sharedBudgets.all,
        (old: SharedBudget[] = []) =>
          old.map((budget) => ({
            ...budget,
            isActive: budget.id === sharedBudgetId,
          }))
      )

      return { previous }
    },
    onError: (error, _id, context) => {
      if (isPendingIdLostError(error)) return
      queryClient.setQueryData(queryKeys.sharedBudgets.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedBudgets.all })
    },
  })
}

export function useSetSharedWeeklyLimitForWeek() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sharedBudgetId,
      effectiveWeekStart,
      amount,
    }: SetSharedWeeklyLimitForWeekInput) =>
      setSharedWeeklyLimitForWeekAction(
        await resolveId(sharedBudgetId),
        effectiveWeekStart,
        amount
      ),
    onMutate: async ({ sharedBudgetId, effectiveWeekStart, amount }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sharedBudgets.all })
      const previous = queryClient.getQueryData<SharedBudget[]>(
        queryKeys.sharedBudgets.all
      )

      queryClient.setQueryData(
        queryKeys.sharedBudgets.all,
        (old: SharedBudget[] = []) =>
          old.map((budget) =>
            budget.id === sharedBudgetId
              ? upsertSharedWeeklyLimit(budget, effectiveWeekStart, amount)
              : budget
          )
      )

      return { previous }
    },
    onError: (error, _data, context) => {
      if (isPendingIdLostError(error)) return
      queryClient.setQueryData(queryKeys.sharedBudgets.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedBudgets.all })
    },
  })
}

export function useArchiveSharedBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sharedBudgetId: string) =>
      archiveSharedBudgetAction(await resolveId(sharedBudgetId)),
    onMutate: async (sharedBudgetId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sharedBudgets.all })
      const previous = queryClient.getQueryData<SharedBudget[]>(
        queryKeys.sharedBudgets.all
      )
      const archivedAt = new Date().toISOString()

      queryClient.setQueryData(
        queryKeys.sharedBudgets.all,
        (old: SharedBudget[] = []) =>
          old.map((budget) =>
            budget.id === sharedBudgetId
              ? { ...budget, archivedAt, isActive: false }
              : budget
          )
      )

      return { previous }
    },
    onError: (error, _id, context) => {
      if (isPendingIdLostError(error)) return
      queryClient.setQueryData(queryKeys.sharedBudgets.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedBudgets.all })
    },
  })
}

export function useCreateSharedBudgetInvite() {
  return useMutation<SharedBudgetInviteResult, Error, string>({
    mutationFn: async (sharedBudgetId) =>
      createSharedBudgetInviteAction(await resolveId(sharedBudgetId)),
    onError: (error) => {
      if (!isPendingIdLostError(error)) showMutationRollbackToast()
    },
  })
}
