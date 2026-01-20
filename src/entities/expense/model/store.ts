import { atom, action, wrap, withLocalStorage } from '@reatom/core'
import { useSyncExternalStore } from 'react'

import type { Expense } from '@/shared/types'

// Atoms with persistence
export const expensesAtom = atom<Expense[]>([], 'expensesAtom').extend(
  withLocalStorage('smartspend-expenses')
)

// Actions
export const addExpense = action((expense: Expense) => {
  const current = expensesAtom() ?? []
  expensesAtom.set([...current, expense])
}, 'addExpense')

export const deleteExpense = action((id: string) => {
  const current = expensesAtom() ?? []
  expensesAtom.set(current.filter((e) => e.id !== id))
}, 'deleteExpense')

export const updateExpense = action(
  (id: string, data: Partial<Omit<Expense, 'id'>>) => {
    const current = expensesAtom() ?? []
    expensesAtom.set(current.map((e) => (e.id === id ? { ...e, ...data } : e)))
  },
  'updateExpense'
)

// Store state type
interface ExpenseState {
  expenses: Expense[]
  addExpense: (expense: Expense) => void
  deleteExpense: (id: string) => void
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id'>>) => void
}

// Action wrappers (stable references)
const actionAddExpense = (expense: Expense) => wrap(addExpense)(expense)
const actionDeleteExpense = (id: string) => wrap(deleteExpense)(id)
const actionUpdateExpense = (id: string, data: Partial<Omit<Expense, 'id'>>) =>
  wrap(updateExpense)(id, data)

// Cached state for useSyncExternalStore
let cachedState: ExpenseState | null = null
let cachedExpenses: Expense[] | undefined
const EMPTY_EXPENSES: Expense[] = []

const getState = (): ExpenseState => {
  // Fallback to stable empty array during hydration when localStorage hasn't loaded yet
  const expenses = expensesAtom() ?? EMPTY_EXPENSES

  if (cachedState === null || cachedExpenses !== expenses) {
    cachedExpenses = expenses
    cachedState = {
      expenses,
      addExpense: actionAddExpense,
      deleteExpense: actionDeleteExpense,
      updateExpense: actionUpdateExpense,
    }
  }

  return cachedState
}

const subscribe = (callback: () => void) => {
  return expensesAtom.subscribe(callback)
}

// Adapter Hook (Matches old Zustand API with selector support)
export function useExpenseStore(): ExpenseState
export function useExpenseStore<T>(selector: (state: ExpenseState) => T): T
export function useExpenseStore<T>(selector?: (state: ExpenseState) => T) {
  const state = useSyncExternalStore(subscribe, getState, getState)

  if (selector) {
    return selector(state)
  }
  return state
}
