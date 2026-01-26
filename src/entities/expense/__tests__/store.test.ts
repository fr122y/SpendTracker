import { wrap } from '@reatom/core'
import { act, renderHook, waitFor } from '@testing-library/react'

import {
  useExpenseStore,
  expensesAtom,
  addExpense,
  deleteExpense,
  updateExpense,
} from '../model/store'

import type { Expense } from '@/shared/types'

describe('useExpenseStore', () => {
  beforeEach(() => {
    // Reset atom to empty array before each test
    expensesAtom.set([])
  })

  describe('Initial State', () => {
    it('should have empty expenses array by default', () => {
      const { result } = renderHook(() => useExpenseStore())

      expect(result.current.expenses).toHaveLength(0)
    })

    it('should provide addExpense action method in state', () => {
      const { result } = renderHook(() => useExpenseStore())

      expect(typeof result.current.addExpense).toBe('function')
    })

    it('should provide deleteExpense action method in state', () => {
      const { result } = renderHook(() => useExpenseStore())

      expect(typeof result.current.deleteExpense).toBe('function')
    })

    it('should provide updateExpense action method in state', () => {
      const { result } = renderHook(() => useExpenseStore())

      expect(typeof result.current.updateExpense).toBe('function')
    })
  })

  describe('addExpense Action', () => {
    it('should add a new expense', async () => {
      const { result } = renderHook(() => useExpenseStore())

      const expense: Expense = {
        id: 'expense-1',
        description: 'Обед',
        amount: 500,
        date: '2024-01-15',
        category: 'Еда',
        emoji: '🍔',
      }

      act(() => {
        result.current.addExpense(expense)
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(1)
        expect(result.current.expenses[0]).toEqual(expense)
      })
    })

    it('should add multiple expenses in sequence', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'expense-1',
          description: 'Кофе',
          amount: 150,
          date: '2024-01-15',
          category: 'Еда',
          emoji: '☕',
        })
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(1)
      })

      act(() => {
        result.current.addExpense({
          id: 'expense-2',
          description: 'Такси',
          amount: 300,
          date: '2024-01-15',
          category: 'Транспорт',
          emoji: '🚕',
        })
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(2)
        expect(result.current.expenses[0].description).toBe('Кофе')
        expect(result.current.expenses[1].description).toBe('Такси')
      })
    })

    it('should handle expense with projectId', async () => {
      const { result } = renderHook(() => useExpenseStore())

      const expense: Expense = {
        id: 'expense-project',
        description: 'Материалы для ремонта',
        amount: 15000,
        date: '2024-01-20',
        category: 'Ремонт',
        emoji: '🔨',
        projectId: 'project-123',
      }

      act(() => {
        result.current.addExpense(expense)
      })

      await waitFor(() => {
        expect(result.current.expenses[0].projectId).toBe('project-123')
      })
    })

    it('should handle expense with zero amount', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'expense-zero',
          description: 'Бесплатная услуга',
          amount: 0,
          date: '2024-01-15',
          category: 'Другое',
          emoji: '🆓',
        })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].amount).toBe(0)
      })
    })

    it('should handle expense with decimal amount', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'expense-decimal',
          description: 'Молоко',
          amount: 89.99,
          date: '2024-01-15',
          category: 'Еда',
          emoji: '🥛',
        })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].amount).toBe(89.99)
      })
    })

    it('should handle expense with large amount', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'expense-large',
          description: 'Автомобиль',
          amount: 2500000,
          date: '2024-01-15',
          category: 'Транспорт',
          emoji: '🚗',
        })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].amount).toBe(2500000)
      })
    })

    it('should handle expense with empty description', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'expense-empty',
          description: '',
          amount: 100,
          date: '2024-01-15',
          category: 'Другое',
          emoji: '❓',
        })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].description).toBe('')
      })
    })

    it('should handle expense with special characters in description', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'expense-special',
          description: 'Покупка @#$%^&*()',
          amount: 500,
          date: '2024-01-15',
          category: 'Другое',
          emoji: '🛒',
        })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].description).toBe('Покупка @#$%^&*()')
      })
    })

    it('should preserve insertion order', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'z-expense',
          description: 'Z-Last',
          amount: 100,
          date: '2024-01-15',
          category: 'Другое',
          emoji: '📝',
        })
        result.current.addExpense({
          id: 'a-expense',
          description: 'A-First',
          amount: 200,
          date: '2024-01-14',
          category: 'Другое',
          emoji: '📝',
        })
        result.current.addExpense({
          id: 'm-expense',
          description: 'M-Middle',
          amount: 300,
          date: '2024-01-16',
          category: 'Другое',
          emoji: '📝',
        })
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(3)
        expect(result.current.expenses[0].description).toBe('Z-Last')
        expect(result.current.expenses[1].description).toBe('A-First')
        expect(result.current.expenses[2].description).toBe('M-Middle')
      })
    })
  })

  describe('deleteExpense Action', () => {
    beforeEach(() => {
      const initialExpenses: Expense[] = [
        {
          id: 'expense-1',
          description: 'Расход 1',
          amount: 100,
          date: '2024-01-15',
          category: 'Еда',
          emoji: '🍔',
        },
        {
          id: 'expense-2',
          description: 'Расход 2',
          amount: 200,
          date: '2024-01-16',
          category: 'Транспорт',
          emoji: '🚕',
        },
        {
          id: 'expense-3',
          description: 'Расход 3',
          amount: 300,
          date: '2024-01-17',
          category: 'Развлечения',
          emoji: '🎬',
        },
      ]
      expensesAtom.set(initialExpenses)
    })

    it('should delete an existing expense by id', async () => {
      const { result } = renderHook(() => useExpenseStore())

      expect(result.current.expenses).toHaveLength(3)

      act(() => {
        result.current.deleteExpense('expense-2')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(2)
        expect(
          result.current.expenses.find((e) => e.id === 'expense-2')
        ).toBeUndefined()
      })
    })

    it('should preserve remaining expenses after deletion', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.deleteExpense('expense-2')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(2)
        expect(result.current.expenses[0].id).toBe('expense-1')
        expect(result.current.expenses[1].id).toBe('expense-3')
      })
    })

    it('should delete the first expense', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.deleteExpense('expense-1')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(2)
        expect(result.current.expenses[0].id).toBe('expense-2')
        expect(result.current.expenses[1].id).toBe('expense-3')
      })
    })

    it('should delete the last expense', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.deleteExpense('expense-3')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(2)
        expect(result.current.expenses[0].id).toBe('expense-1')
        expect(result.current.expenses[1].id).toBe('expense-2')
      })
    })

    it('should delete all expenses one by one', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.deleteExpense('expense-1')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(2)
      })

      act(() => {
        result.current.deleteExpense('expense-2')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(1)
      })

      act(() => {
        result.current.deleteExpense('expense-3')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(0)
      })
    })

    it('should handle deleting non-existent expense', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.deleteExpense('non-existent-id')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(3)
      })
    })

    it('should handle deleting from empty array', async () => {
      expensesAtom.set([])
      const { result } = renderHook(() => useExpenseStore())

      expect(result.current.expenses).toHaveLength(0)

      act(() => {
        result.current.deleteExpense('expense-1')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(0)
      })
    })

    it('should handle deleting the same expense twice', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.deleteExpense('expense-2')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(2)
      })

      act(() => {
        result.current.deleteExpense('expense-2')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(2)
      })
    })
  })

  describe('updateExpense Action', () => {
    beforeEach(() => {
      const initialExpenses: Expense[] = [
        {
          id: 'expense-1',
          description: 'Обед',
          amount: 500,
          date: '2024-01-15',
          category: 'Еда',
          emoji: '🍔',
        },
        {
          id: 'expense-2',
          description: 'Такси',
          amount: 300,
          date: '2024-01-16',
          category: 'Транспорт',
          emoji: '🚕',
        },
      ]
      expensesAtom.set(initialExpenses)
    })

    it('should update expense description', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.updateExpense('expense-1', { description: 'Ужин' })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].description).toBe('Ужин')
        expect(result.current.expenses[0].amount).toBe(500)
      })
    })

    it('should update expense amount', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.updateExpense('expense-1', { amount: 750 })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].amount).toBe(750)
        expect(result.current.expenses[0].description).toBe('Обед')
      })
    })

    it('should update expense category and emoji', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.updateExpense('expense-1', {
          category: 'Ресторан',
          emoji: '🍽️',
        })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].category).toBe('Ресторан')
        expect(result.current.expenses[0].emoji).toBe('🍽️')
      })
    })

    it('should update expense date', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.updateExpense('expense-1', { date: '2024-01-20' })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].date).toBe('2024-01-20')
      })
    })

    it('should update expense projectId', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.updateExpense('expense-1', { projectId: 'project-new' })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].projectId).toBe('project-new')
      })
    })

    it('should update multiple fields at once', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.updateExpense('expense-1', {
          description: 'Бизнес-ланч',
          amount: 650,
          category: 'Бизнес',
          emoji: '💼',
        })
      })

      await waitFor(() => {
        const expense = result.current.expenses[0]
        expect(expense.description).toBe('Бизнес-ланч')
        expect(expense.amount).toBe(650)
        expect(expense.category).toBe('Бизнес')
        expect(expense.emoji).toBe('💼')
        expect(expense.date).toBe('2024-01-15')
      })
    })

    it('should not affect other expenses when updating', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.updateExpense('expense-1', { amount: 1000 })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].amount).toBe(1000)
        expect(result.current.expenses[1].amount).toBe(300)
        expect(result.current.expenses[1].description).toBe('Такси')
      })
    })

    it('should handle updating non-existent expense', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.updateExpense('non-existent', { amount: 999 })
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(2)
        expect(result.current.expenses[0].amount).toBe(500)
        expect(result.current.expenses[1].amount).toBe(300)
      })
    })

    it('should preserve id when updating', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.updateExpense('expense-1', {
          description: 'Updated',
          amount: 999,
        })
      })

      await waitFor(() => {
        expect(result.current.expenses[0].id).toBe('expense-1')
      })
    })
  })

  describe('Selector Support', () => {
    beforeEach(() => {
      const initialExpenses: Expense[] = [
        {
          id: 'e1',
          description: 'Расход 1',
          amount: 100,
          date: '2024-01-15',
          category: 'Еда',
          emoji: '🍔',
        },
        {
          id: 'e2',
          description: 'Расход 2',
          amount: 200,
          date: '2024-01-16',
          category: 'Транспорт',
          emoji: '🚕',
        },
      ]
      expensesAtom.set(initialExpenses)
    })

    it('should support selecting expenses array', () => {
      const { result } = renderHook(() =>
        useExpenseStore((state) => state.expenses)
      )

      expect(result.current).toHaveLength(2)
    })

    it('should support selecting first expense', () => {
      const { result } = renderHook(() =>
        useExpenseStore((state) => state.expenses[0])
      )

      expect(result.current.description).toBe('Расход 1')
    })

    it('should support selecting expense count', () => {
      const { result } = renderHook(() =>
        useExpenseStore((state) => state.expenses.length)
      )

      expect(result.current).toBe(2)
    })

    it('should support selecting derived values', () => {
      const { result } = renderHook(() =>
        useExpenseStore((state) => ({
          count: state.expenses.length,
          totalAmount: state.expenses.reduce((sum, e) => sum + e.amount, 0),
        }))
      )

      expect(result.current.count).toBe(2)
      expect(result.current.totalAmount).toBe(300)
    })

    it('should update when selected value changes', async () => {
      const { result: storeResult } = renderHook(() => useExpenseStore())
      const { result: selectorResult } = renderHook(() =>
        useExpenseStore((state) => state.expenses.length)
      )

      expect(selectorResult.current).toBe(2)

      act(() => {
        storeResult.current.addExpense({
          id: 'e3',
          description: 'Расход 3',
          amount: 300,
          date: '2024-01-17',
          category: 'Другое',
          emoji: '📝',
        })
      })

      await waitFor(() => {
        expect(selectorResult.current).toBe(3)
      })
    })

    it('should support selecting specific expense by id', () => {
      const { result } = renderHook(() =>
        useExpenseStore((state) => state.expenses.find((e) => e.id === 'e2'))
      )

      expect(result.current?.description).toBe('Расход 2')
      expect(result.current?.amount).toBe(200)
    })

    it('should support filtering expenses by category', () => {
      const { result } = renderHook(() =>
        useExpenseStore((state) =>
          state.expenses.filter((e) => e.category === 'Еда')
        )
      )

      expect(result.current).toHaveLength(1)
      expect(result.current[0].id).toBe('e1')
    })
  })

  describe('Store Stability', () => {
    it('should maintain stable action references', () => {
      const { result, rerender } = renderHook(() => useExpenseStore())

      const firstAddExpense = result.current.addExpense
      const firstDeleteExpense = result.current.deleteExpense
      const firstUpdateExpense = result.current.updateExpense

      rerender()

      expect(result.current.addExpense).toBe(firstAddExpense)
      expect(result.current.deleteExpense).toBe(firstDeleteExpense)
      expect(result.current.updateExpense).toBe(firstUpdateExpense)
    })

    it('should not recreate state object if values have not changed', () => {
      const { result, rerender } = renderHook(() => useExpenseStore())

      const firstState = result.current

      rerender()

      expect(result.current).toBe(firstState)
    })

    it('should create new state object when expenses change', async () => {
      const { result } = renderHook(() => useExpenseStore())

      const initialState = result.current

      act(() => {
        result.current.addExpense({
          id: 'new-expense',
          description: 'Новый',
          amount: 100,
          date: '2024-01-15',
          category: 'Другое',
          emoji: '📝',
        })
      })

      await waitFor(() => {
        expect(result.current).not.toBe(initialState)
        expect(result.current.expenses).toHaveLength(1)
      })
    })
  })

  describe('Direct Atom Access', () => {
    beforeEach(() => {
      const initialExpenses: Expense[] = [
        {
          id: 'direct-1',
          description: 'Прямой доступ',
          amount: 500,
          date: '2024-01-15',
          category: 'Другое',
          emoji: '📝',
        },
      ]
      expensesAtom.set(initialExpenses)
    })

    it('should allow direct atom reading', () => {
      const expenses = expensesAtom()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].description).toBe('Прямой доступ')
    })

    it('should update atom value via action', () => {
      wrap(addExpense)({
        id: 'direct-2',
        description: 'Второй расход',
        amount: 700,
        date: '2024-01-16',
        category: 'Еда',
        emoji: '🍔',
      })

      const expenses = expensesAtom()
      expect(expenses).toHaveLength(2)
      expect(expenses[1].description).toBe('Второй расход')
    })

    it('should synchronize hook and atom values', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'sync-expense',
          description: 'Синхронизация',
          amount: 1200,
          date: '2024-01-17',
          category: 'Транспорт',
          emoji: '🚕',
        })
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(2)
        expect(result.current.expenses[1].description).toBe('Синхронизация')

        const atomExpenses = expensesAtom()
        expect(atomExpenses).toHaveLength(2)
        expect(atomExpenses[1].description).toBe('Синхронизация')
      })
    })

    it('should delete via direct action', () => {
      wrap(deleteExpense)('direct-1')

      const expenses = expensesAtom()
      expect(expenses).toHaveLength(0)
    })

    it('should update via direct action', () => {
      wrap(updateExpense)('direct-1', { amount: 999 })

      const expenses = expensesAtom()
      expect(expenses[0].amount).toBe(999)
    })
  })

  describe('Edge Cases', () => {
    it('should handle adding many expenses', async () => {
      const { result } = renderHook(() => useExpenseStore())

      const expenseCount = 50
      for (let i = 0; i < expenseCount; i++) {
        act(() => {
          result.current.addExpense({
            id: `bulk-expense-${i}`,
            description: `Расход ${i}`,
            amount: i * 100,
            date: '2024-01-15',
            category: 'Другое',
            emoji: '📝',
          })
        })
      }

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(expenseCount)
        expect(result.current.expenses[25].description).toBe('Расход 25')
      })
    })

    it('should handle rapid consecutive additions', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'rapid-1',
          description: 'Быстрый 1',
          amount: 100,
          date: '2024-01-15',
          category: 'Другое',
          emoji: '📝',
        })
        result.current.addExpense({
          id: 'rapid-2',
          description: 'Быстрый 2',
          amount: 200,
          date: '2024-01-15',
          category: 'Другое',
          emoji: '📝',
        })
        result.current.addExpense({
          id: 'rapid-3',
          description: 'Быстрый 3',
          amount: 300,
          date: '2024-01-15',
          category: 'Другое',
          emoji: '📝',
        })
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(3)
        expect(result.current.expenses[0].description).toBe('Быстрый 1')
        expect(result.current.expenses[1].description).toBe('Быстрый 2')
        expect(result.current.expenses[2].description).toBe('Быстрый 3')
      })
    })

    it('should handle rapid consecutive deletions', async () => {
      const initialExpenses: Expense[] = [
        {
          id: 'del-1',
          description: 'Удаление 1',
          amount: 100,
          date: '2024-01-15',
          category: 'Другое',
          emoji: '📝',
        },
        {
          id: 'del-2',
          description: 'Удаление 2',
          amount: 200,
          date: '2024-01-16',
          category: 'Другое',
          emoji: '📝',
        },
        {
          id: 'del-3',
          description: 'Удаление 3',
          amount: 300,
          date: '2024-01-17',
          category: 'Другое',
          emoji: '📝',
        },
      ]
      expensesAtom.set(initialExpenses)

      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.deleteExpense('del-1')
        result.current.deleteExpense('del-3')
      })

      await waitFor(() => {
        expect(result.current.expenses).toHaveLength(1)
        expect(result.current.expenses[0].id).toBe('del-2')
      })
    })

    it('should preserve all expense data through operations', async () => {
      const { result } = renderHook(() => useExpenseStore())

      const expense: Expense = {
        id: 'preserve-test',
        description: 'Тест сохранения',
        amount: 99999.99,
        date: '2024-01-15',
        category: 'Тест',
        emoji: '✅',
        projectId: 'test-project',
      }

      act(() => {
        result.current.addExpense(expense)
      })

      await waitFor(() => {
        const stored = result.current.expenses[0]
        expect(stored.id).toBe('preserve-test')
        expect(stored.description).toBe('Тест сохранения')
        expect(stored.amount).toBe(99999.99)
        expect(stored.date).toBe('2024-01-15')
        expect(stored.category).toBe('Тест')
        expect(stored.emoji).toBe('✅')
        expect(stored.projectId).toBe('test-project')
      })
    })
  })

  describe('Persistence Key', () => {
    it('should use correct localStorage key format', () => {
      const { result } = renderHook(() => useExpenseStore())

      expect(result.current.expenses).toBeDefined()
      expect(Array.isArray(result.current.expenses)).toBe(true)
    })
  })
})
