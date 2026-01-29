import { render, screen } from '@testing-library/react'

import { ExpenseLog } from '../ui/expense-log'

import type { Expense } from '@/shared/types'

// Mock data
let mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Coffee',
    amount: 250,
    date: '2026-01-23',
    category: 'Кафе',
    emoji: '☕',
  },
  {
    id: '2',
    description: 'Lunch',
    amount: 450,
    date: '2026-01-23',
    category: 'Еда',
    emoji: '🍽️',
  },
  {
    id: '3',
    description: 'Transport',
    amount: 100,
    date: '2026-01-23',
    category: 'Транспорт',
    emoji: '🚇',
  },
  {
    id: '4',
    description: 'Project expense',
    amount: 5000,
    date: '2026-01-23',
    category: 'Проект',
    emoji: '💼',
    projectId: 'project-123', // Should be filtered out
  },
  {
    id: '5',
    description: 'Yesterday expense',
    amount: 300,
    date: '2026-01-22',
    category: 'Разное',
    emoji: '📦',
  },
]

let mockSelectedDate = new Date(2026, 0, 23) // Jan 23, 2026
const mockDeleteExpense = jest.fn()

// Mock stores
jest.mock('@/entities/expense', () => ({
  useExpenseStore: (
    selector?: (state: {
      expenses: Expense[]
      deleteExpense: (id: string) => void
    }) => unknown
  ) => {
    const state = {
      expenses: mockExpenses,
      deleteExpense: mockDeleteExpense,
    }
    return selector ? selector(state) : state
  },
  ExpenseList: jest.fn(
    ({
      expenses,
      onDelete,
    }: {
      expenses: Expense[]
      onDelete: (id: string) => void
    }) => (
      <div data-testid="expense-list">
        <div data-testid="expense-count">{expenses.length}</div>
        <button onClick={() => onDelete('test-id')}>Delete Test</button>
      </div>
    )
  ),
}))

jest.mock('@/entities/session', () => ({
  useSessionStore: (selector?: (state: { selectedDate: Date }) => unknown) => {
    const state = { selectedDate: mockSelectedDate }
    return selector ? selector(state) : state
  },
}))

// Mock ExpenseForm component
jest.mock('@/features/add-expense', () => ({
  ExpenseForm: jest.fn(() => (
    <div data-testid="expense-form">Expense Form</div>
  )),
}))

// Mock shared lib functions
jest.mock('@/shared/lib', () => ({
  getDailyExpenses: jest.fn((expenses: Expense[], date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    return expenses.filter((expense) => expense.date === dateStr)
  }),
}))

describe('ExpenseLog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSelectedDate = new Date(2026, 0, 23) // Reset to Jan 23, 2026
    mockExpenses = [
      {
        id: '1',
        description: 'Coffee',
        amount: 250,
        date: '2026-01-23',
        category: 'Кафе',
        emoji: '☕',
      },
      {
        id: '2',
        description: 'Lunch',
        amount: 450,
        date: '2026-01-23',
        category: 'Еда',
        emoji: '🍽️',
      },
      {
        id: '3',
        description: 'Transport',
        amount: 100,
        date: '2026-01-23',
        category: 'Транспорт',
        emoji: '🚇',
      },
      {
        id: '4',
        description: 'Project expense',
        amount: 5000,
        date: '2026-01-23',
        category: 'Проект',
        emoji: '💼',
        projectId: 'project-123',
      },
      {
        id: '5',
        description: 'Yesterday expense',
        amount: 300,
        date: '2026-01-22',
        category: 'Разное',
        emoji: '📦',
      },
    ]
  })

  describe('rendering', () => {
    it('renders header with formatted date', () => {
      render(<ExpenseLog />)

      expect(screen.getByText(/Операции за 23 января 2026/)).toBeInTheDocument()
    })

    it('renders daily total amount', () => {
      render(<ExpenseLog />)

      // Total: 250 + 450 + 100 = 800 (excluding project expense)
      expect(screen.getByText(/800 ₽/)).toBeInTheDocument()
    })

    it('renders ExpenseForm component', () => {
      render(<ExpenseLog />)

      expect(screen.getByTestId('expense-form')).toBeInTheDocument()
    })

    it('renders ExpenseList component', () => {
      render(<ExpenseLog />)

      expect(screen.getByTestId('expense-list')).toBeInTheDocument()
    })

    it('applies correct container styling', () => {
      const { container } = render(<ExpenseLog />)

      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'gap-3')
    })
  })

  describe('date formatting', () => {
    it('formats January date correctly', () => {
      render(<ExpenseLog />)

      expect(screen.getByText(/23 января 2026/)).toBeInTheDocument()
    })

    it('formats date with correct Russian month name', () => {
      // Test with February
      mockSelectedDate = new Date(2026, 1, 15) // Feb 15, 2026

      render(<ExpenseLog />)

      expect(screen.getByText(/15 февраля 2026/)).toBeInTheDocument()
    })

    it('formats date with correct Russian month name for December', () => {
      // Test with December
      mockSelectedDate = new Date(2026, 11, 31) // Dec 31, 2026

      render(<ExpenseLog />)

      expect(screen.getByText(/31 декабря 2026/)).toBeInTheDocument()
    })
  })

  describe('expense filtering', () => {
    it('filters out expenses from other dates', () => {
      render(<ExpenseLog />)

      const expenseCount = screen.getByTestId('expense-count')
      // Should show 3 expenses (not including yesterday's expense)
      expect(expenseCount).toHaveTextContent('3')
    })

    it('filters out project expenses', () => {
      render(<ExpenseLog />)

      const expenseCount = screen.getByTestId('expense-count')
      // Should show 3 expenses (not including project expense)
      expect(expenseCount).toHaveTextContent('3')
    })

    it('calculates daily total excluding project expenses', () => {
      render(<ExpenseLog />)

      // Total should be 250 + 450 + 100 = 800 (not including 5000 project expense)
      expect(screen.getByText(/800 ₽/)).toBeInTheDocument()
      expect(screen.queryByText(/5800 ₽/)).not.toBeInTheDocument()
    })

    it('shows only expenses for selected date', () => {
      // Change selected date to yesterday
      mockSelectedDate = new Date(2026, 0, 22)

      render(<ExpenseLog />)

      const expenseCount = screen.getByTestId('expense-count')
      // Should show 1 expense (yesterday's expense)
      expect(expenseCount).toHaveTextContent('1')
    })
  })

  describe('daily total calculation', () => {
    it('calculates total for multiple expenses', () => {
      render(<ExpenseLog />)

      // 250 + 450 + 100 = 800
      expect(screen.getByText(/800 ₽/)).toBeInTheDocument()
    })

    it('shows zero when no expenses for the day', () => {
      mockExpenses = []
      render(<ExpenseLog />)

      expect(screen.getByText(/0 ₽/)).toBeInTheDocument()
    })

    it('formats large amounts with locale formatting', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Big purchase',
          amount: 125500,
          date: '2026-01-23',
          category: 'Покупки',
          emoji: '🛍️',
        },
      ]

      render(<ExpenseLog />)

      // Should format with Russian locale (space as thousands separator)
      expect(screen.getByText(/125 500 ₽/)).toBeInTheDocument()
    })

    it('handles single expense correctly', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Coffee',
          amount: 250,
          date: '2026-01-23',
          category: 'Кафе',
          emoji: '☕',
        },
      ]

      render(<ExpenseLog />)

      expect(screen.getByText(/250 ₽/)).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty message when no expenses for the day', () => {
      mockExpenses = []
      render(<ExpenseLog />)

      expect(screen.getByText('Нет операций за этот день')).toBeInTheDocument()
    })

    it('does not render ExpenseList when no expenses', () => {
      mockExpenses = []
      const { container } = render(<ExpenseLog />)

      expect(screen.queryByTestId('expense-list')).not.toBeInTheDocument()
      expect(container.innerHTML).toContain('Нет операций за этот день')
    })

    it('shows empty message when only project expenses exist', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Project expense',
          amount: 5000,
          date: '2026-01-23',
          category: 'Проект',
          emoji: '💼',
          projectId: 'project-123',
        },
      ]

      render(<ExpenseLog />)

      expect(screen.getByText('Нет операций за этот день')).toBeInTheDocument()
    })
  })

  describe('delete functionality', () => {
    it('passes deleteExpense function to ExpenseList', () => {
      render(<ExpenseLog />)

      const deleteButton = screen.getByText('Delete Test')
      deleteButton.click()

      expect(mockDeleteExpense).toHaveBeenCalledWith('test-id')
    })

    it('provides correct onDelete callback', () => {
      render(<ExpenseLog />)

      const deleteButton = screen.getByText('Delete Test')
      deleteButton.click()

      expect(mockDeleteExpense).toHaveBeenCalledTimes(1)
    })
  })

  describe('integration with stores', () => {
    it('reads expenses from expense store', () => {
      render(<ExpenseLog />)

      expect(screen.getByTestId('expense-list')).toBeInTheDocument()
      expect(screen.getByTestId('expense-count')).toHaveTextContent('3')
    })

    it('reads selected date from session store', () => {
      render(<ExpenseLog />)

      expect(screen.getByText(/23 января 2026/)).toBeInTheDocument()
    })

    it('reads deleteExpense action from expense store', () => {
      render(<ExpenseLog />)

      const deleteButton = screen.getByText('Delete Test')
      deleteButton.click()

      expect(mockDeleteExpense).toHaveBeenCalled()
    })
  })

  describe('ExpenseList integration', () => {
    it('passes filtered expenses to ExpenseList', () => {
      render(<ExpenseLog />)

      const expenseCount = screen.getByTestId('expense-count')
      expect(expenseCount).toHaveTextContent('3')
    })

    it('passes onDelete handler to ExpenseList', () => {
      render(<ExpenseLog />)

      const deleteButton = screen.getByText('Delete Test')
      expect(deleteButton).toBeInTheDocument()
    })
  })

  describe('scrollable container', () => {
    it('applies max-height and overflow styles to expense list container', () => {
      const { container } = render(<ExpenseLog />)

      const scrollContainer = container.querySelector('.max-h-\\[400px\\]')
      expect(scrollContainer).toBeInTheDocument()
      expect(scrollContainer).toHaveClass('overflow-y-auto')
    })
  })

  describe('edge cases', () => {
    it('handles expenses with decimal amounts', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Test',
          amount: 123.45,
          date: '2026-01-23',
          category: 'Тест',
          emoji: '🧪',
        },
      ]

      render(<ExpenseLog />)

      // JavaScript locale formatting should handle decimals
      expect(screen.getByText(/123\.45 ₽|123,45 ₽/)).toBeInTheDocument()
    })

    it('handles first day of month', () => {
      mockSelectedDate = new Date(2026, 0, 1)

      render(<ExpenseLog />)

      expect(screen.getByText(/1 января 2026/)).toBeInTheDocument()
    })

    it('handles last day of month', () => {
      mockSelectedDate = new Date(2026, 0, 31)

      render(<ExpenseLog />)

      expect(screen.getByText(/31 января 2026/)).toBeInTheDocument()
    })

    it('handles leap year February date', () => {
      mockSelectedDate = new Date(2024, 1, 29) // Feb 29, 2024 (leap year)

      render(<ExpenseLog />)

      expect(screen.getByText(/29 февраля 2024/)).toBeInTheDocument()
    })

    it('handles very large expense amounts', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Huge expense',
          amount: 9999999,
          date: '2026-01-23',
          category: 'Большая',
          emoji: '💰',
        },
      ]

      render(<ExpenseLog />)

      expect(screen.getByText(/9 999 999 ₽/)).toBeInTheDocument()
    })
  })

  describe('header styling', () => {
    it('applies correct text styling to header', () => {
      render(<ExpenseLog />)

      const header = screen.getByText(/Операции за/)
      expect(header).toHaveClass('text-base', 'font-medium', 'text-zinc-100')
    })

    it('applies correct styling to total amount', () => {
      render(<ExpenseLog />)

      const total = screen.getByText(/800 ₽/)
      expect(total).toHaveClass(
        'text-base',
        'font-semibold',
        'text-emerald-400'
      )
    })
  })

  describe('Russian locale', () => {
    it('displays all Russian month names correctly', () => {
      const months = [
        { month: 0, name: 'января' },
        { month: 1, name: 'февраля' },
        { month: 2, name: 'марта' },
        { month: 3, name: 'апреля' },
        { month: 4, name: 'мая' },
        { month: 5, name: 'июня' },
        { month: 6, name: 'июля' },
        { month: 7, name: 'августа' },
        { month: 8, name: 'сентября' },
        { month: 9, name: 'октября' },
        { month: 10, name: 'ноября' },
        { month: 11, name: 'декабря' },
      ]

      months.forEach(({ month, name }) => {
        mockSelectedDate = new Date(2026, month, 15)

        const { unmount } = render(<ExpenseLog />)

        expect(
          screen.getByText(new RegExp(`15 ${name} 2026`))
        ).toBeInTheDocument()

        unmount()
      })
    })

    it('uses Russian text for operations header', () => {
      render(<ExpenseLog />)

      expect(screen.getByText(/Операции за/)).toBeInTheDocument()
    })

    it('uses Russian text for empty state message', () => {
      mockExpenses = []
      render(<ExpenseLog />)

      expect(screen.getByText('Нет операций за этот день')).toBeInTheDocument()
    })
  })
})
