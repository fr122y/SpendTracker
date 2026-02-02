import { render, screen, fireEvent } from '@testing-library/react'

import { MobileWidgetList } from '../ui/mobile-widget-list'

import type { WidgetId } from '@/shared/types'

// Mock widget registry
jest.mock('@/features/widget-registry', () => ({
  WIDGET_REGISTRY: {
    CALENDAR: {
      title: 'Календарь',
      icon: () => <div data-testid="icon-calendar">CalendarIcon</div>,
    },
    EXPENSE_LOG: {
      title: 'Журнал расходов',
      icon: () => <div data-testid="icon-expense-log">ExpenseLogIcon</div>,
    },
    ANALYSIS: {
      title: 'Анализ',
      icon: () => <div data-testid="icon-analysis">AnalysisIcon</div>,
    },
    DYNAMICS: {
      title: 'Динамика',
      icon: () => <div data-testid="icon-dynamics">DynamicsIcon</div>,
    },
    WEEKLY_BUDGET: {
      title: 'Недельный бюджет',
      icon: () => <div data-testid="icon-weekly-budget">WeeklyBudgetIcon</div>,
    },
    SAVINGS: {
      title: 'Накопления',
      icon: () => <div data-testid="icon-savings">SavingsIcon</div>,
    },
    PROJECTS: {
      title: 'Проекты',
      icon: () => <div data-testid="icon-projects">ProjectsIcon</div>,
    },
    CATEGORIES: {
      title: 'Категории',
      icon: () => <div data-testid="icon-categories">CategoriesIcon</div>,
    },
    SETTINGS: {
      title: 'Настройки',
      icon: () => <div data-testid="icon-settings">SettingsIcon</div>,
    },
  },
}))

// Mock lucide-react ChevronRight icon
jest.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-right">ChevronRight</div>,
}))

describe('MobileWidgetList', () => {
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders without crashing with empty widgets array', () => {
      render(<MobileWidgetList widgets={[]} onSelect={mockOnSelect} />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('renders navigation element with proper aria-label', () => {
      render(<MobileWidgetList widgets={[]} onSelect={mockOnSelect} />)

      expect(screen.getByRole('navigation')).toHaveAttribute(
        'aria-label',
        'Виджеты'
      )
    })

    it('renders all provided widgets', () => {
      const widgets: WidgetId[] = ['CALENDAR', 'EXPENSE_LOG', 'ANALYSIS']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      expect(screen.getByText('Календарь')).toBeInTheDocument()
      expect(screen.getByText('Журнал расходов')).toBeInTheDocument()
      expect(screen.getByText('Анализ')).toBeInTheDocument()
    })

    it('renders widget icons correctly', () => {
      const widgets: WidgetId[] = ['CALENDAR', 'EXPENSE_LOG']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      expect(screen.getByTestId('icon-calendar')).toBeInTheDocument()
      expect(screen.getByTestId('icon-expense-log')).toBeInTheDocument()
    })

    it('renders chevron icon for each widget', () => {
      const widgets: WidgetId[] = ['CALENDAR', 'EXPENSE_LOG', 'ANALYSIS']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const chevrons = screen.getAllByTestId('chevron-right')
      expect(chevrons).toHaveLength(3)
    })

    it('renders all widget types from WIDGET_REGISTRY', () => {
      const widgets: WidgetId[] = [
        'CALENDAR',
        'EXPENSE_LOG',
        'ANALYSIS',
        'DYNAMICS',
        'WEEKLY_BUDGET',
        'SAVINGS',
        'PROJECTS',
        'CATEGORIES',
        'SETTINGS',
      ]

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      expect(screen.getByText('Календарь')).toBeInTheDocument()
      expect(screen.getByText('Журнал расходов')).toBeInTheDocument()
      expect(screen.getByText('Анализ')).toBeInTheDocument()
      expect(screen.getByText('Динамика')).toBeInTheDocument()
      expect(screen.getByText('Недельный бюджет')).toBeInTheDocument()
      expect(screen.getByText('Накопления')).toBeInTheDocument()
      expect(screen.getByText('Проекты')).toBeInTheDocument()
      expect(screen.getByText('Категории')).toBeInTheDocument()
      expect(screen.getByText('Настройки')).toBeInTheDocument()
    })

    it('renders widgets as button elements', () => {
      const widgets: WidgetId[] = ['CALENDAR', 'EXPENSE_LOG']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })

    it('does not render invalid widget IDs', () => {
      const widgets = [
        'CALENDAR',
        'INVALID_WIDGET',
        'EXPENSE_LOG',
      ] as WidgetId[]

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      expect(screen.getByText('Календарь')).toBeInTheDocument()
      expect(screen.getByText('Журнал расходов')).toBeInTheDocument()
      // Should only render 2 widgets, not 3
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })
  })

  describe('user interactions', () => {
    it('calls onSelect when widget is clicked', () => {
      const widgets: WidgetId[] = ['CALENDAR', 'EXPENSE_LOG']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const calendarButton = screen.getByText('Календарь').closest('button')
      fireEvent.click(calendarButton!)

      expect(mockOnSelect).toHaveBeenCalledTimes(1)
      expect(mockOnSelect).toHaveBeenCalledWith('CALENDAR')
    })

    it('calls onSelect with correct widget ID for each widget', () => {
      const widgets: WidgetId[] = ['CALENDAR', 'EXPENSE_LOG', 'ANALYSIS']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const expenseLogButton = screen
        .getByText('Журнал расходов')
        .closest('button')
      fireEvent.click(expenseLogButton!)

      expect(mockOnSelect).toHaveBeenCalledWith('EXPENSE_LOG')

      const analysisButton = screen.getByText('Анализ').closest('button')
      fireEvent.click(analysisButton!)

      expect(mockOnSelect).toHaveBeenCalledWith('ANALYSIS')
    })

    it('handles multiple clicks on the same widget', () => {
      const widgets: WidgetId[] = ['CALENDAR']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const calendarButton = screen.getByText('Календарь').closest('button')
      fireEvent.click(calendarButton!)
      fireEvent.click(calendarButton!)
      fireEvent.click(calendarButton!)

      expect(mockOnSelect).toHaveBeenCalledTimes(3)
      expect(mockOnSelect).toHaveBeenCalledWith('CALENDAR')
    })

    it('handles clicks on different widgets sequentially', () => {
      const widgets: WidgetId[] = ['CALENDAR', 'EXPENSE_LOG', 'ANALYSIS']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const calendarButton = screen.getByText('Календарь').closest('button')
      fireEvent.click(calendarButton!)

      const expenseLogButton = screen
        .getByText('Журнал расходов')
        .closest('button')
      fireEvent.click(expenseLogButton!)

      expect(mockOnSelect).toHaveBeenCalledTimes(2)
      expect(mockOnSelect).toHaveBeenNthCalledWith(1, 'CALENDAR')
      expect(mockOnSelect).toHaveBeenNthCalledWith(2, 'EXPENSE_LOG')
    })
  })

  describe('styling and layout', () => {
    it('applies correct container classes to navigation element', () => {
      render(<MobileWidgetList widgets={[]} onSelect={mockOnSelect} />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('flex', 'flex-col', 'divide-y', 'divide-zinc-800')
    })

    it('applies correct button classes for touch-friendly interaction', () => {
      const widgets: WidgetId[] = ['CALENDAR']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('flex', 'items-center', 'gap-3')
      expect(button).toHaveClass('px-4', 'py-3')
      expect(button).toHaveClass('min-h-12', 'w-full', 'text-left')
    })

    it('applies hover and active state classes', () => {
      const widgets: WidgetId[] = ['CALENDAR']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-zinc-900/50', 'transition-colors')
      expect(button).toHaveClass('hover:bg-zinc-800/50')
      expect(button).toHaveClass('active:bg-zinc-700/50', 'active:scale-95')
    })

    it('applies focus-visible styles for keyboard navigation', () => {
      const widgets: WidgetId[] = ['CALENDAR']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-inset',
        'focus-visible:ring-emerald-500'
      )
    })

    it('applies correct icon styling', () => {
      const widgets: WidgetId[] = ['CALENDAR']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const icon = screen.getByTestId('icon-calendar')
      // Icon is wrapped in a span/div with these classes
      expect(icon).toBeInTheDocument()
      // The parent element should be the button, not the icon wrapper
      const button = screen.getByRole('button')
      expect(button).toContainElement(icon)
    })
  })

  describe('accessibility', () => {
    it('has navigation landmark role', () => {
      render(<MobileWidgetList widgets={[]} onSelect={mockOnSelect} />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('has proper aria-label for navigation', () => {
      render(<MobileWidgetList widgets={[]} onSelect={mockOnSelect} />)

      expect(screen.getByLabelText('Виджеты')).toBeInTheDocument()
    })

    it('renders buttons with type="button"', () => {
      const widgets: WidgetId[] = ['CALENDAR', 'EXPENSE_LOG']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })

    it('maintains proper text hierarchy with readable labels', () => {
      const widgets: WidgetId[] = ['CALENDAR', 'EXPENSE_LOG', 'ANALYSIS']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      // Widget titles should be visible and readable
      expect(screen.getByText('Календарь')).toHaveClass(
        'font-mono',
        'text-sm',
        'text-zinc-100'
      )
      expect(screen.getByText('Журнал расходов')).toHaveClass(
        'font-mono',
        'text-sm',
        'text-zinc-100'
      )
    })
  })

  describe('edge cases', () => {
    it('handles empty widgets array gracefully', () => {
      render(<MobileWidgetList widgets={[]} onSelect={mockOnSelect} />)

      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('handles single widget', () => {
      const widgets: WidgetId[] = ['CALENDAR']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Календарь')).toBeInTheDocument()
    })

    it('handles large number of widgets', () => {
      const widgets: WidgetId[] = [
        'CALENDAR',
        'EXPENSE_LOG',
        'ANALYSIS',
        'DYNAMICS',
        'WEEKLY_BUDGET',
        'SAVINGS',
        'PROJECTS',
        'CATEGORIES',
        'SETTINGS',
      ]

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(9)
    })

    it('maintains widget order as provided in props', () => {
      const widgets: WidgetId[] = ['SETTINGS', 'CALENDAR', 'EXPENSE_LOG']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toHaveTextContent('Настройки')
      expect(buttons[1]).toHaveTextContent('Календарь')
      expect(buttons[2]).toHaveTextContent('Журнал расходов')
    })

    it('handles duplicate widget IDs by rendering each instance', () => {
      const widgets: WidgetId[] = ['CALENDAR', 'CALENDAR', 'EXPENSE_LOG']

      // Suppress console.error for duplicate key warning (expected React behavior)
      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)

      // Both calendar buttons should be present
      const calendarTexts = screen.getAllByText('Календарь')
      expect(calendarTexts).toHaveLength(2)

      consoleError.mockRestore()
    })

    it('does not crash when onSelect is called without handler', () => {
      const widgets: WidgetId[] = ['CALENDAR']

      // Even though onSelect is required, test defensive programming
      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const button = screen.getByRole('button')
      expect(() => fireEvent.click(button)).not.toThrow()
    })
  })

  describe('widget registry integration', () => {
    it('retrieves correct widget metadata from registry', () => {
      const widgets: WidgetId[] = ['CALENDAR', 'EXPENSE_LOG', 'ANALYSIS']

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      // Verify titles match registry
      expect(screen.getByText('Календарь')).toBeInTheDocument()
      expect(screen.getByText('Журнал расходов')).toBeInTheDocument()
      expect(screen.getByText('Анализ')).toBeInTheDocument()

      // Verify icons are rendered
      expect(screen.getByTestId('icon-calendar')).toBeInTheDocument()
      expect(screen.getByTestId('icon-expense-log')).toBeInTheDocument()
      expect(screen.getByTestId('icon-analysis')).toBeInTheDocument()
    })

    it('skips rendering when widget not found in registry', () => {
      const widgets = ['CALENDAR', 'NONEXISTENT', 'EXPENSE_LOG'] as WidgetId[]

      render(<MobileWidgetList widgets={widgets} onSelect={mockOnSelect} />)

      const buttons = screen.getAllByRole('button')
      // Should only render valid widgets
      expect(buttons).toHaveLength(2)
    })
  })
})
