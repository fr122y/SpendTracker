import { atom, action, wrap } from '@reatom/core'
import { useSyncExternalStore } from 'react'

// Atoms
export const selectedDateAtom = atom(new Date(), 'selectedDateAtom')
export const viewDateAtom = atom(new Date(), 'viewDateAtom')

// Actions
export const setSelectedDate = action(
  (date: Date) => selectedDateAtom.set(date),
  'setSelectedDate'
)

export const setViewDate = action(
  (date: Date) => viewDateAtom.set(date),
  'setViewDate'
)

export const nextMonth = action(() => {
  const current = viewDateAtom()
  viewDateAtom.set(new Date(current.getFullYear(), current.getMonth() + 1, 1))
}, 'nextMonth')

export const prevMonth = action(() => {
  const current = viewDateAtom()
  viewDateAtom.set(new Date(current.getFullYear(), current.getMonth() - 1, 1))
}, 'prevMonth')

// Store state type
interface SessionState {
  selectedDate: Date
  viewDate: Date
  setSelectedDate: (date: Date) => void
  setViewDate: (date: Date) => void
  nextMonth: () => void
  prevMonth: () => void
}

// Stable action references
const actions = {
  setSelectedDate: (date: Date) => wrap(setSelectedDate)(date),
  setViewDate: (date: Date) => wrap(setViewDate)(date),
  nextMonth: () => wrap(nextMonth)(),
  prevMonth: () => wrap(prevMonth)(),
}

// Cached snapshot for useSyncExternalStore
let cachedState: SessionState | null = null
let cachedSelectedDate: Date | null = null
let cachedViewDate: Date | null = null

const getState = (): SessionState => {
  const currentSelectedDate = selectedDateAtom()
  const currentViewDate = viewDateAtom()

  if (
    cachedState === null ||
    cachedSelectedDate !== currentSelectedDate ||
    cachedViewDate !== currentViewDate
  ) {
    cachedSelectedDate = currentSelectedDate
    cachedViewDate = currentViewDate
    cachedState = {
      selectedDate: currentSelectedDate,
      viewDate: currentViewDate,
      ...actions,
    }
  }

  return cachedState
}

const subscribe = (callback: () => void) => {
  const unsub1 = selectedDateAtom.subscribe(() => {
    cachedState = null
    callback()
  })
  const unsub2 = viewDateAtom.subscribe(() => {
    cachedState = null
    callback()
  })
  return () => {
    unsub1()
    unsub2()
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
