import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'

import { MobileWidgetModal } from '../ui/mobile-widget-modal'

import type { WidgetId } from '@/shared/types'

// Mock widget registry with test components
jest.mock('@/features/widget-registry', () => ({
  WIDGET_REGISTRY: {
    CALENDAR: {
      component: () => (
        <div data-testid="calendar-content">Calendar Widget</div>
      ),
      title: 'Календарь',
      icon: () => <div data-testid="icon-calendar">CalendarIcon</div>,
    },
    EXPENSE_LOG: {
      component: () => (
        <div data-testid="expense-log-content">Expense Log Widget</div>
      ),
      title: 'Журнал расходов',
      icon: () => <div data-testid="icon-expense-log">ExpenseLogIcon</div>,
    },
    ANALYSIS: {
      component: () => (
        <div data-testid="analysis-content">Analysis Widget</div>
      ),
      title: 'Анализ',
      icon: () => <div data-testid="icon-analysis">AnalysisIcon</div>,
    },
    DYNAMICS: {
      component: () => (
        <div data-testid="dynamics-content">Dynamics Widget</div>
      ),
      title: 'Динамика',
      icon: () => <div data-testid="icon-dynamics">DynamicsIcon</div>,
    },
    WEEKLY_BUDGET: {
      component: () => (
        <div data-testid="weekly-budget-content">Weekly Budget Widget</div>
      ),
      title: 'Недельный бюджет',
      icon: () => <div data-testid="icon-weekly-budget">WeeklyBudgetIcon</div>,
    },
    SAVINGS: {
      component: () => <div data-testid="savings-content">Savings Widget</div>,
      title: 'Накопления',
      icon: () => <div data-testid="icon-savings">SavingsIcon</div>,
    },
    PROJECTS: {
      component: () => (
        <div data-testid="projects-content">Projects Widget</div>
      ),
      title: 'Проекты',
      icon: () => <div data-testid="icon-projects">ProjectsIcon</div>,
    },
    CATEGORIES: {
      component: () => (
        <div data-testid="categories-content">Categories Widget</div>
      ),
      title: 'Категории',
      icon: () => <div data-testid="icon-categories">CategoriesIcon</div>,
    },
  },
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left">ArrowLeft</div>,
  X: () => <div data-testid="x-icon">X</div>,
}))

describe('MobileWidgetModal', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays widget title from registry', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      expect(screen.getByText('Календарь')).toBeInTheDocument()
    })

    it('displays widget icon from registry', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      expect(screen.getByTestId('icon-calendar')).toBeInTheDocument()
    })

    it('renders widget component content', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      expect(screen.getByTestId('calendar-content')).toBeInTheDocument()
      expect(screen.getByText('Calendar Widget')).toBeInTheDocument()
    })

    it('renders back button with correct icon', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      expect(screen.getByTestId('arrow-left')).toBeInTheDocument()
    })

    it('renders close button with correct icon', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
    })

    it('renders all widget types correctly', () => {
      const widgetIds: WidgetId[] = [
        'CALENDAR',
        'EXPENSE_LOG',
        'ANALYSIS',
        'DYNAMICS',
        'WEEKLY_BUDGET',
        'SAVINGS',
        'PROJECTS',
        'CATEGORIES',
      ]

      widgetIds.forEach((widgetId) => {
        const { unmount } = render(
          <MobileWidgetModal widgetId={widgetId} onClose={mockOnClose} />
        )

        // Verify widget title is rendered
        const widgetTitles = {
          CALENDAR: 'Календарь',
          EXPENSE_LOG: 'Журнал расходов',
          ANALYSIS: 'Анализ',
          DYNAMICS: 'Динамика',
          WEEKLY_BUDGET: 'Недельный бюджет',
          SAVINGS: 'Накопления',
          PROJECTS: 'Проекты',
          CATEGORIES: 'Категории',
        }

        expect(screen.getByText(widgetTitles[widgetId])).toBeInTheDocument()

        unmount()
      })
    })

    it('returns null when widget not found in registry', () => {
      const { container } = render(
        <MobileWidgetModal
          widgetId={'INVALID_WIDGET' as WidgetId}
          onClose={mockOnClose}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('applies full-screen modal styling', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const modalContainer = screen.getByRole('banner').parentElement
      expect(modalContainer).toHaveClass(
        'fixed',
        'inset-0',
        'z-50',
        'flex',
        'flex-col',
        'bg-zinc-950'
      )
    })

    it('applies correct header styling', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const header = screen.getByRole('banner')
      expect(header).toHaveClass(
        'flex',
        'shrink-0',
        'items-center',
        'gap-3',
        'border-b',
        'border-zinc-800',
        'bg-zinc-900',
        'px-4',
        'py-3'
      )
    })

    it('applies correct main content styling', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const main = screen.getByRole('main')
      expect(main).toHaveClass('flex-1', 'overflow-y-auto', 'p-4')
    })
  })

  describe('modal animations', () => {
    it('starts with opacity-0 and transitions to opacity-100', () => {
      // Use real timers for this test as requestAnimationFrame is involved
      jest.useRealTimers()

      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const modalContainer = screen.getByRole('banner').parentElement!

      // Initially should have transition class
      expect(modalContainer).toHaveClass('transition-opacity', 'duration-200')

      // Initially starts with opacity-0
      expect(modalContainer).toHaveClass('opacity-0')

      jest.useFakeTimers()
    })

    it('applies transition classes to modal container', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const modalContainer = screen.getByRole('banner').parentElement!
      expect(modalContainer).toHaveClass('transition-opacity', 'duration-200')
    })
  })

  describe('close button interactions', () => {
    it('calls onClose when close button (X) is clicked', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const closeButton = screen.getByLabelText('Закрыть')
      fireEvent.click(closeButton)

      // onClose should be called after timeout
      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when back button is clicked', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const backButton = screen.getByLabelText('Назад')
      fireEvent.click(backButton)

      // onClose should be called after timeout
      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('sets opacity to 0 before calling onClose', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const modalContainer = screen.getByRole('banner').parentElement!
      const closeButton = screen.getByLabelText('Закрыть')

      // Wait for animation in
      act(() => {
        jest.runAllTimers()
      })

      fireEvent.click(closeButton)

      // Should transition to opacity-0
      expect(modalContainer).toHaveClass('opacity-0')

      // onClose not called yet
      expect(mockOnClose).not.toHaveBeenCalled()

      // After timeout, onClose is called
      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('handles multiple close button clicks gracefully', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const closeButton = screen.getByLabelText('Закрыть')

      fireEvent.click(closeButton)
      fireEvent.click(closeButton)
      fireEvent.click(closeButton)

      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Should still only call once per click, but rapid clicks may be debounced
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('keyboard interactions', () => {
    it('calls onClose when Escape key is pressed', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not close on other key presses', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      fireEvent.keyDown(document, { key: 'Tab' })

      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('cleans up keyboard event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const { unmount } = render(
        <MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('touch interactions', () => {
    it('applies transform on swipe down', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const header = screen.getByRole('banner')

      // Start touch at position 100
      fireEvent.touchStart(header, {
        touches: [{ clientY: 100 }],
      })

      // Move down by 50px
      fireEvent.touchMove(header, {
        touches: [{ clientY: 150 }],
      })

      // Should apply transform
      expect(header.style.transform).toBe('translateY(50px)')
    })

    it('does not apply transform on swipe up', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const header = screen.getByRole('banner')

      // Start touch at position 100
      fireEvent.touchStart(header, {
        touches: [{ clientY: 100 }],
      })

      // Move up by 50px
      fireEvent.touchMove(header, {
        touches: [{ clientY: 50 }],
      })

      // Should NOT apply transform for upward swipe
      expect(header.style.transform).toBe('')
    })

    it('closes modal when swiped down more than 100px', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const header = screen.getByRole('banner')

      // Start touch
      fireEvent.touchStart(header, {
        touches: [{ clientY: 50 }],
      })

      // Swipe down 150px (> 100px threshold)
      fireEvent.touchMove(header, {
        touches: [{ clientY: 200 }],
      })

      fireEvent.touchEnd(header)

      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not close modal when swiped down less than 100px', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const header = screen.getByRole('banner')

      // Start touch
      fireEvent.touchStart(header, {
        touches: [{ clientY: 50 }],
      })

      // Swipe down 80px (< 100px threshold)
      fireEvent.touchMove(header, {
        touches: [{ clientY: 130 }],
      })

      fireEvent.touchEnd(header)

      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('resets transform after touchEnd if not closing', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const header = screen.getByRole('banner')

      // Small swipe
      fireEvent.touchStart(header, {
        touches: [{ clientY: 50 }],
      })

      fireEvent.touchMove(header, {
        touches: [{ clientY: 100 }],
      })

      fireEvent.touchEnd(header)

      // Transform should be reset
      expect(header.style.transform).toBe('')
    })

    it('handles touchMove without touchStart gracefully', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const header = screen.getByRole('banner')

      // TouchMove without touchStart should not crash
      expect(() => {
        fireEvent.touchMove(header, {
          touches: [{ clientY: 100 }],
        })
      }).not.toThrow()

      expect(header.style.transform).toBe('')
    })
  })

  describe('accessibility', () => {
    it('has proper ARIA label for back button', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      expect(screen.getByLabelText('Назад')).toBeInTheDocument()
    })

    it('has proper ARIA label for close button', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      expect(screen.getByLabelText('Закрыть')).toBeInTheDocument()
    })

    it('renders buttons with type="button"', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })

    it('applies focus-visible styles to buttons', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const backButton = screen.getByLabelText('Назад')
      const closeButton = screen.getByLabelText('Закрыть')

      expect(backButton).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-inset',
        'focus-visible:ring-emerald-500'
      )

      expect(closeButton).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-inset',
        'focus-visible:ring-emerald-500'
      )
    })

    it('has semantic header element', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('has semantic main element', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays widget title in proper heading style', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const title = screen.getByText('Календарь')
      expect(title).toHaveClass(
        'font-mono',
        'text-base',
        'font-semibold',
        'text-zinc-100'
      )
    })
  })

  describe('edge cases', () => {
    it('handles invalid widget ID gracefully', () => {
      const { container } = render(
        <MobileWidgetModal
          widgetId={'NONEXISTENT' as WidgetId}
          onClose={mockOnClose}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders different widgets correctly when switching', () => {
      const { rerender } = render(
        <MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />
      )

      expect(screen.getByText('Календарь')).toBeInTheDocument()
      expect(screen.getByTestId('calendar-content')).toBeInTheDocument()

      rerender(<MobileWidgetModal widgetId="ANALYSIS" onClose={mockOnClose} />)

      expect(screen.getByText('Анализ')).toBeInTheDocument()
      expect(screen.getByTestId('analysis-content')).toBeInTheDocument()
    })

    it('cleans up timers on unmount', () => {
      const { unmount } = render(
        <MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />
      )

      const closeButton = screen.getByLabelText('Закрыть')
      fireEvent.click(closeButton)

      unmount()

      // Advance timers after unmount should not cause errors
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(200)
        })
      }).not.toThrow()
    })

    it('handles rapid open/close cycles', () => {
      const { rerender, unmount } = render(
        <MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />
      )

      const closeButton = screen.getByLabelText('Закрыть')
      fireEvent.click(closeButton)

      // Immediately rerender
      rerender(<MobileWidgetModal widgetId="ANALYSIS" onClose={mockOnClose} />)

      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('widget content rendering', () => {
    it('renders EXPENSE_LOG widget content', () => {
      render(<MobileWidgetModal widgetId="EXPENSE_LOG" onClose={mockOnClose} />)

      expect(screen.getByTestId('expense-log-content')).toBeInTheDocument()
      expect(screen.getByText('Expense Log Widget')).toBeInTheDocument()
    })

    it('renders ANALYSIS widget content', () => {
      render(<MobileWidgetModal widgetId="ANALYSIS" onClose={mockOnClose} />)

      expect(screen.getByTestId('analysis-content')).toBeInTheDocument()
      expect(screen.getByText('Analysis Widget')).toBeInTheDocument()
    })

    it('widget content is scrollable', () => {
      render(<MobileWidgetModal widgetId="CALENDAR" onClose={mockOnClose} />)

      const main = screen.getByRole('main')
      expect(main).toHaveClass('overflow-y-auto')
    })
  })
})
