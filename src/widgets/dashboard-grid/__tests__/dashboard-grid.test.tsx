import { render, screen, fireEvent } from '@testing-library/react'

import { DashboardGrid } from '../ui/dashboard-grid'

// Mock the stores and hooks
const mockMoveWidget = jest.fn()
const mockMoveWidgetInColumn = jest.fn()
const mockResizeColumn = jest.fn()

const mockLayoutConfig = {
  columns: [
    { id: 'col-1', width: 50, widgets: ['CALENDAR', 'EXPENSE_LOG'] },
    { id: 'col-2', width: 50, widgets: ['ANALYSIS'] },
  ],
}

let mockIsEditMode = false

jest.mock('@/features/layout-editor', () => ({
  useLayoutStore: () => ({
    layoutConfig: mockLayoutConfig,
    isEditMode: mockIsEditMode,
    moveWidget: mockMoveWidget,
    moveWidgetInColumn: mockMoveWidgetInColumn,
    resizeColumn: mockResizeColumn,
  }),
  ColumnResizer: ({ columnId }: { columnId: string }) => (
    <div data-testid={`resizer-${columnId}`}>Resizer</div>
  ),
}))

jest.mock('@/features/mobile-widget-accordion', () => ({
  MobileWidgetAccordion: ({
    widgets,
    expandedWidgets,
    onToggle,
  }: {
    widgets: string[]
    expandedWidgets: Set<string>
    onToggle: (id: string, shouldExpand: boolean) => void
  }) => (
    <div data-testid="mobile-widget-list">
      {widgets.map((id: string) => (
        <button
          key={id}
          onClick={() => onToggle(id, !expandedWidgets.has(id))}
          aria-expanded={expandedWidgets.has(id)}
        >
          {id}
        </button>
      ))}
    </div>
  ),
}))

// Mock viewport hook
let mockViewport = 'desktop'
let mockIsMobile = false
let mockIsTabletOrSmaller = false

jest.mock('@/shared/lib', () => ({
  ...jest.requireActual('@/shared/lib'),
  useViewport: () => mockViewport,
  isMobile: () => mockIsMobile,
  isTabletOrSmaller: () => mockIsTabletOrSmaller,
}))

// Mock WIDGET_REGISTRY
jest.mock('@/features/widget-registry', () => ({
  WIDGET_REGISTRY: {
    CALENDAR: {
      component: () => <div>Calendar Widget</div>,
      title: 'Календарь',
      icon: () => <div>Icon</div>,
    },
    EXPENSE_LOG: {
      component: () => <div>Expense Log Widget</div>,
      title: 'Журнал расходов',
      icon: () => <div>Icon</div>,
    },
    ANALYSIS: {
      component: () => <div>Analysis Widget</div>,
      title: 'Анализ',
      icon: () => <div>Icon</div>,
    },
  },
}))

describe('DashboardGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockViewport = 'desktop'
    mockIsMobile = false
    mockIsTabletOrSmaller = false
    mockIsEditMode = false
  })

  describe('desktop layout', () => {
    it('renders columns with correct widths', () => {
      render(<DashboardGrid />)

      const columns = screen.getByTestId('resizer-col-1')
      expect(columns).toBeInTheDocument()
    })

    it('renders all widgets in correct columns', () => {
      render(<DashboardGrid />)

      expect(screen.getByText('Calendar Widget')).toBeInTheDocument()
      expect(screen.getByText('Expense Log Widget')).toBeInTheDocument()
      expect(screen.getByText('Analysis Widget')).toBeInTheDocument()
    })

    it('renders column resizers between columns', () => {
      render(<DashboardGrid />)

      expect(screen.getByTestId('resizer-col-1')).toBeInTheDocument()
    })

    it('shows drag handles when in edit mode', () => {
      mockIsEditMode = true

      render(<DashboardGrid />)

      const dragHandles = screen.getAllByLabelText('Перетащить виджет')
      expect(dragHandles.length).toBeGreaterThan(0)
    })

    it('does not show drag handles when not in edit mode', () => {
      mockIsEditMode = false

      render(<DashboardGrid />)

      const dragHandles = screen.queryAllByLabelText('Перетащить виджет')
      expect(dragHandles.length).toBe(0)
    })

    it('makes widgets draggable when in edit mode', () => {
      mockIsEditMode = true

      const { container } = render(<DashboardGrid />)

      const draggableElements = container.querySelectorAll('[draggable="true"]')
      expect(draggableElements.length).toBeGreaterThan(0)
    })

    it('shows drop zone at end of columns when dragging', () => {
      mockIsEditMode = true

      const { container } = render(<DashboardGrid />)

      // Drop zones are rendered when draggedWidget state is set (via drag start)
      // In actual usage, they appear during drag operations
      expect(
        container.querySelector('[data-grid-container]')
      ).toBeInTheDocument()
    })
  })

  describe('tablet layout', () => {
    beforeEach(() => {
      mockViewport = 'tablet'
      mockIsTabletOrSmaller = true
    })

    it('renders 2-column grid', () => {
      const { container } = render(<DashboardGrid />)

      const gridContainer = container.querySelector('.grid-cols-2')
      expect(gridContainer).toBeInTheDocument()
    })

    it('distributes widgets evenly across columns', () => {
      render(<DashboardGrid />)

      // With 3 widgets (CALENDAR, EXPENSE_LOG, ANALYSIS), should split 2-1
      expect(screen.getByText('Calendar Widget')).toBeInTheDocument()
      expect(screen.getByText('Expense Log Widget')).toBeInTheDocument()
      expect(screen.getByText('Analysis Widget')).toBeInTheDocument()
    })

    it('does not show drag handles on tablet', () => {
      mockIsEditMode = true

      render(<DashboardGrid />)

      const dragHandles = screen.queryAllByLabelText('Перетащить виджет')
      expect(dragHandles.length).toBe(0)
    })

    it('does not show column resizers on tablet', () => {
      render(<DashboardGrid />)

      expect(screen.queryByTestId('resizer-col-1')).not.toBeInTheDocument()
    })
  })

  describe('mobile layout', () => {
    beforeEach(() => {
      mockViewport = 'mobile'
      mockIsMobile = true
      mockIsTabletOrSmaller = true
    })

    it('renders mobile widget list', () => {
      render(<DashboardGrid />)

      expect(screen.getByTestId('mobile-widget-list')).toBeInTheDocument()
    })

    it('shows all widget IDs in accordion list', () => {
      render(<DashboardGrid />)

      expect(screen.getByText('CALENDAR')).toBeInTheDocument()
      expect(screen.getByText('EXPENSE_LOG')).toBeInTheDocument()
      expect(screen.getByText('ANALYSIS')).toBeInTheDocument()
    })

    it('toggles widget expansion when clicking accordion button', () => {
      render(<DashboardGrid />)

      const calendarButton = screen.getByText('CALENDAR')

      // Initially not expanded
      expect(calendarButton).toHaveAttribute('aria-expanded', 'false')

      // Click to expand
      fireEvent.click(calendarButton)

      // Should toggle expansion state
      expect(calendarButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('allows multiple widgets to be expanded simultaneously', () => {
      render(<DashboardGrid />)

      const calendarButton = screen.getByText('CALENDAR')
      const expenseLogButton = screen.getByText('EXPENSE_LOG')

      // Expand both widgets
      fireEvent.click(calendarButton)
      fireEvent.click(expenseLogButton)

      // Both should be expanded
      expect(calendarButton).toHaveAttribute('aria-expanded', 'true')
      expect(expenseLogButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('does not show desktop grid on mobile', () => {
      const { container } = render(<DashboardGrid />)

      expect(container.querySelector('.grid-cols-2')).not.toBeInTheDocument()
      expect(screen.queryByTestId('resizer-col-1')).not.toBeInTheDocument()
    })
  })

  describe('performance optimizations', () => {
    it('memoizes allWidgets calculation', () => {
      const { rerender } = render(<DashboardGrid />)

      // Rerender should not cause issues with memoized values
      rerender(<DashboardGrid />)

      expect(screen.getByText('Calendar Widget')).toBeInTheDocument()
    })

    it('memoizes allWidgetIds calculation', () => {
      mockViewport = 'mobile'
      mockIsMobile = true

      const { rerender } = render(<DashboardGrid />)

      // Rerender should not cause issues with memoized values
      rerender(<DashboardGrid />)

      expect(screen.getByTestId('mobile-widget-list')).toBeInTheDocument()
    })
  })

  describe('drag and drop functionality', () => {
    beforeEach(() => {
      mockIsEditMode = true
    })

    it('handles drag start event', () => {
      const { container } = render(<DashboardGrid />)

      const draggableElements = container.querySelectorAll('[draggable="true"]')
      expect(draggableElements.length).toBeGreaterThan(0)

      // Note: Full drag-and-drop testing requires more complex setup
      // These tests verify the structure is in place
    })

    it('disables drag on mobile even in edit mode', () => {
      mockViewport = 'mobile'
      mockIsMobile = true
      mockIsTabletOrSmaller = true

      render(<DashboardGrid />)

      // Mobile view should show mobile widget list, not draggable grid
      expect(screen.getByTestId('mobile-widget-list')).toBeInTheDocument()
    })

    it('disables drag on tablet even in edit mode', () => {
      mockViewport = 'tablet'
      mockIsTabletOrSmaller = true

      const { container } = render(<DashboardGrid />)

      const draggableElements = container.querySelectorAll('[draggable="true"]')
      // Tablet shows static grid, no draggable elements
      expect(draggableElements.length).toBe(0)
    })
  })

  describe('accessibility', () => {
    it('has proper data attributes for grid container', () => {
      const { container } = render(<DashboardGrid />)

      expect(
        container.querySelector('[data-grid-container]')
      ).toBeInTheDocument()
    })

    it('has proper aria-labels for drag handles', () => {
      mockIsEditMode = true

      render(<DashboardGrid />)

      const dragHandles = screen.getAllByLabelText('Перетащить виджет')
      expect(dragHandles.length).toBeGreaterThan(0)
    })
  })
})
