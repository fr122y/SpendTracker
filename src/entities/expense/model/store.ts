import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Expense } from '@/shared/types'

interface ExpenseState {
  expenses: Expense[]
  addExpense: (expense: Expense) => void
  deleteExpense: (id: string) => void
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id'>>) => void
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      expenses: [],

      addExpense: (expense) =>
        set((state) => ({
          expenses: [...state.expenses, expense],
        })),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      updateExpense: (id, data) =>
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),
    }),
    {
      name: 'smartspend-expenses',
    }
  )
)
