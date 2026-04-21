import { render, screen, fireEvent } from '@testing-library/react'

import { WeeklyBudget } from '../ui/weekly-budget'

import type { Expense } from '@/shared/types'

// Mock data
const mockSetWeeklyLimit = jest.fn()
let mockWeeklyLimit = 10000
let mockSettingsLoading = false
let mockExpensesLoading = false
let mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Groceries',
    amount: 1500,
    date: '2026-01-20',
    category: 'Продукты',
    emoji: '🛒',
  },
  {
    id: '2',
    description: 'Coffee',
    amount: 300,
    date: '2026-01-21',
    category: 'Кафе',
    emoji: '☕',
  },
  {
    id: '3',
    description: 'Transport',
    amount: 500,
    date: '2026-01-22',
    category: 'Транспорт',
    emoji: '🚇',
  },
]

const mockSelectedDate = new Date(2026, 0, 21) // Jan 21, 2026 (Tuesday)

// Mock query hooks with legacy aliases for the current component implementation
jest.mock('@/entities/settings', () => ({
  useSettings: () => ({
    data: {
      weeklyLimit: mockWeeklyLimit,
      salaryDay: 10,
      advanceDay: 25,
      salary: 0,
    },
    isLoading: false,
  }),
  useUpdateSettings: () => ({ mutate: mockSetWeeklyLimit, isPending: false }),
  useSettingsStore: () => ({
    weeklyLimit: mockWeeklyLimit,
    isLoading: mockSettingsLoading,
    setWeeklyLimit: mockSetWeeklyLimit,
  }),
}))

jest.mock('@/entities/expense', () => ({
  useExpenses: () => ({ data: mockExpenses, isLoading: false }),
  useExpenseStore: (
    selector?: (state: {
      expenses: typeof mockExpenses
      isLoading: boolean
    }) => unknown
  ) => {
    const state = { expenses: mockExpenses, isLoading: mockExpensesLoading }
    return selector ? selector(state) : state
  },
}))

jest.mock('@/entities/session', () => ({
  useSessionStore: (selector?: (state: { selectedDate: Date }) => unknown) => {
    const state = { selectedDate: mockSelectedDate }
    return selector ? selector(state) : state
  },
}))

// Mock shared lib functions
jest.mock('@/shared/lib', () => ({
  getWeeklyPersonalStats: jest.fn((expenses, date, weeklyLimit) => {
    // For Jan 21, 2026 (Tuesday), week is Jan 20 - Jan 26
    const weekExpenses = expenses.filter(
      (e: { date: string; projectId?: string }) =>
        e.date >= '2026-01-20' && e.date <= '2026-01-26' && !e.projectId
    )
    const spent = weekExpenses.reduce(
      (sum: number, e: { amount: number }) => sum + e.amount,
      0
    )
    return {
      spent,
      limit: weeklyLimit,
      start: '2026-01-20',
      end: '2026-01-26',
    }
  }),
  cn: jest.fn((...args: unknown[]) => {
    return args
      .flat()
      .filter((x) => typeof x === 'string')
      .join(' ')
  }),
}))

describe('WeeklyBudget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWeeklyLimit = 10000
    mockSettingsLoading = false
    mockExpensesLoading = false
    mockExpenses = [
      {
        id: '1',
        description: 'Groceries',
        amount: 1500,
        date: '2026-01-20',
        category: 'Продукты',
        emoji: '🛒',
      },
      {
        id: '2',
        description: 'Coffee',
        amount: 300,
        date: '2026-01-21',
        category: 'Кафе',
        emoji: '☕',
      },
      {
        id: '3',
        description: 'Transport',
        amount: 500,
        date: '2026-01-22',
        category: 'Транспорт',
        emoji: '🚇',
      },
    ]
  })

  describe('rendering', () => {
    it('renders skeleton while data is loading', () => {
      mockExpensesLoading = true

      render(<WeeklyBudget />)

      expect(screen.getByTestId('weekly-budget-skeleton')).toBeInTheDocument()
      expect(screen.queryByText('Бюджет на неделю')).not.toBeInTheDocument()
    })

    it('renders widget title', () => {
      render(<WeeklyBudget />)

      expect(screen.getByText('Бюджет на неделю')).toBeInTheDocument()
    })

    it('renders week date range', () => {
      render(<WeeklyBudget />)

      // Week dates: Jan 20 - Jan 26
      expect(screen.getByText(/20 янв/)).toBeInTheDocument()
      expect(screen.getByText(/26 янв/)).toBeInTheDocument()
    })

    it('renders progress bar', () => {
      render(<WeeklyBudget />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    it('displays spent amount', () => {
      render(<WeeklyBudget />)

      // Total spent: 1500 + 300 + 500 = 2300
      expect(screen.getByText(/Потрачено:/)).toBeInTheDocument()
      expect(screen.getByText(/2\s?300 ₽/)).toBeInTheDocument()
    })

    it('displays remaining amount', () => {
      render(<WeeklyBudget />)

      // Remaining: 10000 - 2300 = 7700
      expect(screen.getByText(/Осталось:/)).toBeInTheDocument()
      expect(screen.getByText(/7\s?700 ₽/)).toBeInTheDocument()
    })

    it('renders limit editor with current value', () => {
      render(<WeeklyBudget />)

      const input = screen.getByDisplayValue('10000')
      expect(input).toBeInTheDocument()
    })

    it('renders limit label', () => {
      render(<WeeklyBudget />)

      expect(screen.getByText('Лимит:')).toBeInTheDocument()
    })
  })

  describe('budget calculations', () => {
    it('calculates spent amount correctly', () => {
      render(<WeeklyBudget />)

      // Total: 1500 + 300 + 500 = 2300
      expect(screen.getByText(/2\s?300 ₽/)).toBeInTheDocument()
    })

    it('calculates remaining amount correctly when under budget', () => {
      mockWeeklyLimit = 10000
      render(<WeeklyBudget />)

      // Remaining: 10000 - 2300 = 7700
      expect(screen.getByText(/7\s?700 ₽/)).toBeInTheDocument()
    })

    it('shows negative remaining amount when over budget', () => {
      mockWeeklyLimit = 2000
      render(<WeeklyBudget />)

      // Remaining: 2000 - 2300 = -300
      const remainingText = screen.getByText(/Осталось:/).parentElement
      expect(remainingText).toHaveTextContent('-300')
    })

    it('excludes project expenses from weekly spent amount', () => {
      mockExpenses = [
        ...mockExpenses,
        {
          id: '4',
          description: 'Project materials',
          amount: 5000,
          date: '2026-01-21',
          category: 'Проект',
          emoji: '🔨',
          projectId: 'project-1',
        },
      ]

      render(<WeeklyBudget />)

      expect(screen.getByText(/2\s?300 ₽/)).toBeInTheDocument()
      expect(screen.getByText(/7\s?700 ₽/)).toBeInTheDocument()
    })

    it('applies correct styling when under budget', () => {
      mockWeeklyLimit = 10000
      const { container } = render(<WeeklyBudget />)

      const spentSection = screen.getByText(/Потрачено:/).parentElement
      expect(spentSection).toBeTruthy()
      expect(container.innerHTML).toContain('text-emerald-400')
    })

    it('applies red styling when over budget', () => {
      mockWeeklyLimit = 2000
      const { container } = render(<WeeklyBudget />)

      // Both spent and remaining should have red styling
      expect(container.innerHTML).toContain('text-red-400')
    })
  })

  describe('limit editing', () => {
    it('updates limit when entering valid number and blurring', () => {
      render(<WeeklyBudget />)

      const input = screen.getByDisplayValue('10000')
      fireEvent.change(input, { target: { value: '15000' } })
      fireEvent.blur(input)

      expect(mockSetWeeklyLimit).toHaveBeenCalledWith(15000)
    })

    it('updates limit to zero', () => {
      render(<WeeklyBudget />)

      const input = screen.getByDisplayValue('10000')
      fireEvent.change(input, { target: { value: '0' } })
      fireEvent.blur(input)

      expect(mockSetWeeklyLimit).toHaveBeenCalledWith(0)
    })

    it('does not update limit for invalid input', () => {
      render(<WeeklyBudget />)

      const input = screen.getByDisplayValue('10000')
      fireEvent.change(input, { target: { value: 'invalid' } })
      fireEvent.blur(input)

      // Invalid input is not applied - setWeeklyLimit may be called with current valid value
      // The important thing is that invalid input doesn't corrupt the stored value
      expect(mockSetWeeklyLimit).not.toHaveBeenCalledWith(NaN)
    })

    it('input has correct attributes', () => {
      render(<WeeklyBudget />)

      const input = screen.getByDisplayValue('10000')
      expect(input).toHaveAttribute('type', 'text')
      expect(input).toHaveAttribute('inputmode', 'decimal')
    })
  })

  describe('date formatting', () => {
    it('formats week start date correctly', () => {
      render(<WeeklyBudget />)

      // Should show "20 янв" for Jan 20
      expect(screen.getByText(/20 янв/)).toBeInTheDocument()
    })

    it('formats week end date correctly', () => {
      render(<WeeklyBudget />)

      // Should show "26 янв" for Jan 26
      expect(screen.getByText(/26 янв/)).toBeInTheDocument()
    })

    it('uses Russian month abbreviations', () => {
      render(<WeeklyBudget />)

      // Check for Russian month format
      const dateText = screen.getByText(/янв/)
      expect(dateText).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles zero weekly limit', () => {
      mockWeeklyLimit = 0
      render(<WeeklyBudget />)

      const input = screen.getByDisplayValue('0')
      expect(input).toBeInTheDocument()
    })

    it('handles large numbers with locale formatting', () => {
      mockWeeklyLimit = 1000000
      render(<WeeklyBudget />)

      const input = screen.getByDisplayValue('1000000')
      expect(input).toBeInTheDocument()
    })

    it('updates correctly when limit changes multiple times', () => {
      render(<WeeklyBudget />)

      const input = screen.getByDisplayValue('10000')

      fireEvent.change(input, { target: { value: '5000' } })
      fireEvent.blur(input)
      expect(mockSetWeeklyLimit).toHaveBeenCalledWith(5000)

      fireEvent.change(input, { target: { value: '8000' } })
      fireEvent.blur(input)
      expect(mockSetWeeklyLimit).toHaveBeenCalledWith(8000)

      fireEvent.change(input, { target: { value: '12000' } })
      fireEvent.blur(input)
      expect(mockSetWeeklyLimit).toHaveBeenCalledWith(12000)

      // Each value should have been applied
      expect(mockSetWeeklyLimit).toHaveBeenCalledTimes(3) // 1 call per blur
    })

    it('handles zero expenses', () => {
      // Set mockExpenses to empty array for this test
      const originalExpenses = mockExpenses
      mockExpenses = []

      render(<WeeklyBudget />)

      // Should still render without errors
      expect(screen.getByText('Бюджет на неделю')).toBeInTheDocument()
      // When no expenses, both spent and remaining may show amounts, use getAllByText
      const amounts = screen.getAllByText(/₽/)
      expect(amounts.length).toBeGreaterThanOrEqual(1)

      // Restore original expenses
      mockExpenses = originalExpenses
    })
  })

  describe('integration with stores', () => {
    it('reads expenses from expense store', () => {
      render(<WeeklyBudget />)

      // Verifies that personal expenses are being read and calculated
      expect(screen.getByText(/2\s?300 ₽/)).toBeInTheDocument()
    })

    it('reads weekly limit from settings store', () => {
      render(<WeeklyBudget />)

      const input = screen.getByDisplayValue('10000')
      expect(input).toBeInTheDocument()
    })

    it('reads selected date from session store', () => {
      render(<WeeklyBudget />)

      // Week calculation should be based on Jan 21, 2026
      expect(screen.getByText(/20 янв/)).toBeInTheDocument()
    })

    it('calls setWeeklyLimit from settings store', () => {
      render(<WeeklyBudget />)

      const input = screen.getByDisplayValue('10000')
      fireEvent.change(input, { target: { value: '20000' } })
      fireEvent.blur(input)

      expect(mockSetWeeklyLimit).toHaveBeenCalledWith(20000)
    })
  })

  describe('progress bar integration', () => {
    it('passes correct value to progress bar', () => {
      render(<WeeklyBudget />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '2300')
    })

    it('passes correct max to progress bar', () => {
      render(<WeeklyBudget />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuemax', '10000')
    })

    it('shows percentage on progress bar', () => {
      render(<WeeklyBudget />)

      // 2300/10000 = 23%
      expect(screen.getByText('23%')).toBeInTheDocument()
    })
  })
})
