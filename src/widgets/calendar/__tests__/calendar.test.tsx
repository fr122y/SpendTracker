import { render, screen, fireEvent } from '@testing-library/react'

import { Calendar } from '../ui/calendar'

// Mock query hooks with legacy aliases for the current component implementation
const mockSetSelectedDate = jest.fn()
const mockNextMonth = jest.fn()
const mockPrevMonth = jest.fn()
const mockSetSalaryDay = jest.fn()
const mockSetAdvanceDay = jest.fn()

const mockSelectedDate = new Date(2026, 0, 22)
let mockExpenseLoading = false
let mockSettingsLoading = false

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
      expenses: Array<{ date: string }>
      isLoading: boolean
    }) => unknown
  ) => selector({ expenses: [], isLoading: mockExpenseLoading }),
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
    mockExpenseLoading = false
    mockSettingsLoading = false
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

      expect(screen.getByText('Расход')).toBeInTheDocument()
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

    it('clamps value to max 31', () => {
      render(<Calendar />)

      const salaryButton = screen.getByText(/Зарплата:/).closest('button')!
      fireEvent.click(salaryButton)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '50' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockSetSalaryDay).toHaveBeenCalledWith(31)
    })

    it('clamps value to min 1', () => {
      render(<Calendar />)

      const salaryButton = screen.getByText(/Зарплата:/).closest('button')!
      fireEvent.click(salaryButton)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '0' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockSetSalaryDay).toHaveBeenCalledWith(1)
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
