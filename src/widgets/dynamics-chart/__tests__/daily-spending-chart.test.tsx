import { render, screen, fireEvent } from '@testing-library/react'

import { DailySpendingChart } from '../ui/daily-spending-chart'

import type { Expense } from '@/shared/types'

// Mock query hooks with legacy aliases for the current component implementation
const mockSetSelectedDate = jest.fn()
let mockSelectedDate = new Date(2026, 0, 22) // January 22, 2026

const mockUseSessionStore = jest.fn()

jest.mock('@/entities/session', () => ({
  useSessionStore: (...args: unknown[]) => mockUseSessionStore(...args),
}))

let mockExpenses: Expense[] = []
let mockIsLoading = false

jest.mock('@/entities/expense', () => ({
  useExpenses: () => ({ data: mockExpenses, isLoading: false }),
  useExpenseStore: (
    selector?: (state: { expenses: Expense[]; isLoading: boolean }) => unknown
  ) => {
    const state = { expenses: mockExpenses, isLoading: mockIsLoading }
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
          onClick({
            day: 15,
            amount: 5000,
            personalAmount: 3000,
            projectAmount: 2000,
            date: new Date(2026, 0, 15),
          })
        }
      >
        {children}
      </div>
    ),
    XAxis: ({ ticks = [] }: { ticks?: number[] }) => (
      <div data-testid="x-axis" data-ticks={ticks.join(',')}>
        XAxis
      </div>
    ),
    YAxis: () => <div data-testid="y-axis">YAxis</div>,
    Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
    ReferenceLine: ({ x }: { x: number }) => (
      <div data-testid="dynamics-week-start" data-x={x} />
    ),
    ReferenceArea: ({ x1, x2 }: { x1: number; x2: number }) => (
      <div data-testid="dynamics-weekend-area" data-x1={x1} data-x2={x2} />
    ),
    Cell: () => <div data-testid="cell">Cell</div>,
  }
})

describe('DailySpendingChart', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsLoading = false
    mockExpenses = []
    mockSelectedDate = new Date(2026, 0, 22)

    // Set up the session store mock implementation
    mockUseSessionStore.mockImplementation(
      (
        selector?: (state: {
          selectedDate: Date
          setSelectedDate: (date: Date) => void
        }) => unknown
      ) => {
        const state = {
          selectedDate: mockSelectedDate,
          setSelectedDate: mockSetSelectedDate,
        }
        return selector ? selector(state) : state
      }
    )
  })

  describe('rendering', () => {
    it('renders skeleton while expenses are loading', () => {
      mockIsLoading = true

      render(<DailySpendingChart />)

      expect(
        screen.getByTestId('daily-spending-chart-skeleton')
      ).toBeInTheDocument()
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
    })

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

      expect(screen.getByTestId('dynamics-header-total')).toHaveTextContent(
        '3 500 ₽'
      )
    })

    it('renders zero total when no expenses', () => {
      render(<DailySpendingChart />)

      expect(screen.getByTestId('dynamics-header-total')).toHaveTextContent(
        '0 ₽'
      )
    })

    it('renders chart components', () => {
      render(<DailySpendingChart />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
      expect(screen.getByTestId('bar-personalAmount')).toBeInTheDocument()
      expect(screen.getByTestId('bar-projectAmount')).toBeInTheDocument()
    })

    it('renders sparse x-axis ticks for month edges and Mondays', () => {
      render(<DailySpendingChart />)

      expect(screen.getByTestId('x-axis')).toHaveAttribute(
        'data-ticks',
        '1,5,12,19,26,31'
      )
    })

    it('renders week start markers for Mondays after the first day', () => {
      render(<DailySpendingChart />)

      const markers = screen.getAllByTestId('dynamics-week-start')
      expect(markers.map((marker) => marker.getAttribute('data-x'))).toEqual([
        '4.5',
        '11.5',
        '18.5',
        '25.5',
      ])
    })

    it('renders weekend background spans', () => {
      render(<DailySpendingChart />)

      const areas = screen.getAllByTestId('dynamics-weekend-area')
      expect(
        areas.map((area) => [
          area.getAttribute('data-x1'),
          area.getAttribute('data-x2'),
        ])
      ).toEqual([
        ['2.5', '4.5'],
        ['9.5', '11.5'],
        ['16.5', '18.5'],
        ['23.5', '25.5'],
        ['30.5', '31.5'],
      ])
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
      expect(screen.getByTestId('dynamics-header-total')).toHaveTextContent(
        '1 500 ₽'
      )
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
      expect(screen.getByTestId('dynamics-header-total')).toHaveTextContent(
        '1 000 ₽'
      )
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

      expect(screen.getByTestId('dynamics-header-total')).toHaveTextContent(
        '125 000 ₽'
      )
    })

    it('renders monthly personal and project breakdown', () => {
      mockExpenses.push(
        {
          id: '1',
          description: 'Personal expense',
          amount: 1000,
          date: '2026-01-15',
          category: 'Продукты',
          emoji: '🛒',
        },
        {
          id: '2',
          description: 'Project expense',
          amount: 2500,
          date: '2026-01-20',
          category: 'Проект',
          emoji: '💼',
          projectId: 'project-1',
        }
      )

      render(<DailySpendingChart />)

      expect(screen.getByTestId('dynamics-header-personal')).toHaveTextContent(
        'Личные: 1 000 ₽'
      )
      expect(screen.getByTestId('dynamics-header-project')).toHaveTextContent(
        'Проекты: 2 500 ₽'
      )
      expect(screen.getByTestId('dynamics-header-total')).toHaveTextContent(
        '3 500 ₽'
      )
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

      const bar = screen.getByTestId('bar-personalAmount')
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

      const bar = screen.getByTestId('bar-projectAmount')
      fireEvent.click(bar)

      // Check that setSelectedDate was called with a Date object
      expect(mockSetSelectedDate).toHaveBeenCalledWith(expect.any(Date))
    })
  })

  describe('month names', () => {
    it('displays Январь for January', () => {
      mockSelectedDate = new Date(2026, 0, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Январь 2026')).toBeInTheDocument()
    })

    it('displays Февраль for February', () => {
      mockSelectedDate = new Date(2026, 1, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Февраль 2026')).toBeInTheDocument()
    })

    it('displays Декабрь for December', () => {
      mockSelectedDate = new Date(2026, 11, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Декабрь 2026')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles empty expenses array', () => {
      render(<DailySpendingChart />)

      expect(screen.getByTestId('dynamics-header-total')).toHaveTextContent(
        '0 ₽'
      )
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    it('handles month with 28 days (February non-leap year)', () => {
      mockSelectedDate = new Date(2026, 1, 15) // February 2026
      mockSelectedDate = new Date(2026, 1, 15)

      render(<DailySpendingChart />)

      const barChart = screen.getByTestId('bar-chart')
      // February 2026 has 28 days (not a leap year)
      expect(barChart.getAttribute('data-items')).toBe('28')
    })

    it('handles month with 29 days (February leap year)', () => {
      mockSelectedDate = new Date(2024, 1, 15) // February 2024 (leap year)
      mockSelectedDate = new Date(2024, 1, 15)

      render(<DailySpendingChart />)

      const barChart = screen.getByTestId('bar-chart')
      // February 2024 has 29 days (leap year)
      expect(barChart.getAttribute('data-items')).toBe('29')
    })

    it('handles month with 30 days', () => {
      mockSelectedDate = new Date(2026, 3, 15) // April 2026
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

      expect(screen.getByTestId('dynamics-header-total')).toHaveTextContent(
        '99,99 ₽'
      )
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

      expect(screen.getByTestId('dynamics-header-total')).toHaveTextContent(
        '0 ₽'
      )
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

      expect(screen.getByTestId('dynamics-header-total')).toHaveTextContent(
        '2 000 ₽'
      )
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

      expect(screen.getByTestId('dynamics-header-total')).toHaveTextContent(
        '5 000 ₽'
      )
      expect(screen.getByTestId('dynamics-header-project')).toHaveTextContent(
        'Проекты: 5 000 ₽'
      )
    })
  })

  describe('year display', () => {
    it('displays year 2024', () => {
      mockSelectedDate = new Date(2024, 0, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Январь 2024')).toBeInTheDocument()
    })

    it('displays year 2025', () => {
      mockSelectedDate = new Date(2025, 0, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Январь 2025')).toBeInTheDocument()
    })

    it('displays year 2027', () => {
      mockSelectedDate = new Date(2027, 0, 15)
      render(<DailySpendingChart />)
      expect(screen.getByText('Динамика за Январь 2027')).toBeInTheDocument()
    })
  })
})
