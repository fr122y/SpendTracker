import { render, screen, fireEvent } from '@testing-library/react'

import { DailySpendingChart } from '../ui/daily-spending-chart'

import type { Expense } from '@/shared/types'

// Mock query hooks with legacy aliases for the current component implementation
const mockSetSelectedDate = jest.fn()
let mockViewDate = new Date(2026, 0, 15) // January 15, 2026
let mockSelectedDate = new Date(2026, 0, 22) // January 22, 2026

const mockUseSessionStore = jest.fn()

jest.mock('@/entities/session', () => ({
  useSessionStore: (...args: unknown[]) => mockUseSessionStore(...args),
}))

let mockExpenses: Expense[] = []

jest.mock('@/entities/expense', () => ({
  useExpenses: () => ({ data: mockExpenses, isLoading: false }),
  useExpenseStore: (selector?: (state: { expenses: Expense[] }) => unknown) => {
    const state = { expenses: mockExpenses }
    return selector ? selector(state) : state
  },
}))

// Mock getMonthlyExpenses to use real implementation
jest.mock('@/shared/lib', () => {
  const actualLib = jest.requireActual('@/shared/lib')
  return {
    ...actualLib,
    getMonthlyExpenses: (expenses: Expense[], date: Date) => {
      const year = date.getFullYear()
      const month = date.getMonth()
      return expenses.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return (
          expenseDate.getFullYear() === year && expenseDate.getMonth() === month
        )
      })
    },
  }
})

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({
      children,
      data,
    }: {
      children: React.ReactNode
      data: unknown[]
    }) => (
      <div data-testid="bar-chart" data-items={data.length}>
        {children}
      </div>
    ),
    Bar: ({
      dataKey,
      onClick,
      children,
    }: {
      dataKey: string
      onClick: (data: unknown) => void
      children?: React.ReactNode
    }) => (
      <div
        data-testid={`bar-${dataKey}`}
        onClick={() =>
          onClick({ day: 15, amount: 5000, date: new Date(2026, 0, 15) })
        }
      >
        {children}
      </div>
    ),
    XAxis: () => <div data-testid="x-axis">XAxis</div>,
    YAxis: () => <div data-testid="y-axis">YAxis</div>,
    Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
    Cell: () => <div data-testid="cell">Cell</div>,
  }
})

describe('DailySpendingChart', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockExpenses = []
    mockViewDate = new Date(2026, 0, 15)
    mockSelectedDate = new Date(2026, 0, 22)

    // Set up the session store mock implementation
    mockUseSessionStore.mockImplementation(
      (
        selector?: (state: {
          viewDate: Date
          selectedDate: Date
          setSelectedDate: (date: Date) => void
        }) => unknown
      ) => {
        const state = {
          viewDate: mockViewDate,
          selectedDate: mockSelectedDate,
          setSelectedDate: mockSetSelectedDate,
        }
        return selector ? selector(state) : state
      }
    )
  })

  describe('rendering', () => {
    it('renders chart title with month and year', () => {
      render(<DailySpendingChart />)

      expect(screen.getByText('Динамика за Январь 2026')).toBeInTheDocument()
    })

    it('renders total monthly amount', () => {
      mockExpenses.push(
        {
          id: '1',
          description: 'Test expense 1',
          amount: 1000,
          date: '2026-01-15',
          category: 'Продукты',
          emoji: '🛒',
        },
        {
          id: '2',
          description: 'Test expense 2',
          amount: 2500,
          date: '2026-01-20',
          category: 'Транспорт',
          emoji: '🚗',
        }
      )

      render(<DailySpendingChart />)

      expect(screen.getByText('3 500 ₽')).toBeInTheDocument()
    })

    it('renders zero total when no expenses', () => {
      render(<DailySpendingChart />)

      expect(screen.getByText('0 ₽')).toBeInTheDocument()
    })

    it('renders chart components', () => {
      render(<DailySpendingChart />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    })
  })

  describe('data calculations', () => {
    it('aggregates expenses by day', () => {
      mockExpenses.push(
        {
          id: '1',
          description: 'Morning coffee',
          amount: 200,
          date: '2026-01-15',
          category: 'Еда',
          emoji: '☕',
        },
        {
          id: '2',
          description: 'Lunch',
          amount: 500,
          date: '2026-01-15',
          category: 'Еда',
          emoji: '🍔',
        },
        {
          id: '3',
          description: 'Dinner',
          amount: 800,
          date: '2026-01-15',
          category: 'Еда',
          emoji: '🍕',
        }
      )

      render(<DailySpendingChart />)

      // Total should be sum of all expenses
      expect(screen.getByText('1 500 ₽')).toBeInTheDocument()
    })

    it('creates data points for all days in month', () => {
      render(<DailySpendingChart />)

      const barChart = screen.getByTestId('bar-chart')
      // January 2026 has 31 days
      expect(barChart.getAttribute('data-items')).toBe('31')
    })

    it('handles expenses from different months correctly', () => {
      mockExpenses.push(
        {
          id: '1',
          description: 'January expense',
          amount: 1000,
          date: '2026-01-15',
          category: 'Продукты',
          emoji: '🛒',
        },
        {
          id: '2',
          description: 'February expense',
          amount: 2000,
          date: '2026-02-15',
          category: 'Продукты',
          emoji: '🛒',
        },
        {
          id: '3',
          description: 'December expense',
          amount: 3000,
          date: '2025-12-15',
          category: 'Продукты',
          emoji: '🛒',
        }
      )

      render(<DailySpendingChart />)

      // Should only show January expense
      expect(screen.getByText('1 000 ₽')).toBeInTheDocument()
    })

    it('formats large amounts with thousands separator', () => {
      mockExpenses.push({
        id: '1',
        description: 'Big purchase',
        amount: 125000,
        date: '2026-01-15',
        category: 'Техника',
        emoji: '💻',
      })

      render(<DailySpendingChart />)

      expect(screen.getByText('125 000 ₽')).toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('calls setSelectedDate when clicking a bar', () => {
      mockExpenses.push({
        id: '1',
        description: 'Test expense',
        amount: 1000,
        date: '2026-01-15',
        category: 'Продукты',
        emoji: '🛒',
      })

      render(<DailySpendingChart />)

      const bar = screen.getByTestId('bar-amount')
      fireEvent.click(bar)

      expect(mockSetSelectedDate).toHaveBeenCalled()
    })

    it('updates selected date to clicked day', () => {
      mockExpenses.push({
        id: '1',
        description: 'Test expense',
        amount: 1000,
        date: '2026-01-15',
        category: 'Продукты',
        emoji: '🛒',
      })

      render(<DailySpendingChart />)

      const bar = screen.getByTestId('bar-amount')
      fireEvent.click(bar)

      // Check that setSelectedDate was called with a Date object
      expect(mockSetSelectedDate).toHaveBeenCalledWith(expect.any(Date))
    })
  })

  describe('month names', () => {
    it('displays Январь for January', () => {
      mockViewDate = new Date(2026, 0, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Январь 2026')).toBeInTheDocument()
    })

    it('displays Февраль for February', () => {
      mockViewDate = new Date(2026, 1, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Февраль 2026')).toBeInTheDocument()
    })

    it('displays Декабрь for December', () => {
      mockViewDate = new Date(2026, 11, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Декабрь 2026')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles empty expenses array', () => {
      render(<DailySpendingChart />)

      expect(screen.getByText('0 ₽')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    it('handles month with 28 days (February non-leap year)', () => {
      mockViewDate = new Date(2026, 1, 15) // February 2026
      mockSelectedDate = new Date(2026, 1, 15)

      render(<DailySpendingChart />)

      const barChart = screen.getByTestId('bar-chart')
      // February 2026 has 28 days (not a leap year)
      expect(barChart.getAttribute('data-items')).toBe('28')
    })

    it('handles month with 29 days (February leap year)', () => {
      mockViewDate = new Date(2024, 1, 15) // February 2024 (leap year)
      mockSelectedDate = new Date(2024, 1, 15)

      render(<DailySpendingChart />)

      const barChart = screen.getByTestId('bar-chart')
      // February 2024 has 29 days (leap year)
      expect(barChart.getAttribute('data-items')).toBe('29')
    })

    it('handles month with 30 days', () => {
      mockViewDate = new Date(2026, 3, 15) // April 2026
      mockSelectedDate = new Date(2026, 3, 15)

      render(<DailySpendingChart />)

      const barChart = screen.getByTestId('bar-chart')
      // April has 30 days
      expect(barChart.getAttribute('data-items')).toBe('30')
    })

    it('handles expenses with decimal amounts', () => {
      mockExpenses.push({
        id: '1',
        description: 'Coffee',
        amount: 99.99,
        date: '2026-01-15',
        category: 'Еда',
        emoji: '☕',
      })

      render(<DailySpendingChart />)

      expect(screen.getByText('99,99 ₽')).toBeInTheDocument()
    })

    it('handles zero amount expenses', () => {
      mockExpenses.push({
        id: '1',
        description: 'Free item',
        amount: 0,
        date: '2026-01-15',
        category: 'Другое',
        emoji: '🎁',
      })

      render(<DailySpendingChart />)

      expect(screen.getByText('0 ₽')).toBeInTheDocument()
    })

    it('handles multiple expenses on the last day of month', () => {
      mockExpenses.push(
        {
          id: '1',
          description: 'Expense 1',
          amount: 500,
          date: '2026-01-31',
          category: 'Продукты',
          emoji: '🛒',
        },
        {
          id: '2',
          description: 'Expense 2',
          amount: 1500,
          date: '2026-01-31',
          category: 'Транспорт',
          emoji: '🚗',
        }
      )

      render(<DailySpendingChart />)

      expect(screen.getByText('2 000 ₽')).toBeInTheDocument()
    })

    it('handles expenses with projectId', () => {
      mockExpenses.push({
        id: '1',
        description: 'Project expense',
        amount: 5000,
        date: '2026-01-15',
        category: 'Проект',
        emoji: '💼',
        projectId: 'project-123',
      })

      render(<DailySpendingChart />)

      expect(screen.getByText('5 000 ₽')).toBeInTheDocument()
    })
  })

  describe('year display', () => {
    it('displays year 2024', () => {
      mockViewDate = new Date(2024, 0, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Январь 2024')).toBeInTheDocument()
    })

    it('displays year 2025', () => {
      mockViewDate = new Date(2025, 0, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Январь 2025')).toBeInTheDocument()
    })

    it('displays year 2027', () => {
      mockViewDate = new Date(2027, 0, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Январь 2027')).toBeInTheDocument()
    })
  })
})
