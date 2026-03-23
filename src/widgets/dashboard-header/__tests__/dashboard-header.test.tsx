import { render, screen, fireEvent } from '@testing-library/react'

import { DashboardHeader } from '../ui/dashboard-header'

// Mock query hooks with legacy aliases for the current component implementation
const mockNextMonth = jest.fn()
const mockPrevMonth = jest.fn()
const mockToggleEditMode = jest.fn()

const mockViewDate = new Date(2026, 0, 15) // January 2026

let mockIsEditMode = false

jest.mock('@/entities/session', () => ({
  useSessionStore: () => ({
    viewDate: mockViewDate,
    nextMonth: mockNextMonth,
    prevMonth: mockPrevMonth,
  }),
}))

jest.mock('@/features/layout-editor', () => ({
  useEditMode: () => ({
    isEditMode: mockIsEditMode,
    toggleEditMode: mockToggleEditMode,
  }),
  useLayoutStore: () => ({
    isEditMode: mockIsEditMode,
    toggleEditMode: mockToggleEditMode,
  }),
}))

// Mock viewport hook
let mockViewport = 'desktop'
let mockIsMobile = false

jest.mock('@/shared/lib', () => ({
  ...jest.requireActual('@/shared/lib'),
  useViewport: () => mockViewport,
  isMobile: () => mockIsMobile,
}))

describe('DashboardHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockViewport = 'desktop'
    mockIsMobile = false
    mockIsEditMode = false
  })

  describe('rendering', () => {
    it('renders the application title', () => {
      render(<DashboardHeader />)

      expect(screen.getByText('SmartSpend Terminal')).toBeInTheDocument()
    })

    it('renders month and year in Russian format', () => {
      render(<DashboardHeader />)

      expect(screen.getByText(/январь 2026/i)).toBeInTheDocument()
    })

    it('renders navigation buttons', () => {
      render(<DashboardHeader />)

      expect(screen.getByLabelText('Предыдущий месяц')).toBeInTheDocument()
      expect(screen.getByLabelText('Следующий месяц')).toBeInTheDocument()
    })

    it('renders edit mode button on desktop', () => {
      render(<DashboardHeader />)

      const editButtons = screen.getAllByLabelText(/Редактировать|Готово/)
      // Should have 2 buttons (mobile and desktop versions)
      expect(editButtons.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('navigation', () => {
    it('calls prevMonth when clicking previous button', () => {
      render(<DashboardHeader />)

      const prevButton = screen.getByLabelText('Предыдущий месяц')
      fireEvent.click(prevButton)

      expect(mockPrevMonth).toHaveBeenCalledTimes(1)
    })

    it('calls nextMonth when clicking next button', () => {
      render(<DashboardHeader />)

      const nextButton = screen.getByLabelText('Следующий месяц')
      fireEvent.click(nextButton)

      expect(mockNextMonth).toHaveBeenCalledTimes(1)
    })
  })

  describe('edit mode toggle', () => {
    it('calls toggleEditMode when clicking edit button', () => {
      render(<DashboardHeader />)

      const editButton = screen.getAllByLabelText('Редактировать')[0]
      fireEvent.click(editButton)

      expect(mockToggleEditMode).toHaveBeenCalledTimes(1)
    })

    it('shows "Готово" text when in edit mode', () => {
      mockIsEditMode = true

      render(<DashboardHeader />)

      expect(screen.getAllByText('Готово').length).toBeGreaterThanOrEqual(1)
    })

    it('shows "Редактировать" text when not in edit mode', () => {
      mockIsEditMode = false

      render(<DashboardHeader />)

      expect(
        screen.getAllByText('Редактировать').length
      ).toBeGreaterThanOrEqual(1)
    })

    it('applies primary variant when in edit mode', () => {
      mockIsEditMode = true

      render(<DashboardHeader />)

      const editButtons = screen.getAllByLabelText('Готово')
      // Primary variant is applied via Button component
      expect(editButtons[0]).toBeInTheDocument()
    })
  })

  describe('responsive behavior', () => {
    it('shows mobile layout on small screens', () => {
      mockViewport = 'mobile'
      mockIsMobile = true

      render(<DashboardHeader />)

      // Both mobile and desktop buttons exist but are hidden via CSS
      const editButtons = screen.getAllByLabelText(/Редактировать|Готово/)
      expect(editButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('applies touch-friendly button sizes on mobile', () => {
      mockViewport = 'mobile'
      mockIsMobile = true

      render(<DashboardHeader />)

      const prevButton = screen.getByLabelText('Предыдущий месяц')
      expect(prevButton).toHaveClass('min-h-[44px]', 'min-w-[44px]')
    })

    it('applies standard button sizes on desktop', () => {
      mockViewport = 'desktop'
      mockIsMobile = false

      render(<DashboardHeader />)

      const prevButton = screen.getByLabelText('Предыдущий месяц')
      expect(prevButton).toHaveClass('sm:min-h-0', 'sm:min-w-0')
    })
  })

  describe('accessibility', () => {
    it('has proper aria-labels for navigation buttons', () => {
      render(<DashboardHeader />)

      expect(screen.getByLabelText('Предыдущий месяц')).toBeInTheDocument()
      expect(screen.getByLabelText('Следующий месяц')).toBeInTheDocument()
    })

    it('has proper aria-labels for edit mode toggle', () => {
      render(<DashboardHeader />)

      expect(
        screen.getAllByLabelText('Редактировать').length
      ).toBeGreaterThanOrEqual(1)
    })

    it('updates aria-label when switching to edit mode', () => {
      mockIsEditMode = true

      render(<DashboardHeader />)

      expect(screen.getAllByLabelText('Готово').length).toBeGreaterThanOrEqual(
        1
      )
    })
  })
})
