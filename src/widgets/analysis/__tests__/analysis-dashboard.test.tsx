import { render, screen, fireEvent } from '@testing-library/react'

import { AnalysisDashboard } from '../ui/analysis-dashboard'

import type { CategoryStat } from '@/shared/lib'
import type { Expense } from '@/shared/types'

// Mock data
let mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Groceries',
    amount: 5000,
    date: '2026-01-15',
    category: 'Продукты',
    emoji: '🛒',
  },
  {
    id: '2',
    description: 'Coffee',
    amount: 3000,
    date: '2026-01-16',
    category: 'Кафе',
    emoji: '☕',
  },
  {
    id: '3',
    description: 'Transport',
    amount: 2000,
    date: '2026-01-17',
    category: 'Транспорт',
    emoji: '🚌',
  },
  {
    id: '4',
    description: 'Movie',
    amount: 1000,
    date: '2026-01-18',
    category: 'Развлечения',
    emoji: '🎬',
  },
]

let mockSelectedDate = new Date(2026, 0, 15) // Jan 15, 2026
let mockIsLoading = false

// Mock query hooks with legacy aliases for the current component implementation
jest.mock('@/entities/expense', () => ({
  useExpenses: () => ({ data: mockExpenses, isLoading: false }),
  useExpenseStore: (
    selector?: (state: { expenses: Expense[]; isLoading: boolean }) => unknown
  ) => {
    const state = { expenses: mockExpenses, isLoading: mockIsLoading }
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
  getCategoryStats: jest.fn(
    (expenses: Expense[], date: Date): CategoryStat[] => {
      const year = date.getFullYear()
      const month = date.getMonth()

      // Filter expenses for the month
      const monthlyExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return (
          expenseDate.getFullYear() === year && expenseDate.getMonth() === month
        )
      })

      if (monthlyExpenses.length === 0) return []

      // Calculate total
      const total = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0)

      // Group by category and calculate percentages
      const categoryMap = new Map<
        string,
        {
          value: number
          personalValue: number
          projectValue: number
          emoji: string
        }
      >()
      for (const expense of monthlyExpenses) {
        const existing = categoryMap.get(expense.category)
        const personalValue = expense.projectId ? 0 : expense.amount
        const projectValue = expense.projectId ? expense.amount : 0

        if (existing) {
          existing.value += expense.amount
          existing.personalValue += personalValue
          existing.projectValue += projectValue
        } else {
          categoryMap.set(expense.category, {
            value: expense.amount,
            personalValue,
            projectValue,
            emoji: expense.emoji,
          })
        }
      }

      // Convert to stats and sort by value descending
      const stats: CategoryStat[] = Array.from(categoryMap.entries()).map(
        ([name, data]) => ({
          name,
          value: data.value,
          personalValue: data.personalValue,
          projectValue: data.projectValue,
          emoji: data.emoji,
          percent: total > 0 ? (data.value / total) * 100 : 0,
        })
      )

      return stats.sort((a, b) => b.value - a.value)
    }
  ),
  cn: jest.fn((...args: unknown[]) => {
    return args
      .flat()
      .filter((x) => typeof x === 'string')
      .join(' ')
  }),
}))

// Mock EmptyState component
jest.mock('@/shared/ui', () => ({
  ...jest.requireActual('@/shared/ui'),
  EmptyState: jest.fn(
    ({ title, description }: { title: string; description?: string }) => (
      <div data-testid="empty-state">
        <h3 className="text-sm font-medium text-zinc-400 text-center">
          {title}
        </h3>
        {description && <p>{description}</p>}
      </div>
    )
  ),
}))

describe('AnalysisDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsLoading = false
    mockSelectedDate = new Date(2026, 0, 15) // Reset to Jan 15, 2026
    mockExpenses = [
      {
        id: '1',
        description: 'Groceries',
        amount: 5000,
        date: '2026-01-15',
        category: 'Продукты',
        emoji: '🛒',
      },
      {
        id: '2',
        description: 'Coffee',
        amount: 3000,
        date: '2026-01-16',
        category: 'Кафе',
        emoji: '☕',
      },
      {
        id: '3',
        description: 'Transport',
        amount: 2000,
        date: '2026-01-17',
        category: 'Транспорт',
        emoji: '🚌',
      },
      {
        id: '4',
        description: 'Movie',
        amount: 1000,
        date: '2026-01-18',
        category: 'Развлечения',
        emoji: '🎬',
      },
    ]
  })

  describe('rendering', () => {
    it('renders skeleton while expenses are loading', () => {
      mockIsLoading = true

      render(<AnalysisDashboard />)

      expect(screen.getByTestId('analysis-skeleton')).toBeInTheDocument()
      expect(screen.queryByText(/Анализ за/)).not.toBeInTheDocument()
    })

    it('renders header with month and year', () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText(/Анализ за Январь 2026/)).toBeInTheDocument()
    })

    it('renders total spent amount', () => {
      render(<AnalysisDashboard />)

      // Total: 5000 + 3000 + 2000 + 1000 = 11000
      expect(screen.getByTestId('analysis-header-total')).toHaveTextContent(
        /11 000 ₽/
      )
    })

    it('renders personal and project breakdown in header', () => {
      mockExpenses = [
        ...mockExpenses,
        {
          id: '5',
          description: 'Project groceries',
          amount: 2500,
          date: '2026-01-19',
          category: 'Продукты',
          emoji: '🛒',
          projectId: 'project-1',
        },
      ]

      render(<AnalysisDashboard />)

      expect(screen.getByTestId('analysis-header-personal')).toHaveTextContent(
        /Личные: 11 000 ₽/
      )
      expect(screen.getByTestId('analysis-header-project')).toHaveTextContent(
        /Проекты: 2 500 ₽/
      )
      expect(screen.getByTestId('analysis-header-total')).toHaveTextContent(
        /13 500 ₽/
      )
    })

    it('applies correct container styling', () => {
      const { container } = render(<AnalysisDashboard />)

      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'gap-3')
    })
  })

  describe('month and year display', () => {
    it('displays January correctly', () => {
      mockSelectedDate = new Date(2026, 0, 15)
      render(<AnalysisDashboard />)

      expect(screen.getByText(/Январь 2026/)).toBeInTheDocument()
    })

    it('displays February correctly', () => {
      mockSelectedDate = new Date(2026, 1, 15)
      render(<AnalysisDashboard />)

      expect(screen.getByText(/Февраль 2026/)).toBeInTheDocument()
    })

    it('displays December correctly', () => {
      mockSelectedDate = new Date(2025, 11, 15)
      render(<AnalysisDashboard />)

      expect(screen.getByText(/Декабрь 2025/)).toBeInTheDocument()
    })

    it('displays all Russian month names correctly', () => {
      const months = [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь',
      ]

      months.forEach((monthName, index) => {
        mockSelectedDate = new Date(2026, index, 15)
        const { unmount } = render(<AnalysisDashboard />)

        expect(
          screen.getByText(new RegExp(`${monthName} 2026`))
        ).toBeInTheDocument()

        unmount()
      })
    })

    it('displays correct year', () => {
      mockSelectedDate = new Date(2025, 5, 15)
      render(<AnalysisDashboard />)

      expect(screen.getByText(/2025/)).toBeInTheDocument()
    })
  })

  describe('category boxes rendering', () => {
    it('renders all category boxes', () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText('Продукты')).toBeInTheDocument()
      expect(screen.getByText('Кафе')).toBeInTheDocument()
      expect(screen.getByText('Транспорт')).toBeInTheDocument()
      expect(screen.getByText('Развлечения')).toBeInTheDocument()
    })

    it('renders category emojis', () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText('🛒')).toBeInTheDocument()
      expect(screen.getByText('☕')).toBeInTheDocument()
      expect(screen.getByText('🚌')).toBeInTheDocument()
      expect(screen.getByText('🎬')).toBeInTheDocument()
    })

    it('renders category percentages', () => {
      render(<AnalysisDashboard />)

      // Продукты: 5000/11000 = 45.45%
      expect(screen.getByText('45%')).toBeInTheDocument()
      // Кафе: 3000/11000 = 27.27%
      expect(screen.getByText('27%')).toBeInTheDocument()
      // Транспорт: 2000/11000 = 18.18%
      expect(screen.getByText('18%')).toBeInTheDocument()
      // Развлечения: 1000/11000 = 9.09%
      expect(screen.getByText('9%')).toBeInTheDocument()
    })

    it('renders categories in sorted order by value', () => {
      const { container } = render(<AnalysisDashboard />)

      // The category name has responsive classes: text-[10px] sm:text-xs, but contains font-medium and text-white
      const categories = Array.from(
        container.querySelectorAll('.font-medium.text-white')
      )
      const categoryNames = categories.map((el) => el.textContent)

      expect(categoryNames).toEqual([
        'Продукты',
        'Кафе',
        'Транспорт',
        'Развлечения',
      ])
    })
  })

  describe('tooltip interactions', () => {
    it('does not show tooltip by default', () => {
      render(<AnalysisDashboard />)

      expect(screen.queryByText(/Всего:/)).not.toBeInTheDocument()
    })

    it('shows tooltip on mouse enter', () => {
      render(<AnalysisDashboard />)

      const categoryBox = screen.getByText('Продукты').parentElement
      if (categoryBox?.parentElement) {
        fireEvent.mouseEnter(categoryBox.parentElement)

        expect(
          screen.getByTestId('analysis-tooltip-total-Продукты')
        ).toHaveTextContent(/Всего: 5 000 ₽/)
        expect(
          screen.getByTestId('analysis-tooltip-personal-Продукты')
        ).toHaveTextContent(/Личные: 5 000 ₽/)
        expect(
          screen.getByTestId('analysis-tooltip-project-Продукты')
        ).toHaveTextContent(/Проекты: 0 ₽/)
      }
    })

    it('hides tooltip on mouse leave', () => {
      render(<AnalysisDashboard />)

      const categoryBox = screen.getByText('Продукты').parentElement
      if (categoryBox?.parentElement) {
        fireEvent.mouseEnter(categoryBox.parentElement)
        expect(
          screen.getByTestId('analysis-tooltip-total-Продукты')
        ).toBeInTheDocument()

        fireEvent.mouseLeave(categoryBox.parentElement)
        expect(
          screen.queryByTestId('analysis-tooltip-total-Продукты')
        ).not.toBeInTheDocument()
      }
    })

    it('shows correct amount in tooltip for each category', () => {
      render(<AnalysisDashboard />)

      const cafeBox = screen.getByText('Кафе').parentElement
      if (cafeBox?.parentElement) {
        fireEvent.mouseEnter(cafeBox.parentElement)

        expect(
          screen.getByTestId('analysis-tooltip-total-Кафе')
        ).toHaveTextContent(/Всего: 3 000 ₽/)
      }
    })

    it('formats tooltip amounts with Russian locale', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Big expense',
          amount: 125500,
          date: '2026-01-15',
          category: 'Большая покупка',
          emoji: '💰',
        },
      ]

      render(<AnalysisDashboard />)

      const categoryBox = screen.getByText('Большая покупка').parentElement
      if (categoryBox?.parentElement) {
        fireEvent.mouseEnter(categoryBox.parentElement)

        expect(
          screen.getByTestId('analysis-tooltip-total-Большая покупка')
        ).toHaveTextContent(/Всего: 125 500 ₽/)
        expect(
          screen.getByTestId('analysis-tooltip-personal-Большая покупка')
        ).toHaveTextContent(/Личные: 125 500 ₽/)
      }
    })

    it('shows mixed personal and project breakdown in tooltip', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Personal transport',
          amount: 1000,
          date: '2026-01-15',
          category: 'Транспорт',
          emoji: '🚌',
        },
        {
          id: '2',
          description: 'Project transport',
          amount: 4000,
          date: '2026-01-16',
          category: 'Транспорт',
          emoji: '🚌',
          projectId: 'project-1',
        },
      ]

      render(<AnalysisDashboard />)

      const categoryBox = screen.getByText('Транспорт').parentElement
      if (categoryBox?.parentElement) {
        fireEvent.mouseEnter(categoryBox.parentElement)

        expect(
          screen.getByTestId('analysis-tooltip-total-Транспорт')
        ).toHaveTextContent(/Всего: 5 000 ₽/)
        expect(
          screen.getByTestId('analysis-tooltip-personal-Транспорт')
        ).toHaveTextContent(/Личные: 1 000 ₽/)
        expect(
          screen.getByTestId('analysis-tooltip-project-Транспорт')
        ).toHaveTextContent(/Проекты: 4 000 ₽/)
      }
    })
  })

  describe('empty state', () => {
    it('shows empty message when no expenses', () => {
      mockExpenses = []
      render(<AnalysisDashboard />)

      expect(screen.getByText('Нет данных за этот месяц')).toBeInTheDocument()
    })

    it('does not render category boxes when no expenses', () => {
      mockExpenses = []
      render(<AnalysisDashboard />)

      expect(screen.queryByText('Продукты')).not.toBeInTheDocument()
      expect(screen.queryByText('Кафе')).not.toBeInTheDocument()
    })

    it('shows zero total when no expenses', () => {
      mockExpenses = []
      render(<AnalysisDashboard />)

      expect(screen.getByText('0 ₽')).toBeInTheDocument()
    })

    it('shows empty message when expenses are from different month', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'February expense',
          amount: 1000,
          date: '2026-02-15',
          category: 'Другое',
          emoji: '📦',
        },
      ]

      // View date is January
      mockSelectedDate = new Date(2026, 0, 15)

      render(<AnalysisDashboard />)

      expect(screen.getByText('Нет данных за этот месяц')).toBeInTheDocument()
    })

    it('applies correct empty state styling', () => {
      mockExpenses = []
      render(<AnalysisDashboard />)

      const emptyMessage = screen.getByText('Нет данных за этот месяц')
      // Now using EmptyState component with updated styling
      expect(emptyMessage).toHaveClass(
        'text-sm',
        'font-medium',
        'text-zinc-400',
        'text-center'
      )
    })
  })

  describe('total spent calculation', () => {
    it('calculates total correctly for multiple categories', () => {
      render(<AnalysisDashboard />)

      // 5000 + 3000 + 2000 + 1000 = 11000
      expect(screen.getByTestId('analysis-header-total')).toHaveTextContent(
        /11 000 ₽/
      )
    })

    it('calculates total correctly for single expense', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Single',
          amount: 500,
          date: '2026-01-15',
          category: 'Тест',
          emoji: '🧪',
        },
      ]

      render(<AnalysisDashboard />)

      expect(screen.getByTestId('analysis-header-total')).toHaveTextContent(
        /500 ₽/
      )
    })

    it('formats large amounts with locale formatting', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Big',
          amount: 999999,
          date: '2026-01-15',
          category: 'Большая',
          emoji: '💰',
        },
      ]

      render(<AnalysisDashboard />)

      expect(screen.getByTestId('analysis-header-total')).toHaveTextContent(
        /999 999 ₽/
      )
    })

    it('handles decimal amounts correctly', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Decimal',
          amount: 123.45,
          date: '2026-01-15',
          category: 'Тест',
          emoji: '🧪',
        },
      ]

      render(<AnalysisDashboard />)

      // Russian locale may use comma or period for decimals
      expect(screen.getByTestId('analysis-header-total')).toHaveTextContent(
        /123\.45 ₽|123,45 ₽/
      )
    })
  })

  describe('category box visual properties', () => {
    it('renders category boxes with appropriate styling', () => {
      render(<AnalysisDashboard />)

      const categoryBox = screen.getByText('Продукты').parentElement
      expect(categoryBox).toHaveClass(
        'flex',
        'cursor-default',
        'flex-col',
        'items-center',
        'justify-center',
        'rounded-lg',
        'transition-transform',
        'hover:scale-105'
      )
    })

    it('uses emerald fill for personal-only categories', () => {
      render(<AnalysisDashboard />)

      const categoryBox = screen.getByTestId('analysis-category-fill-Продукты')

      expect(categoryBox).toHaveStyle({ backgroundColor: '#10b981' })
    })

    it('uses split fill for mixed categories', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Personal groceries',
          amount: 3000,
          date: '2026-01-15',
          category: 'Продукты',
          emoji: '🛒',
        },
        {
          id: '2',
          description: 'Project groceries',
          amount: 2000,
          date: '2026-01-16',
          category: 'Продукты',
          emoji: '🛒',
          projectId: 'project-1',
        },
      ]

      render(<AnalysisDashboard />)

      const categoryBox = screen.getByTestId('analysis-category-fill-Продукты')

      expect(categoryBox).toHaveAttribute('data-fill-mode', 'mixed')
    })

    it('renders category names with correct styling', () => {
      render(<AnalysisDashboard />)

      const categoryName = screen.getByText('Продукты')
      expect(categoryName).toHaveClass(
        'mt-1',
        'text-xs',
        'font-medium',
        'text-white'
      )
    })

    it('renders percentages with correct styling', () => {
      render(<AnalysisDashboard />)

      const percentage = screen.getByText('45%')
      expect(percentage).toHaveClass('text-xs', 'text-white/80')
    })

    it('renders emojis with correct styling', () => {
      render(<AnalysisDashboard />)

      const emoji = screen.getByText('🛒')
      expect(emoji).toHaveClass('text-2xl')
    })
  })

  describe('category grid layout', () => {
    it('applies flex-wrap layout for category grid', () => {
      render(<AnalysisDashboard />)

      const grid = screen.getByTestId('analysis-category-grid')
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass(
        'flex',
        'flex-wrap',
        'items-center',
        'justify-center',
        'gap-2'
      )
    })

    it('renders multiple categories in grid', () => {
      render(<AnalysisDashboard />)

      const categories = screen.getAllByText(/\d+%/)
      expect(categories.length).toBe(4)
    })
  })

  describe('header styling', () => {
    it('applies correct styling to header text', () => {
      render(<AnalysisDashboard />)

      const header = screen.getByText(/Анализ за/)
      expect(header).toHaveClass('text-base', 'font-medium', 'text-zinc-100')
    })

    it('applies correct styling to total amount', () => {
      render(<AnalysisDashboard />)

      const total = screen.getByTestId('analysis-header-total')
      expect(total).toHaveClass(
        'text-base',
        'font-semibold',
        'text-emerald-400'
      )
    })

    it('applies flexbox layout to header', () => {
      render(<AnalysisDashboard />)

      const header = screen.getByText(/Анализ за/).parentElement
      expect(header?.parentElement).toHaveClass('flex', 'flex-col')
    })
  })

  describe('integration with stores', () => {
    it('reads expenses from expense store', () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText('Продукты')).toBeInTheDocument()
      expect(screen.getByText('Кафе')).toBeInTheDocument()
    })

    it('reads selectedDate from session store', () => {
      mockSelectedDate = new Date(2025, 5, 15)
      render(<AnalysisDashboard />)

      expect(screen.getByText(/Июнь 2025/)).toBeInTheDocument()
    })

    it('updates display when selectedDate changes', () => {
      mockSelectedDate = new Date(2026, 0, 15)
      const { unmount } = render(<AnalysisDashboard />)

      expect(screen.getByText(/Январь 2026/)).toBeInTheDocument()
      unmount()

      mockSelectedDate = new Date(2026, 5, 15)
      render(<AnalysisDashboard />)

      expect(screen.getByText(/Июнь 2026/)).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles expenses on first day of month', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'First day',
          amount: 1000,
          date: '2026-01-01',
          category: 'Тест',
          emoji: '🧪',
        },
      ]

      render(<AnalysisDashboard />)

      expect(screen.getByText('Тест')).toBeInTheDocument()
    })

    it('handles expenses on last day of month', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Last day',
          amount: 1000,
          date: '2026-01-31',
          category: 'Тест',
          emoji: '🧪',
        },
      ]

      render(<AnalysisDashboard />)

      expect(screen.getByText('Тест')).toBeInTheDocument()
    })

    it('handles leap year February', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Leap day',
          amount: 1000,
          date: '2024-02-29',
          category: 'Тест',
          emoji: '🧪',
        },
      ]
      mockSelectedDate = new Date(2024, 1, 29)

      render(<AnalysisDashboard />)

      expect(screen.getByText(/Февраль 2024/)).toBeInTheDocument()
    })

    it('handles single category with 100% share', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Only one',
          amount: 5000,
          date: '2026-01-15',
          category: 'Единственная',
          emoji: '🔥',
        },
      ]

      render(<AnalysisDashboard />)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('handles very large amounts', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Huge',
          amount: 9999999,
          date: '2026-01-15',
          category: 'Огромная',
          emoji: '💎',
        },
      ]

      render(<AnalysisDashboard />)

      expect(screen.getByTestId('analysis-header-total')).toHaveTextContent(
        /9 999 999 ₽/
      )
    })

    it('handles zero amount expense', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Zero',
          amount: 0,
          date: '2026-01-15',
          category: 'Нулевая',
          emoji: '⭕',
        },
      ]

      render(<AnalysisDashboard />)

      expect(screen.getByText('0 ₽')).toBeInTheDocument()
    })

    it('handles multiple expenses in same category', () => {
      mockExpenses = [
        {
          id: '1',
          description: 'Coffee 1',
          amount: 300,
          date: '2026-01-15',
          category: 'Кафе',
          emoji: '☕',
        },
        {
          id: '2',
          description: 'Coffee 2',
          amount: 400,
          date: '2026-01-16',
          category: 'Кафе',
          emoji: '☕',
        },
        {
          id: '3',
          description: 'Coffee 3',
          amount: 300,
          date: '2026-01-17',
          category: 'Кафе',
          emoji: '☕',
        },
      ]

      render(<AnalysisDashboard />)

      // Should show single category with combined amount: 1000
      expect(screen.getByText('Кафе')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()

      const cafeBox = screen.getByText('Кафе').parentElement
      if (cafeBox?.parentElement) {
        fireEvent.mouseEnter(cafeBox.parentElement)
        expect(
          screen.getByTestId('analysis-tooltip-total-Кафе')
        ).toHaveTextContent(/Всего: 1 000 ₽/)
      }
    })
  })

  describe('Russian locale formatting', () => {
    it('uses Russian locale for amount formatting', () => {
      render(<AnalysisDashboard />)

      // Russian locale uses space as thousands separator
      expect(screen.getByTestId('analysis-header-total')).toHaveTextContent(
        /11 000 ₽/
      )
    })

    it('uses Russian month names', () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText(/Январь/)).toBeInTheDocument()
    })

    it('uses Russian text for analysis header', () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText(/Анализ за/)).toBeInTheDocument()
    })

    it('uses Russian text for empty state', () => {
      mockExpenses = []
      render(<AnalysisDashboard />)

      expect(screen.getByText('Нет данных за этот месяц')).toBeInTheDocument()
    })
  })

  describe('percentage calculations', () => {
    it('calculates percentages that sum to 100%', () => {
      render(<AnalysisDashboard />)

      const percentages = screen.getAllByText(/\d+%/)
      const values = percentages.map((el) =>
        parseInt(el.textContent?.replace('%', '') || '0')
      )
      const sum = values.reduce((a, b) => a + b, 0)

      // Due to rounding, sum should be close to 100
      expect(sum).toBeGreaterThanOrEqual(99)
      expect(sum).toBeLessThanOrEqual(101)
    })

    it('rounds percentages to whole numbers', () => {
      render(<AnalysisDashboard />)

      const percentages = screen.getAllByText(/\d+%/)
      percentages.forEach((el) => {
        const text = el.textContent || ''
        expect(text).toMatch(/^\d+%$/)
        expect(text).not.toMatch(/\.\d+%$/)
      })
    })
  })
})
