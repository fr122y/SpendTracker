import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

import { MonthPickerModal } from '../ui/month-picker-modal'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  ChevronLeft: () => <div data-testid="chevron-left">ChevronLeft</div>,
  ChevronRight: () => <div data-testid="chevron-right">ChevronRight</div>,
}))

describe('MonthPickerModal', () => {
  const mockOnSelectMonth = jest.fn()
  const mockOnClose = jest.fn()
  const currentDate = new Date(2024, 5, 15) // June 15, 2024

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <MonthPickerModal
          isOpen={false}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders modal when isOpen is true', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('displays all 12 Russian months', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

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

      months.forEach((month) => {
        expect(screen.getByText(month)).toBeInTheDocument()
      })
    })

    it('displays the current year', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('2024')).toBeInTheDocument()
    })

    it('displays year navigation buttons', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText('Предыдущий год')).toBeInTheDocument()
      expect(screen.getByLabelText('Следующий год')).toBeInTheDocument()
    })

    it('displays close button', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText('Закрыть')).toBeInTheDocument()
    })

    it('highlights the current month', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const juneButton = screen.getByText('Июнь')
      expect(juneButton).toHaveClass('bg-blue-600', 'text-white')
    })

    it('applies correct styling to non-current months', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const januaryButton = screen.getByText('Январь')
      expect(januaryButton).toHaveClass('bg-zinc-800', 'text-zinc-300')
      expect(januaryButton).not.toHaveClass('bg-blue-600')
    })

    it('applies fixed overlay styling', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const overlay = screen.getByRole('dialog').parentElement
      expect(overlay).toHaveClass(
        'fixed',
        'inset-0',
        'z-50',
        'bg-black/50',
        'backdrop-blur-sm'
      )
    })

    it('applies correct content box styling', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const contentBox = screen.getByRole('dialog')
      expect(contentBox).toHaveClass(
        'bg-zinc-900',
        'rounded-xl',
        'border',
        'border-zinc-800',
        'max-w-sm',
        'w-full'
      )
    })
  })

  describe('month selection', () => {
    it('calls onSelectMonth with correct date when month is clicked', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const marchButton = screen.getByText('Март')
      fireEvent.click(marchButton)

      expect(mockOnSelectMonth).toHaveBeenCalledTimes(1)
      const selectedDate = mockOnSelectMonth.mock.calls[0][0]
      expect(selectedDate.getMonth()).toBe(2) // March is month index 2
      expect(selectedDate.getFullYear()).toBe(2024)
    })

    it('maintains selected year when clicking different months', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      // Change year first
      const nextYearButton = screen.getByLabelText('Следующий год')
      fireEvent.click(nextYearButton)

      // Then select a month
      const decemberButton = screen.getByText('Декабрь')
      fireEvent.click(decemberButton)

      const selectedDate = mockOnSelectMonth.mock.calls[0][0]
      expect(selectedDate.getMonth()).toBe(11) // December is month index 11
      expect(selectedDate.getFullYear()).toBe(2025) // Year should be 2025
    })

    it('preserves the day of the month when selecting a different month', () => {
      const dateWith15th = new Date(2024, 5, 15) // June 15, 2024
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={dateWith15th}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const januaryButton = screen.getByText('Январь')
      fireEvent.click(januaryButton)

      const selectedDate = mockOnSelectMonth.mock.calls[0][0]
      expect(selectedDate.getDate()).toBe(15) // Should preserve day 15
      expect(selectedDate.getMonth()).toBe(0) // January
    })
  })

  describe('year navigation', () => {
    it('increments year when next year button is clicked', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const nextYearButton = screen.getByLabelText('Следующий год')
      fireEvent.click(nextYearButton)

      expect(screen.getByText('2025')).toBeInTheDocument()
      expect(screen.queryByText('2024')).not.toBeInTheDocument()
    })

    it('decrements year when previous year button is clicked', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const prevYearButton = screen.getByLabelText('Предыдущий год')
      fireEvent.click(prevYearButton)

      expect(screen.getByText('2023')).toBeInTheDocument()
      expect(screen.queryByText('2024')).not.toBeInTheDocument()
    })

    it('disables previous year button at minimum year boundary (current year - 5)', () => {
      const actualCurrentYear = new Date().getFullYear()
      const minYear = actualCurrentYear - 5
      const minYearDate = new Date(minYear, 5, 15)

      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={minYearDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const prevYearButton = screen.getByLabelText('Предыдущий год')

      expect(screen.getByText(String(minYear))).toBeInTheDocument()
      expect(prevYearButton).toBeDisabled()
    })

    it('disables next year button at maximum year boundary (current year + 5)', () => {
      const actualCurrentYear = new Date().getFullYear()
      const maxYear = actualCurrentYear + 5
      const maxYearDate = new Date(maxYear, 5, 15)

      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={maxYearDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const nextYearButton = screen.getByLabelText('Следующий год')

      expect(screen.getByText(String(maxYear))).toBeInTheDocument()
      expect(nextYearButton).toBeDisabled()
    })

    it('does not change year when clicking disabled previous year button', () => {
      const actualCurrentYear = new Date().getFullYear()
      const minYear = actualCurrentYear - 5
      const minYearDate = new Date(minYear, 5, 15) // Already at min year

      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={minYearDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const prevYearButton = screen.getByLabelText('Предыдущий год')
      expect(prevYearButton).toBeDisabled()

      fireEvent.click(prevYearButton)

      expect(screen.getByText(String(minYear))).toBeInTheDocument()
    })

    it('does not change year when clicking disabled next year button', () => {
      const actualCurrentYear = new Date().getFullYear()
      const maxYear = actualCurrentYear + 5
      const maxYearDate = new Date(maxYear, 5, 15) // Already at max year

      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={maxYearDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const nextYearButton = screen.getByLabelText('Следующий год')
      expect(nextYearButton).toBeDisabled()

      fireEvent.click(nextYearButton)

      expect(screen.getByText(String(maxYear))).toBeInTheDocument()
    })
  })

  describe('close behavior', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByLabelText('Закрыть')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Escape key is pressed', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when backdrop is clicked', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const backdrop = screen.getByRole('dialog').parentElement!
      fireEvent.click(backdrop)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when clicking inside modal content', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const dialog = screen.getByRole('dialog')
      fireEvent.click(dialog)

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('does not close on other key presses', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      fireEvent.keyDown(document, { key: 'Tab' })

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('cleans up keyboard event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const { unmount } = render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('accessibility', () => {
    it('has role="dialog" attribute', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has aria-modal="true" attribute', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-label attribute', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText('Выбор месяца')).toBeInTheDocument()
    })

    it('all month buttons have type="button"', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

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

      months.forEach((month) => {
        const button = screen.getByText(month)
        expect(button).toHaveAttribute('type', 'button')
      })
    })

    it('applies focus-visible rings on interactive elements', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByLabelText('Закрыть')
      expect(closeButton).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-blue-500'
      )

      const januaryButton = screen.getByText('Январь')
      expect(januaryButton).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-blue-500'
      )
    })

    it('ensures month buttons meet minimum touch target size', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const januaryButton = screen.getByText('Январь')
      expect(januaryButton).toHaveClass('min-h-[44px]')
    })
  })

  describe('animations', () => {
    it('applies opacity transition classes', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const overlay = screen.getByRole('dialog').parentElement
      expect(overlay).toHaveClass('transition-opacity', 'duration-200')
    })

    it('fades in when opened', async () => {
      const { rerender } = render(
        <MonthPickerModal
          isOpen={false}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      await act(async () => {
        rerender(
          <MonthPickerModal
            isOpen={true}
            currentDate={currentDate}
            onSelectMonth={mockOnSelectMonth}
            onClose={mockOnClose}
          />
        )
      })

      await waitFor(() => {
        const overlay = screen.getByRole('dialog').parentElement
        expect(overlay).toHaveClass('opacity-100')
      })
    })
  })

  describe('edge cases', () => {
    it('handles different years correctly', () => {
      const dateIn2020 = new Date(2020, 11, 31) // December 31, 2020
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={dateIn2020}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('2020')).toBeInTheDocument()

      const decemberButton = screen.getByText('Декабрь')
      expect(decemberButton).toHaveClass('bg-blue-600')
    })

    it('handles January correctly (month index 0)', () => {
      const januaryDate = new Date(2024, 0, 15) // January 15, 2024
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={januaryDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const januaryButton = screen.getByText('Январь')
      fireEvent.click(januaryButton)

      const selectedDate = mockOnSelectMonth.mock.calls[0][0]
      expect(selectedDate.getMonth()).toBe(0)
    })

    it('handles December correctly (month index 11)', () => {
      const decemberDate = new Date(2024, 11, 25) // December 25, 2024
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={decemberDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const decemberButton = screen.getByText('Декабрь')
      fireEvent.click(decemberButton)

      const selectedDate = mockOnSelectMonth.mock.calls[0][0]
      expect(selectedDate.getMonth()).toBe(11)
    })

    it('handles rapid year changes correctly', () => {
      render(
        <MonthPickerModal
          isOpen={true}
          currentDate={currentDate}
          onSelectMonth={mockOnSelectMonth}
          onClose={mockOnClose}
        />
      )

      const nextYearButton = screen.getByLabelText('Следующий год')
      const prevYearButton = screen.getByLabelText('Предыдущий год')

      // Rapidly change years
      fireEvent.click(nextYearButton)
      fireEvent.click(nextYearButton)
      fireEvent.click(prevYearButton)

      expect(screen.getByText('2025')).toBeInTheDocument()
    })
  })
})
