import { render, screen, fireEvent, within } from '@testing-library/react'

import { subscribeWidgetReveal } from '@/shared/lib'

import { Calendar } from '../ui/calendar'

// Mock query hooks with legacy aliases for the current component implementation
const mockSetSelectedDate = jest.fn()
const mockNextMonth = jest.fn()
const mockPrevMonth = jest.fn()
const mockSetSalaryDay = jest.fn()
const mockSetAdvanceDay = jest.fn()

let mockSelectedDate = new Date(2026, 0, 22)
let mockExpenseLoading = false
let mockSettingsLoading = false
let mockExpenses: Array<{ date: string; sharedBudgetId?: string }> = []

jest.mock('@/entities/session', () => ({
  useSessionStore: () => ({
    selectedDate: mockSelectedDate,
    setSelectedDate: mockSetSelectedDate,
    nextMonth: mockNextMonth,
    prevMonth: mockPrevMonth,
  }),
}))

jest.mock('@/entities/expense', () => ({
  useExpenses: () => ({ data: [], isLoading: false }),
  useExpenseStore: (
    selector: (state: {
      expenses: Array<{ date: string; sharedBudgetId?: string }>
      isLoading: boolean
    }) => unknown
  ) => selector({ expenses: mockExpenses, isLoading: mockExpenseLoading }),
}))

let mockSalaryDay = 10
let mockAdvanceDay = 25

jest.mock('@/entities/settings', () => ({
  useSettings: () => ({
    data: {
      weeklyLimit: 10000,
      salaryDay: mockSalaryDay,
      advanceDay: mockAdvanceDay,
      salary: 0,
    },
    isLoading: false,
  }),
  useUpdateSettings: () => ({ mutate: jest.fn(), isPending: false }),
  useSettingsStore: () => ({
    salaryDay: mockSalaryDay,
    advanceDay: mockAdvanceDay,
    isLoading: mockSettingsLoading,
    setSalaryDay: mockSetSalaryDay,
    setAdvanceDay: mockSetAdvanceDay,
  }),
}))

describe('Calendar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSalaryDay = 10
    mockAdvanceDay = 25
    mockExpenses = []
    mockExpenseLoading = false
    mockSettingsLoading = false
    mockSelectedDate = new Date(2026, 0, 22)
  })

  it('renders skeleton while data is loading', () => {
    mockExpenseLoading = true

    render(<Calendar />)

    expect(screen.getByTestId('calendar-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Пн')).not.toBeInTheDocument()
  })

  describe('rendering', () => {
    it('renders calendar with month and year', () => {
      render(<Calendar />)

      expect(screen.getByText('Январь 2026')).toBeInTheDocument()
    })

    it('renders weekday headers', () => {
      render(<Calendar />)

      expect(screen.getByText('Пн')).toBeInTheDocument()
      expect(screen.getByText('Вт')).toBeInTheDocument()
      expect(screen.getByText('Ср')).toBeInTheDocument()
      expect(screen.getByText('Чт')).toBeInTheDocument()
      expect(screen.getByText('Пт')).toBeInTheDocument()
      expect(screen.getByText('Сб')).toBeInTheDocument()
      expect(screen.getByText('Вс')).toBeInTheDocument()
    })

    it('renders legend with expense, salary, and advance indicators', () => {
      render(<Calendar />)

      expect(screen.getByText('Операция')).toBeInTheDocument()
      expect(screen.getByText(/Зарплата:/)).toBeInTheDocument()
      expect(screen.getByText(/Аванс:/)).toBeInTheDocument()
    })

    it('filters operation markers by all, personal, and shared scopes', () => {
      mockExpenses = [
        { date: '2026-01-15' },
        { date: '2026-01-16', sharedBudgetId: 'shared-budget-1' },
      ]

      render(<Calendar />)

      expect(screen.getByText('15').querySelector('span')).toBeInTheDocument()
      expect(screen.getByText('16').querySelector('span')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Личные' }))

      expect(screen.getByText('15').querySelector('span')).toBeInTheDocument()
      expect(screen.getByText('16').querySelector('span')).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: 'Общие' }))

      expect(screen.getByText('15').querySelector('span')).toBeNull()
      expect(screen.getByText('16').querySelector('span')).toBeInTheDocument()
      expect(screen.getByText(/Зарплата:/)).toBeInTheDocument()
      expect(screen.getByText(/Аванс:/)).toBeInTheDocument()
    })

    it('highlights weekend headers with red color', () => {
      render(<Calendar />)

      const saturday = screen.getByText('Сб')
      const sunday = screen.getByText('Вс')

      expect(saturday).toHaveClass('text-red-400')
      expect(sunday).toHaveClass('text-red-400')
    })

    it('does not highlight weekday headers with red color', () => {
      render(<Calendar />)

      const monday = screen.getByText('Пн')
      const friday = screen.getByText('Пт')

      expect(monday).not.toHaveClass('text-red-400')
      expect(friday).not.toHaveClass('text-red-400')
    })

    it('displays current salary day value in legend', () => {
      render(<Calendar />)

      const salaryButton = screen.getByText(/Зарплата:/).closest('button')!
      expect(salaryButton).toHaveTextContent('10')
    })

    it('displays current advance day value in legend', () => {
      render(<Calendar />)

      const advanceButton = screen.getByText(/Аванс:/).closest('button')!
      expect(advanceButton).toHaveTextContent('25')
    })
  })

  describe('navigation', () => {
    it('calls prevMonth when clicking previous button', () => {
      render(<Calendar />)

      const prevButton = screen.getByLabelText('Предыдущий месяц')
      fireEvent.click(prevButton)

      expect(mockPrevMonth).toHaveBeenCalledTimes(1)
    })

    it('calls nextMonth when clicking next button', () => {
      render(<Calendar />)

      const nextButton = screen.getByLabelText('Следующий месяц')
      fireEvent.click(nextButton)

      expect(mockNextMonth).toHaveBeenCalledTimes(1)
    })
  })

  describe('date selection', () => {
    it('calls setSelectedDate when clicking a day', () => {
      render(<Calendar />)

      const day15 = screen.getAllByText('15')[0]
      fireEvent.click(day15)

      expect(mockSetSelectedDate).toHaveBeenCalled()
    })

    it('asks the layout to reveal the journal when a day is tapped', () => {
      const listener = jest.fn()
      const unsubscribe = subscribeWidgetReveal(listener)
      render(<Calendar />)

      fireEvent.click(screen.getAllByText('15')[0])

      expect(listener).toHaveBeenCalledWith('EXPENSE_LOG')
      unsubscribe()
    })
  })

  describe('inline salary day editing', () => {
    it('shows input when clicking salary legend', () => {
      render(<Calendar />)

      const salaryButton = screen.getByText(/Зарплата:/).closest('button')!
      fireEvent.click(salaryButton)

      expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    })

    it('input has current salary day value', () => {
      render(<Calendar />)

      const salaryButton = screen.getByText(/Зарплата:/).closest('button')!
      fireEvent.click(salaryButton)

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(10)
    })

    it('calls setSalaryDay on Enter key', () => {
      render(<Calendar />)

      const salaryButton = screen.getByText(/Зарплата:/).closest('button')!
      fireEvent.click(salaryButton)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '15' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockSetSalaryDay).toHaveBeenCalledWith(15)
    })

    it('calls setSalaryDay on blur', () => {
      render(<Calendar />)

      const salaryButton = screen.getByText(/Зарплата:/).closest('button')!
      fireEvent.click(salaryButton)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '20' } })
      fireEvent.blur(input)

      expect(mockSetSalaryDay).toHaveBeenCalledWith(20)
    })

    it('closes input on Escape without saving', () => {
      render(<Calendar />)

      const salaryButton = screen.getByText(/Зарплата:/).closest('button')!
      fireEvent.click(salaryButton)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '15' } })
      fireEvent.keyDown(input, { key: 'Escape' })

      expect(mockSetSalaryDay).not.toHaveBeenCalled()
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    })

    it('shows an error instead of saving a day above 31', () => {
      render(<Calendar />)

      const salaryButton = screen.getByText(/Зарплата:/).closest('button')!
      fireEvent.click(salaryButton)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '35' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockSetSalaryDay).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent('от 1 до 31')
      expect(screen.getByRole('spinbutton')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    })

    it('shows an error instead of saving day 0', () => {
      render(<Calendar />)

      const salaryButton = screen.getByText(/Зарплата:/).closest('button')!
      fireEvent.click(salaryButton)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '0' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockSetSalaryDay).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('discards an invalid value on blur without saving', () => {
      render(<Calendar />)

      fireEvent.click(screen.getByText(/Зарплата:/).closest('button')!)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '35' } })
      fireEvent.blur(input)

      expect(mockSetSalaryDay).not.toHaveBeenCalled()
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    })

    it('keeps the label and shows the range and keys while editing', () => {
      render(<Calendar />)

      fireEvent.click(screen.getByText(/Зарплата:/).closest('button')!)

      expect(screen.getByText('Зарплата:')).toBeInTheDocument()
      expect(screen.getByText(/1–31/)).toHaveTextContent(
        'Enter — сохранить, Esc — отмена'
      )
    })
  })

  describe('payday markers', () => {
    const markedDays = (ringClass: string) =>
      screen
        .getAllByRole('button')
        .filter((button) => button.className.includes(ringClass))
        .map((button) => button.textContent)

    it('marks salary day 31 on the last day of November', () => {
      mockSalaryDay = 31
      mockSelectedDate = new Date(2026, 10, 15)

      render(<Calendar />)

      expect(markedDays('ring-emerald-500/30')).toEqual(['30'])
    })

    it('marks advance day 30 on February 28 in a non-leap year', () => {
      mockAdvanceDay = 30
      mockSelectedDate = new Date(2026, 1, 10)

      render(<Calendar />)

      expect(markedDays('ring-amber-500/30')).toEqual(['28'])
    })

    it('keeps salary day 31 on the 31st in a long month', () => {
      mockSalaryDay = 31

      render(<Calendar />)

      expect(markedDays('ring-emerald-500/30')).toEqual(['31'])
    })

    it('shows both markers when salary 31 and advance 30 clamp to Nov 30', () => {
      mockSalaryDay = 31
      mockAdvanceDay = 30
      mockSelectedDate = new Date(2026, 10, 15)

      render(<Calendar />)

      const cell = screen.getByRole('button', { name: '30, Зарплата и аванс' })
      const dots = within(cell).getByTestId('payday-dots')
      expect(dots.querySelector('.bg-emerald-400')).toBeInTheDocument()
      expect(dots.querySelector('.bg-amber-400')).toBeInTheDocument()
      expect(cell.className).toContain('from-emerald-950/40')
      expect(cell.className).toContain('to-amber-950/40')
    })

    it('shows both markers on Feb 28 2027 for salary 31 and advance 30', () => {
      mockSalaryDay = 31
      mockAdvanceDay = 30
      mockSelectedDate = new Date(2027, 1, 10)

      render(<Calendar />)

      expect(
        screen.getByRole('button', { name: '28, Зарплата и аванс' })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /Зарплата,|, Зарплата$|, Аванс$/ })
      ).not.toBeInTheDocument()
    })

    it('shows both markers when salary and advance are the same day', () => {
      mockSalaryDay = 15
      mockAdvanceDay = 15

      render(<Calendar />)

      const cell = screen.getByRole('button', { name: '15, Зарплата и аванс' })
      const dots = within(cell).getByTestId('payday-dots')
      expect(dots.children).toHaveLength(2)
    })

    it('labels separate salary and advance days individually', () => {
      render(<Calendar />)

      expect(
        screen.getByRole('button', { name: '10, Зарплата' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: '25, Аванс' })
      ).toBeInTheDocument()
    })

    it('does not move a payday off a weekend', () => {
      // 2026-01-10 is a Saturday.
      mockSalaryDay = 10

      render(<Calendar />)

      expect(markedDays('ring-emerald-500/30')).toEqual(['10'])
    })
  })

  describe('inline advance day editing', () => {
    it('shows input when clicking advance legend', () => {
      render(<Calendar />)

      const advanceButton = screen.getByText(/Аванс:/).closest('button')!
      fireEvent.click(advanceButton)

      expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    })

    it('input has current advance day value', () => {
      render(<Calendar />)

      const advanceButton = screen.getByText(/Аванс:/).closest('button')!
      fireEvent.click(advanceButton)

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(25)
    })

    it('calls setAdvanceDay on Enter key', () => {
      render(<Calendar />)

      const advanceButton = screen.getByText(/Аванс:/).closest('button')!
      fireEvent.click(advanceButton)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '20' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockSetAdvanceDay).toHaveBeenCalledWith(20)
    })

    it('calls setAdvanceDay on blur', () => {
      render(<Calendar />)

      const advanceButton = screen.getByText(/Аванс:/).closest('button')!
      fireEvent.click(advanceButton)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '28' } })
      fireEvent.blur(input)

      expect(mockSetAdvanceDay).toHaveBeenCalledWith(28)
    })
  })
})
