'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getSettings,
  queryKeys,
  setWeeklyLimitForWeek as setWeeklyLimitForWeekAction,
  updateSettings as updateSettingsAction,
} from '@/shared/api'
import {
  getEffectiveWeeklyLimit,
  getWeekBoundaries,
  showMutationRollbackToast,
} from '@/shared/lib'

import type { Settings } from '@/shared/api/settings-actions'
import type { WeeklyLimitSetting } from '@/shared/lib'

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: getSettings,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Settings>) => updateSettingsAction(data),
    onMutate: async (partialData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings.all })
      const previous = queryClient.getQueryData<Settings>(
        queryKeys.settings.all
      )
      queryClient.setQueryData(
        queryKeys.settings.all,
        (old: Settings | undefined) => (old ? { ...old, ...partialData } : old)
      )
      return { previous }
    },
    onError: (_error, _partialData, context) => {
      queryClient.setQueryData(queryKeys.settings.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
    },
  })
}

interface SetWeeklyLimitForWeekInput {
  effectiveWeekStart: string
  amount: number
}

function upsertWeeklyLimit(
  weeklyLimits: WeeklyLimitSetting[],
  nextLimit: WeeklyLimitSetting
): WeeklyLimitSetting[] {
  const withoutCurrent = weeklyLimits.filter(
    (limit) => limit.effectiveWeekStart !== nextLimit.effectiveWeekStart
  )

  return [...withoutCurrent, nextLimit].sort((a, b) =>
    a.effectiveWeekStart.localeCompare(b.effectiveWeekStart)
  )
}

export function useSetWeeklyLimitForWeek() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ effectiveWeekStart, amount }: SetWeeklyLimitForWeekInput) =>
      setWeeklyLimitForWeekAction(effectiveWeekStart, amount),
    onMutate: async (nextLimit) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings.all })
      const previous = queryClient.getQueryData<Settings>(
        queryKeys.settings.all
      )

      queryClient.setQueryData(
        queryKeys.settings.all,
        (old: Settings | undefined) => {
          if (!old) return old

          const weeklyLimits = upsertWeeklyLimit(old.weeklyLimits, {
            effectiveWeekStart: nextLimit.effectiveWeekStart,
            amount: nextLimit.amount,
          })

          return {
            ...old,
            weeklyLimit: getEffectiveWeeklyLimit(
              weeklyLimits,
              new Date(),
              old.weeklyLimit
            ),
            weeklyLimits,
          }
        }
      )

      return { previous }
    },
    onError: (_error, _nextLimit, context) => {
      queryClient.setQueryData(queryKeys.settings.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
    },
  })
}

interface SettingsState {
  weeklyLimit: number
  weeklyLimits: WeeklyLimitSetting[]
  salaryDay: number
  advanceDay: number
  salary: number
  isLoading: boolean
  setWeeklyLimit: (limit: number) => void
  setWeeklyLimitForDate: (date: Date, limit: number) => void
  getWeeklyLimitForDate: (date: Date) => number
  setSalaryDay: (day: number) => void
  setAdvanceDay: (day: number) => void
  setSalary: (salary: number) => void
}

const DEFAULT_SETTINGS: Settings = {
  weeklyLimit: 10000,
  weeklyLimits: [{ effectiveWeekStart: '1970-01-05', amount: 10000 }],
  salaryDay: 10,
  advanceDay: 25,
  salary: 0,
}

export function useSettingsStore(): SettingsState
export function useSettingsStore<T>(selector: (state: SettingsState) => T): T
export function useSettingsStore<T>(selector?: (state: SettingsState) => T) {
  const { data, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const setWeeklyLimitForWeek = useSetWeeklyLimitForWeek()

  const settings = data ?? DEFAULT_SETTINGS
  const currentWeeklyLimit = getEffectiveWeeklyLimit(
    settings.weeklyLimits,
    new Date(),
    settings.weeklyLimit
  )

  const state: SettingsState = {
    weeklyLimit: currentWeeklyLimit,
    weeklyLimits: settings.weeklyLimits,
    salaryDay: settings.salaryDay,
    advanceDay: settings.advanceDay,
    salary: settings.salary,
    isLoading,
    setWeeklyLimit: (limit) => {
      const effectiveWeekStart = getWeekBoundaries(new Date()).start
      setWeeklyLimitForWeek.mutate({ effectiveWeekStart, amount: limit })
    },
    setWeeklyLimitForDate: (date, limit) => {
      const effectiveWeekStart = getWeekBoundaries(date).start
      setWeeklyLimitForWeek.mutate({ effectiveWeekStart, amount: limit })
    },
    getWeeklyLimitForDate: (date) => {
      return getEffectiveWeeklyLimit(
        settings.weeklyLimits,
        date,
        settings.weeklyLimit
      )
    },
    setSalaryDay: (day) => {
      updateSettings.mutate({ salaryDay: day })
    },
    setAdvanceDay: (day) => {
      updateSettings.mutate({ advanceDay: day })
    },
    setSalary: (salary) => {
      updateSettings.mutate({ salary })
    },
  }

  if (selector) {
    return selector(state)
  }

  return state
}
