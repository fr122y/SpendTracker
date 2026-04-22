import { atom, action, wrap } from '@reatom/core'
import { useSyncExternalStore } from 'react'

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
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

// Actions
export const setSelectedDate = action(
  (date: Date) => selectedDateAtom.set(startOfDay(date)),
  'setSelectedDate'
)

export const nextDay = action(() => {
  selectedDateAtom.set(shiftDateByDays(selectedDateAtom(), 1))
}, 'nextDay')

export const prevDay = action(() => {
  selectedDateAtom.set(shiftDateByDays(selectedDateAtom(), -1))
}, 'prevDay')

export const nextMonth = action(() => {
  selectedDateAtom.set(shiftDateByMonths(selectedDateAtom(), 1))
}, 'nextMonth')

export const prevMonth = action(() => {
  selectedDateAtom.set(shiftDateByMonths(selectedDateAtom(), -1))
}, 'prevMonth')

export const setToday = action(() => {
  selectedDateAtom.set(startOfDay(new Date()))
}, 'setToday')

// Store state type
interface SessionState {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  nextDay: () => void
  prevDay: () => void
  nextMonth: () => void
  prevMonth: () => void
  setToday: () => void
}

// Stable action references
const actions = {
  setSelectedDate: (date: Date) => wrap(setSelectedDate)(date),
  nextDay: () => wrap(nextDay)(),
  prevDay: () => wrap(prevDay)(),
  nextMonth: () => wrap(nextMonth)(),
  prevMonth: () => wrap(prevMonth)(),
  setToday: () => wrap(setToday)(),
}

// Cached snapshot for useSyncExternalStore
let cachedState: SessionState | null = null
let cachedSelectedDate: Date | null = null

const getState = (): SessionState => {
  const currentSelectedDate = selectedDateAtom()

  if (cachedState === null || cachedSelectedDate !== currentSelectedDate) {
    cachedSelectedDate = currentSelectedDate
    cachedState = {
      selectedDate: currentSelectedDate,
      ...actions,
    }
  }

  return cachedState
}

const subscribe = (callback: () => void) => {
  const unsubscribe = selectedDateAtom.subscribe(() => {
    cachedState = null
    callback()
  })
  return () => unsubscribe()
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
