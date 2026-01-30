import { act, renderHook, waitFor } from '@testing-library/react'

import { useExpenseStore, expensesAtom } from '../model/store'

import type { Expense } from '@/shared/types'

describe('useExpenseStore', () => {
  beforeEach(() => {
    expensesAtom.set([])
  })

  describe('Initial State', () => {
    it('should have empty expenses array by default', () => {
      const { result } = renderHook(() => useExpenseStore())

      expect(result.current.expenses).toHaveLength(0)
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

  describe('Business Logic', () => {
    it('should support finding expense by id', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'e1',
          description: 'Расход 1',
          amount: 100,
          date: '2024-01-15',
          category: 'Еда',
          emoji: '🍔',
        })
        result.current.addExpense({
          id: 'e2',
          description: 'Расход 2',
          amount: 200,
          date: '2024-01-16',
          category: 'Транспорт',
          emoji: '🚕',
        })
      })

      await waitFor(() => {
        const expense = result.current.expenses.find((e) => e.id === 'e2')
        expect(expense?.description).toBe('Расход 2')
        expect(expense?.amount).toBe(200)
      })
    })

    it('should support filtering expenses by category', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'e1',
          description: 'Обед',
          amount: 500,
          date: '2024-01-15',
          category: 'Еда',
          emoji: '🍔',
        })
        result.current.addExpense({
          id: 'e2',
          description: 'Такси',
          amount: 300,
          date: '2024-01-16',
          category: 'Транспорт',
          emoji: '🚕',
        })
        result.current.addExpense({
          id: 'e3',
          description: 'Завтрак',
          amount: 200,
          date: '2024-01-17',
          category: 'Еда',
          emoji: '🍳',
        })
      })

      await waitFor(() => {
        const foodExpenses = result.current.expenses.filter(
          (e) => e.category === 'Еда'
        )
        expect(foodExpenses).toHaveLength(2)
        expect(foodExpenses[0].id).toBe('e1')
        expect(foodExpenses[1].id).toBe('e3')
      })
    })

    it('should calculate total amount across all expenses', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'e1',
          description: 'Обед',
          amount: 500,
          date: '2024-01-15',
          category: 'Еда',
          emoji: '🍔',
        })
        result.current.addExpense({
          id: 'e2',
          description: 'Такси',
          amount: 300,
          date: '2024-01-16',
          category: 'Транспорт',
          emoji: '🚕',
        })
        result.current.addExpense({
          id: 'e3',
          description: 'Кино',
          amount: 700,
          date: '2024-01-17',
          category: 'Развлечения',
          emoji: '🎬',
        })
      })

      await waitFor(() => {
        const totalAmount = result.current.expenses.reduce(
          (sum, e) => sum + e.amount,
          0
        )
        expect(totalAmount).toBe(1500)
      })
    })

    it('should filter expenses by projectId', async () => {
      const { result } = renderHook(() => useExpenseStore())

      act(() => {
        result.current.addExpense({
          id: 'e1',
          description: 'Материалы',
          amount: 5000,
          date: '2024-01-15',
          category: 'Ремонт',
          emoji: '🔨',
          projectId: 'project-1',
        })
        result.current.addExpense({
          id: 'e2',
          description: 'Обед',
          amount: 500,
          date: '2024-01-16',
          category: 'Еда',
          emoji: '🍔',
        })
        result.current.addExpense({
          id: 'e3',
          description: 'Инструменты',
          amount: 3000,
          date: '2024-01-17',
          category: 'Ремонт',
          emoji: '🔧',
          projectId: 'project-1',
        })
      })

      await waitFor(() => {
        const projectExpenses = result.current.expenses.filter(
          (e) => e.projectId === 'project-1'
        )
        expect(projectExpenses).toHaveLength(2)
        expect(projectExpenses[0].id).toBe('e1')
        expect(projectExpenses[1].id).toBe('e3')
      })
    })

    it('should preserve all expense data through add operation', async () => {
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
})
