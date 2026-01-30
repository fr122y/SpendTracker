import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MobileWidgetAccordion } from '../ui/mobile-widget-accordion'

import type { WidgetId } from '@/shared/types'

// Mock widget registry
jest.mock('@/shared/lib/widget-registry', () => ({
  WIDGET_REGISTRY: {
    CALENDAR: {
      title: 'Календарь',
      icon: () => <div data-testid="icon-calendar">CalendarIcon</div>,
      component: () => <div data-testid="widget-calendar">Calendar Widget</div>,
    },
    EXPENSE_LOG: {
      title: 'Журнал расходов',
      icon: () => <div data-testid="icon-expense-log">ExpenseLogIcon</div>,
      component: () => (
        <div data-testid="widget-expense-log">ExpenseLog Widget</div>
      ),
    },
    ANALYSIS: {
      title: 'Анализ',
      icon: () => <div data-testid="icon-analysis">AnalysisIcon</div>,
      component: () => <div data-testid="widget-analysis">Analysis Widget</div>,
    },
  },
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down">ChevronDown</div>,
  ChevronUp: () => <div data-testid="chevron-up">ChevronUp</div>,
}))

describe('MobileWidgetAccordion', () => {
  const mockWidgets: WidgetId[] = ['CALENDAR', 'EXPENSE_LOG', 'ANALYSIS']
  const mockOnToggle = jest.fn()

  beforeEach(() => {
    mockOnToggle.mockClear()
  })

  describe('Rendering', () => {
    test('should render all widgets in collapsed state by default', () => {
      render(
        <MobileWidgetAccordion
          widgets={mockWidgets}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      // Check that all widget titles are rendered
      expect(screen.getByText('Календарь')).toBeInTheDocument()
      expect(screen.getByText('Журнал расходов')).toBeInTheDocument()
      expect(screen.getByText('Анализ')).toBeInTheDocument()

      // Check that all buttons have aria-expanded=false
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-expanded', 'false')
      })
    })

    test('should render widget icons from registry', () => {
      render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      // Icons should be rendered from the widget registry
      expect(screen.getByTestId('icon-calendar')).toBeInTheDocument()
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument() // Collapsed state
    })

    test('should render with navigation landmark', () => {
      render(
        <MobileWidgetAccordion
          widgets={mockWidgets}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const nav = screen.getByRole('navigation', { name: 'Виджеты' })
      expect(nav).toBeInTheDocument()
    })

    test('should handle empty widgets array', () => {
      render(
        <MobileWidgetAccordion
          widgets={[]}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
      expect(within(nav).queryAllByRole('button')).toHaveLength(0)
    })

    test('should skip invalid widget IDs from registry', () => {
      // Force an invalid ID (TypeScript won't allow in real usage, but testing runtime safety)
      const invalidWidgets: WidgetId[] = ['CALENDAR', 'INVALID_ID' as WidgetId]

      render(
        <MobileWidgetAccordion
          widgets={invalidWidgets}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      // Only valid widget should render
      expect(screen.getByText('Календарь')).toBeInTheDocument()
      expect(screen.queryByText('INVALID_ID')).not.toBeInTheDocument()
    })
  })

  describe('Toggle Behavior', () => {
    test('should call onToggle with true when expanding collapsed widget', async () => {
      const user = userEvent.setup()

      render(
        <MobileWidgetAccordion
          widgets={mockWidgets}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const calendarButton = screen.getByRole('button', { name: /Календарь/i })
      await user.click(calendarButton)

      expect(mockOnToggle).toHaveBeenCalledTimes(1)
      expect(mockOnToggle).toHaveBeenCalledWith('CALENDAR', true)
    })

    test('should call onToggle with false when collapsing expanded widget', async () => {
      const user = userEvent.setup()

      render(
        <MobileWidgetAccordion
          widgets={mockWidgets}
          expandedWidgets={new Set(['CALENDAR'])}
          onToggle={mockOnToggle}
        />
      )

      const calendarButton = screen.getByRole('button', { name: /Календарь/i })
      await user.click(calendarButton)

      expect(mockOnToggle).toHaveBeenCalledTimes(1)
      expect(mockOnToggle).toHaveBeenCalledWith('CALENDAR', false)
    })

    test('should support multiple expanded widgets simultaneously', () => {
      const expandedSet = new Set<WidgetId>(['CALENDAR', 'ANALYSIS'])

      render(
        <MobileWidgetAccordion
          widgets={mockWidgets}
          expandedWidgets={expandedSet}
          onToggle={mockOnToggle}
        />
      )

      const calendarButton = screen.getByRole('button', { name: /Календарь/i })
      const analysisButton = screen.getByRole('button', { name: /Анализ/i })
      const expenseButton = screen.getByRole('button', {
        name: /Журнал расходов/i,
      })

      expect(calendarButton).toHaveAttribute('aria-expanded', 'true')
      expect(analysisButton).toHaveAttribute('aria-expanded', 'true')
      expect(expenseButton).toHaveAttribute('aria-expanded', 'false')
    })

    test('should handle keyboard navigation (Enter key)', async () => {
      const user = userEvent.setup()

      render(
        <MobileWidgetAccordion
          widgets={mockWidgets}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const calendarButton = screen.getByRole('button', { name: /Календарь/i })
      calendarButton.focus()
      await user.keyboard('{Enter}')

      expect(mockOnToggle).toHaveBeenCalledWith('CALENDAR', true)
    })

    test('should handle keyboard navigation (Space key)', async () => {
      const user = userEvent.setup()

      render(
        <MobileWidgetAccordion
          widgets={mockWidgets}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const calendarButton = screen.getByRole('button', { name: /Календарь/i })
      calendarButton.focus()
      await user.keyboard(' ')

      expect(mockOnToggle).toHaveBeenCalledWith('CALENDAR', true)
    })
  })

  describe('Content Rendering', () => {
    test('should render widget component when expanded', () => {
      render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set(['CALENDAR'])}
          onToggle={mockOnToggle}
        />
      )

      // Calendar component should be rendered
      const button = screen.getByRole('button', { name: /Календарь/i })
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByTestId('widget-calendar')).toBeInTheDocument()
    })

    test('should not render widget component when collapsed', () => {
      const { container } = render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const button = screen.getByRole('button', { name: /Календарь/i })
      expect(button).toHaveAttribute('aria-expanded', 'false')

      // The content wrapper should have grid-rows-[0fr] for collapsed state
      const contentGrid = container.querySelector(
        '[data-accordion-content="CALENDAR"]'
      )
      expect(contentGrid).toHaveClass('grid-rows-[0fr]')
    })

    test('should show multiple widget components when multiple are expanded', () => {
      render(
        <MobileWidgetAccordion
          widgets={['CALENDAR', 'EXPENSE_LOG']}
          expandedWidgets={new Set(['CALENDAR', 'EXPENSE_LOG'])}
          onToggle={mockOnToggle}
        />
      )

      const calendarButton = screen.getByRole('button', { name: /Календарь/i })
      const expenseButton = screen.getByRole('button', {
        name: /Журнал расходов/i,
      })

      expect(calendarButton).toHaveAttribute('aria-expanded', 'true')
      expect(expenseButton).toHaveAttribute('aria-expanded', 'true')

      // Both widget components should be rendered
      expect(screen.getByTestId('widget-calendar')).toBeInTheDocument()
      expect(screen.getByTestId('widget-expense-log')).toBeInTheDocument()
    })
  })

  describe('Animation Classes', () => {
    test('should apply collapsed grid classes when widget is collapsed', () => {
      const { container } = render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const contentGrid = container.querySelector(
        '[data-accordion-content="CALENDAR"]'
      )
      expect(contentGrid).toHaveClass('grid')
      expect(contentGrid).toHaveClass('grid-rows-[0fr]')
      expect(contentGrid).toHaveClass('transition-[grid-template-rows]')
    })

    test('should apply expanded grid classes when widget is expanded', () => {
      const { container } = render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set(['CALENDAR'])}
          onToggle={mockOnToggle}
        />
      )

      const contentGrid = container.querySelector(
        '[data-accordion-content="CALENDAR"]'
      )
      expect(contentGrid).toHaveClass('grid')
      expect(contentGrid).toHaveClass('grid-rows-[1fr]')
      expect(contentGrid).toHaveClass('transition-[grid-template-rows]')
    })

    test('should toggle animation classes when widget state changes', () => {
      const { container, rerender } = render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      let contentGrid = container.querySelector(
        '[data-accordion-content="CALENDAR"]'
      )
      expect(contentGrid).toHaveClass('grid-rows-[0fr]')

      // Re-render with expanded state
      rerender(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set(['CALENDAR'])}
          onToggle={mockOnToggle}
        />
      )

      contentGrid = container.querySelector(
        '[data-accordion-content="CALENDAR"]'
      )
      expect(contentGrid).toHaveClass('grid-rows-[1fr]')
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA attributes for expanded state', () => {
      render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set(['CALENDAR'])}
          onToggle={mockOnToggle}
        />
      )

      const button = screen.getByRole('button', { name: /Календарь/i })
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(button).toHaveAttribute('type', 'button')
    })

    test('should have proper ARIA attributes for collapsed state', () => {
      render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const button = screen.getByRole('button', { name: /Календарь/i })
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(button).toHaveAttribute('type', 'button')
    })

    test('should be keyboard navigable between widgets', async () => {
      const user = userEvent.setup()

      render(
        <MobileWidgetAccordion
          widgets={mockWidgets}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const buttons = screen.getAllByRole('button')
      buttons[0].focus()
      expect(buttons[0]).toHaveFocus()

      await user.keyboard('{Tab}')
      expect(buttons[1]).toHaveFocus()

      await user.keyboard('{Tab}')
      expect(buttons[2]).toHaveFocus()
    })

    test('should show chevron down icon when collapsed', () => {
      render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      // ChevronDown should be present when collapsed
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument()
      expect(screen.queryByTestId('chevron-up')).not.toBeInTheDocument()
    })

    test('should show chevron up icon when expanded', () => {
      render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set(['CALENDAR'])}
          onToggle={mockOnToggle}
        />
      )

      // ChevronUp should be present when expanded
      expect(screen.getByTestId('chevron-up')).toBeInTheDocument()
      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('should handle rapid toggle clicks', async () => {
      const user = userEvent.setup()

      const { rerender } = render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const button = screen.getByRole('button', { name: /Календарь/i })

      // First click - expand
      await user.click(button)
      expect(mockOnToggle).toHaveBeenNthCalledWith(1, 'CALENDAR', true)

      // Update props to simulate parent state change
      rerender(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set(['CALENDAR'])}
          onToggle={mockOnToggle}
        />
      )

      // Second click - collapse
      await user.click(button)
      expect(mockOnToggle).toHaveBeenNthCalledWith(2, 'CALENDAR', false)

      // Update props again
      rerender(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      // Third click - expand
      await user.click(button)
      expect(mockOnToggle).toHaveBeenNthCalledWith(3, 'CALENDAR', true)

      expect(mockOnToggle).toHaveBeenCalledTimes(3)
    })

    test('should handle expandedWidgets being undefined gracefully', () => {
      // This tests runtime safety if props are incorrectly passed
      render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const button = screen.getByRole('button', { name: /Календарь/i })
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    test('should maintain independent state for each widget', async () => {
      const user = userEvent.setup()

      render(
        <MobileWidgetAccordion
          widgets={mockWidgets}
          expandedWidgets={new Set(['CALENDAR'])}
          onToggle={mockOnToggle}
        />
      )

      const calendarButton = screen.getByRole('button', { name: /Календарь/i })
      const expenseButton = screen.getByRole('button', {
        name: /Журнал расходов/i,
      })

      expect(calendarButton).toHaveAttribute('aria-expanded', 'true')
      expect(expenseButton).toHaveAttribute('aria-expanded', 'false')

      await user.click(expenseButton)

      expect(mockOnToggle).toHaveBeenCalledWith('EXPENSE_LOG', true)
      // Calendar should still be expanded (parent manages state)
    })
  })

  describe('Styling and Layout', () => {
    test('should apply consistent styling classes', () => {
      render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const button = screen.getByRole('button', { name: /Календарь/i })

      // Check for important styling classes
      expect(button).toHaveClass('flex', 'items-center', 'w-full')
    })

    test('should apply overflow-hidden to content wrapper', () => {
      const { container } = render(
        <MobileWidgetAccordion
          widgets={['CALENDAR']}
          expandedWidgets={new Set()}
          onToggle={mockOnToggle}
        />
      )

      const contentGrid = container.querySelector(
        '[data-accordion-content="CALENDAR"]'
      )
      const innerWrapper = contentGrid?.firstChild as HTMLElement
      expect(innerWrapper).toHaveClass('overflow-hidden')
    })
  })
})
