'use client'

import {
  action,
  atom,
  notify,
  reatomPersistWebStorage,
  wrap,
} from '@reatom/core'
import { useSyncExternalStore } from 'react'

import {
  EMPTY_STATE,
  sanitizeCalculatorState,
  type CalculatorState,
} from '../lib/expression'

export const CALCULATOR_STORAGE_KEY = 'smartspend-calculator-v1'

/**
 * localStorage that never throws: unavailable storage, quota errors, and
 * unparsable records all read as "nothing saved".
 */
const safeStorage: Storage = {
  get length() {
    try {
      return globalThis.localStorage?.length ?? 0
    } catch {
      return 0
    }
  },
  key: (index) => {
    try {
      return globalThis.localStorage?.key(index) ?? null
    } catch {
      return null
    }
  },
  getItem: (key) => {
    try {
      const value = globalThis.localStorage?.getItem(key) ?? null
      if (value !== null) JSON.parse(value)
      return value
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      globalThis.localStorage?.setItem(key, value)
    } catch {
      // Storage full or blocked: keep the in-memory state only.
    }
  },
  removeItem: (key) => {
    try {
      globalThis.localStorage?.removeItem(key)
    } catch {
      // ignore
    }
  },
  clear: () => {},
}

/**
 * Creates the persisted calculator atom. Each call builds its own storage
 * adapter, so a new atom reads localStorage the way a page reload does.
 */
export function createCalculatorAtom(name = 'calculatorAtom') {
  const withCalculatorStorage = reatomPersistWebStorage(
    `calculator:${name}`,
    safeStorage
  )

  return atom<CalculatorState>(EMPTY_STATE, name).extend(
    withCalculatorStorage({
      key: CALCULATOR_STORAGE_KEY,
      fromSnapshot: (snapshot: unknown) => sanitizeCalculatorState(snapshot),
    })
  )
}

export const calculatorAtom = createCalculatorAtom()

const updateCalculatorAction = action(
  (update: (state: CalculatorState) => CalculatorState) => {
    const current = calculatorAtom()
    const next = update(current)
    if (next !== current) calculatorAtom.set(next)
  },
  'updateCalculator'
)

export function updateCalculator(
  update: (state: CalculatorState) => CalculatorState
): void {
  wrap(updateCalculatorAction)(update)
  // Flush subscribers now so a button press re-renders in the same event.
  wrap(notify)()
}

export function readCalculatorState(): CalculatorState {
  return wrap(() => calculatorAtom())()
}

const subscribe = (callback: () => void) => calculatorAtom.subscribe(callback)

export function useCalculatorState(): CalculatorState {
  return useSyncExternalStore(subscribe, readCalculatorState, () => EMPTY_STATE)
}
