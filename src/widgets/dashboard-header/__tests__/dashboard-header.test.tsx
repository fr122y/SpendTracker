import { fireEvent, render, screen } from '@testing-library/react'

import { DashboardHeader } from '../ui/dashboard-header'

const mockNextDay = jest.fn()
const mockPrevDay = jest.fn()
const mockSetToday = jest.fn()
const mockSetSelectedDate = jest.fn()
const mockToggleEditMode = jest.fn()

let mockSelectedDate = new Date(2026, 0, 15)
let mockIsEditMode = false

jest.mock('@/entities/session', () => ({
  useSessionStore: () => ({
    selectedDate: mockSelectedDate,
    nextDay: mockNextDay,
    prevDay: mockPrevDay,
    setToday: mockSetToday,
    setSelectedDate: mockSetSelectedDate,
  }),
}))

jest.mock('@/features/layout-editor', () => ({
  useEditMode: () => ({
    isEditMode: mockIsEditMode,
    toggleEditMode: mockToggleEditMode,
  }),
}))

jest.mock('@/features/month-picker', () => ({
  MonthPickerModal: ({
    isOpen,
  }: {
    isOpen: boolean
    currentDate: Date
    onSelectMonth: (date: Date) => void
    onClose: () => void
  }) =>
    isOpen ? <div data-testid="month-picker-modal">month picker</div> : null,
}))

describe('DashboardHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 15))
    mockSelectedDate = new Date(2026, 0, 15)
    mockIsEditMode = false
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the application title', () => {
    render(<DashboardHeader />)

    expect(
      screen.getByRole('heading', { name: 'SmartSpend Terminal' })
    ).toBeInTheDocument()
  })

  it('renders the full selected date in Russian format', () => {
    render(<DashboardHeader />)

    expect(
      screen.getByRole('button', { name: 'Выбрать месяц' })
    ).toHaveTextContent('15 января 2026 г.')
  })

  it('renders day navigation buttons', () => {
    render(<DashboardHeader />)

    expect(screen.getByLabelText('Предыдущий день')).toBeInTheDocument()
    expect(screen.getByLabelText('Следующий день')).toBeInTheDocument()
  })

  it('calls prevDay when clicking previous button', () => {
    render(<DashboardHeader />)

    fireEvent.click(screen.getByLabelText('Предыдущий день'))

    expect(mockPrevDay).toHaveBeenCalledTimes(1)
  })

  it('calls nextDay when clicking next button', () => {
    render(<DashboardHeader />)

    fireEvent.click(screen.getByLabelText('Следующий день'))

    expect(mockNextDay).toHaveBeenCalledTimes(1)
  })

  it('opens month picker when clicking the selected date', () => {
    render(<DashboardHeader />)

    fireEvent.click(screen.getByLabelText('Выбрать месяц'))

    expect(screen.getByTestId('month-picker-modal')).toBeInTheDocument()
  })

  it('shows today button only when selected date differs from current day', () => {
    mockSelectedDate = new Date(2026, 0, 16)

    render(<DashboardHeader />)

    expect(screen.getAllByRole('button', { name: 'Сегодня' })).toHaveLength(2)
  })

  it('hides today button when selected date is today', () => {
    render(<DashboardHeader />)

    expect(screen.queryByText('Сегодня')).not.toBeInTheDocument()
  })

  it('calls setToday when clicking today button', () => {
    mockSelectedDate = new Date(2026, 0, 16)

    render(<DashboardHeader />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Сегодня' })[0])

    expect(mockSetToday).toHaveBeenCalledTimes(1)
  })

  it('calls toggleEditMode when clicking edit button', () => {
    render(<DashboardHeader />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Редактировать' })[0])

    expect(mockToggleEditMode).toHaveBeenCalledTimes(1)
  })

  it('renders done state when edit mode is active', () => {
    mockIsEditMode = true

    render(<DashboardHeader />)

    expect(screen.getAllByRole('button', { name: 'Готово' })).toHaveLength(2)
  })

  it('shows mobile touch-friendly button sizing', () => {
    render(<DashboardHeader />)

    expect(screen.getByLabelText('Предыдущий день')).toHaveClass(
      'min-h-[44px]',
      'min-w-[44px]'
    )
    expect(screen.getByLabelText('Следующий день')).toHaveClass(
      'min-h-[44px]',
      'min-w-[44px]'
    )
    expect(
      screen.getAllByRole('button', { name: 'Редактировать' })[0]
    ).toHaveClass('min-h-11', 'min-w-[44px]')
  })
})
