'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getSettings,
  queryKeys,
  updateSettings as updateSettingsAction,
} from '@/shared/api'

import type { Settings } from '@/shared/api/settings-actions'

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
    },
  })
}

interface SettingsState {
  weeklyLimit: number
  salaryDay: number
  advanceDay: number
  salary: number
  setWeeklyLimit: (limit: number) => void
  setSalaryDay: (day: number) => void
  setAdvanceDay: (day: number) => void
  setSalary: (salary: number) => void
}

const DEFAULT_SETTINGS: Settings = {
  weeklyLimit: 10000,
  salaryDay: 10,
  advanceDay: 25,
  salary: 0,
}

export function useSettingsStore(): SettingsState
export function useSettingsStore<T>(selector: (state: SettingsState) => T): T
export function useSettingsStore<T>(selector?: (state: SettingsState) => T) {
  const { data } = useSettings()
  const updateSettings = useUpdateSettings()

  const settings = data ?? DEFAULT_SETTINGS

  const state: SettingsState = {
    weeklyLimit: settings.weeklyLimit,
    salaryDay: settings.salaryDay,
    advanceDay: settings.advanceDay,
    salary: settings.salary,
    setWeeklyLimit: (limit) => {
      updateSettings.mutate({ weeklyLimit: limit })
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
