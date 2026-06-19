import { atom, action, wrap } from '@reatom/core'
import { useSyncExternalStore } from 'react'

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isSameCalendarDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function shiftDateByDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function shiftDateByMonths(date: Date, months: number) {
  const targetYear = date.getFullYear()
  const targetMonth = date.getMonth() + months
  const targetDay = Math.min(
    date.getDate(),
    getDaysInMonth(targetYear, targetMonth)
  )

  return new Date(targetYear, targetMonth, targetDay)
}

export function setDateMonth(date: Date, year: number, month: number) {
  const targetDay = Math.min(date.getDate(), getDaysInMonth(year, month))
  return new Date(year, month, targetDay)
}

// Atoms
export const selectedDateAtom = atom(startOfDay(new Date()), 'selectedDateAtom')
export const isFollowingTodayAtom = atom(true, 'isFollowingTodayAtom')

// Actions
export const setSelectedDate = action((date: Date) => {
  selectedDateAtom.set(startOfDay(date))
  isFollowingTodayAtom.set(false)
}, 'setSelectedDate')

export const nextDay = action(() => {
  selectedDateAtom.set(shiftDateByDays(selectedDateAtom(), 1))
  isFollowingTodayAtom.set(false)
}, 'nextDay')

export const prevDay = action(() => {
  selectedDateAtom.set(shiftDateByDays(selectedDateAtom(), -1))
  isFollowingTodayAtom.set(false)
}, 'prevDay')

export const nextMonth = action(() => {
  selectedDateAtom.set(shiftDateByMonths(selectedDateAtom(), 1))
  isFollowingTodayAtom.set(false)
}, 'nextMonth')

export const prevMonth = action(() => {
  selectedDateAtom.set(shiftDateByMonths(selectedDateAtom(), -1))
  isFollowingTodayAtom.set(false)
}, 'prevMonth')

export const setToday = action(() => {
  selectedDateAtom.set(startOfDay(new Date()))
  isFollowingTodayAtom.set(true)
}, 'setToday')

export const syncTodayIfFollowing = action(() => {
  if (!isFollowingTodayAtom()) return

  const today = startOfDay(new Date())
  if (isSameCalendarDay(selectedDateAtom(), today)) return

  selectedDateAtom.set(today)
}, 'syncTodayIfFollowing')

// Store state type
interface SessionState {
  selectedDate: Date
  isFollowingToday: boolean
  setSelectedDate: (date: Date) => void
  nextDay: () => void
  prevDay: () => void
  nextMonth: () => void
  prevMonth: () => void
  setToday: () => void
  syncTodayIfFollowing: () => void
}

// Stable action references
const actions = {
  setSelectedDate: (date: Date) => wrap(setSelectedDate)(date),
  nextDay: () => wrap(nextDay)(),
  prevDay: () => wrap(prevDay)(),
  nextMonth: () => wrap(nextMonth)(),
  prevMonth: () => wrap(prevMonth)(),
  setToday: () => wrap(setToday)(),
  syncTodayIfFollowing: () => wrap(syncTodayIfFollowing)(),
}

// Cached snapshot for useSyncExternalStore
let cachedState: SessionState | null = null
let cachedSelectedDate: Date | null = null
let cachedIsFollowingToday: boolean | null = null

const getState = (): SessionState => {
  const currentSelectedDate = selectedDateAtom()
  const currentIsFollowingToday = isFollowingTodayAtom()

  if (
    cachedState === null ||
    cachedSelectedDate !== currentSelectedDate ||
    cachedIsFollowingToday !== currentIsFollowingToday
  ) {
    cachedSelectedDate = currentSelectedDate
    cachedIsFollowingToday = currentIsFollowingToday
    cachedState = {
      selectedDate: currentSelectedDate,
      isFollowingToday: currentIsFollowingToday,
      ...actions,
    }
  }

  return cachedState
}

const subscribe = (callback: () => void) => {
  const resetCacheAndNotify = () => {
    cachedState = null
    callback()
  }
  const unsubscribeSelectedDate =
    selectedDateAtom.subscribe(resetCacheAndNotify)
  const unsubscribeIsFollowingToday =
    isFollowingTodayAtom.subscribe(resetCacheAndNotify)

  return () => {
    unsubscribeSelectedDate()
    unsubscribeIsFollowingToday()
  }
}

// Adapter Hook (Matches old Zustand API with selector support)
export function useSessionStore(): SessionState
export function useSessionStore<T>(selector: (state: SessionState) => T): T
export function useSessionStore<T>(selector?: (state: SessionState) => T) {
  const state = useSyncExternalStore(subscribe, getState, getState)

  if (selector) {
    return selector(state)
  }
  return state
}
