import { atom, action, wrap, withLocalStorage } from '@reatom/core'
import { useSyncExternalStore } from 'react'

// Atoms with persistence
export const weeklyLimitAtom = atom(10000, 'weeklyLimitAtom').extend(
  withLocalStorage('smartspend-settings-weeklyLimit')
)

export const salaryDayAtom = atom(10, 'salaryDayAtom').extend(
  withLocalStorage('smartspend-settings-salaryDay')
)

export const advanceDayAtom = atom(25, 'advanceDayAtom').extend(
  withLocalStorage('smartspend-settings-advanceDay')
)

// Actions
export const setWeeklyLimit = action(
  (limit: number) => weeklyLimitAtom.set(limit),
  'setWeeklyLimit'
)

export const setSalaryDay = action(
  (day: number) => salaryDayAtom.set(day),
  'setSalaryDay'
)

export const setAdvanceDay = action(
  (day: number) => advanceDayAtom.set(day),
  'setAdvanceDay'
)

// Store state type
interface SettingsState {
  weeklyLimit: number
  salaryDay: number
  advanceDay: number
  setWeeklyLimit: (limit: number) => void
  setSalaryDay: (day: number) => void
  setAdvanceDay: (day: number) => void
}

// Action wrappers (stable references)
const actionSetWeeklyLimit = (limit: number) => wrap(setWeeklyLimit)(limit)
const actionSetSalaryDay = (day: number) => wrap(setSalaryDay)(day)
const actionSetAdvanceDay = (day: number) => wrap(setAdvanceDay)(day)

// Cached state for useSyncExternalStore (must be checked inline in getState)
let cachedState: SettingsState | null = null
let cachedWeeklyLimit: number | undefined
let cachedSalaryDay: number | undefined
let cachedAdvanceDay: number | undefined

const getState = (): SettingsState => {
  const weeklyLimit = weeklyLimitAtom()
  const salaryDay = salaryDayAtom()
  const advanceDay = advanceDayAtom()

  if (
    cachedState === null ||
    cachedWeeklyLimit !== weeklyLimit ||
    cachedSalaryDay !== salaryDay ||
    cachedAdvanceDay !== advanceDay
  ) {
    cachedWeeklyLimit = weeklyLimit
    cachedSalaryDay = salaryDay
    cachedAdvanceDay = advanceDay
    cachedState = {
      weeklyLimit,
      salaryDay,
      advanceDay,
      setWeeklyLimit: actionSetWeeklyLimit,
      setSalaryDay: actionSetSalaryDay,
      setAdvanceDay: actionSetAdvanceDay,
    }
  }

  return cachedState
}

const subscribe = (callback: () => void) => {
  const unsub1 = weeklyLimitAtom.subscribe(callback)
  const unsub2 = salaryDayAtom.subscribe(callback)
  const unsub3 = advanceDayAtom.subscribe(callback)
  return () => {
    unsub1()
    unsub2()
    unsub3()
  }
}

// Adapter Hook (Matches old Zustand API with selector support)
export function useSettingsStore(): SettingsState
export function useSettingsStore<T>(selector: (state: SettingsState) => T): T
export function useSettingsStore<T>(selector?: (state: SettingsState) => T) {
  const state = useSyncExternalStore(subscribe, getState, getState)

  if (selector) {
    return selector(state)
  }
  return state
}
