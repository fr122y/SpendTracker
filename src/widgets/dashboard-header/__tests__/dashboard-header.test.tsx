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

  it('renders a single account link', () => {
    render(<DashboardHeader />)

    const accountLink = screen.getByRole('link', { name: 'Аккаунт' })

    expect(accountLink).toHaveAttribute('href', '/account')
    expect(accountLink).toHaveAttribute('title', 'Аккаунт')
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

    const todayButton = screen.getByRole('button', { name: 'Сегодня' })
    expect(todayButton).toHaveAttribute('title', 'Сегодня')
    expect(screen.getByTestId('header-today-slot')).not.toHaveClass('invisible')
  })

  it('keeps the today slot in the layout but hidden when selected date is today', () => {
    render(<DashboardHeader />)

    const slot = screen.getByTestId('header-today-slot')
    expect(slot).toHaveClass('invisible')
    expect(slot).toHaveAttribute('aria-hidden', 'true')
    expect(
      screen.queryByRole('button', { name: 'Сегодня' })
    ).not.toBeInTheDocument()
  })

  it('calls setToday when clicking today button', () => {
    mockSelectedDate = new Date(2026, 0, 16)

    render(<DashboardHeader />)

    fireEvent.click(screen.getByRole('button', { name: 'Сегодня' }))

    expect(mockSetToday).toHaveBeenCalledTimes(1)
  })

  it('calls toggleEditMode when clicking edit button', () => {
    render(<DashboardHeader />)

    fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }))

    expect(mockToggleEditMode).toHaveBeenCalledTimes(1)
  })

  it('renders done state when edit mode is active', () => {
    mockIsEditMode = true

    render(<DashboardHeader />)

    expect(screen.getByRole('button', { name: 'Готово' })).toBeInTheDocument()
  })

  it('hides the edit button on phones and gives it a fixed width', () => {
    render(<DashboardHeader />)

    expect(screen.getByRole('button', { name: 'Редактировать' })).toHaveClass(
      'hidden',
      'md:inline-flex',
      'w-11',
      'xl:w-44'
    )
  })

  it('uses icon buttons with fixed widths for header actions', () => {
    mockSelectedDate = new Date(2026, 0, 16)

    render(<DashboardHeader />)

    for (const control of [
      screen.getByRole('button', { name: 'Сегодня' }),
      screen.getByRole('link', { name: 'Аккаунт' }),
      screen.getByRole('button', { name: 'Редактировать' }),
    ]) {
      expect(control).toHaveClass('min-h-11', 'w-11', 'shrink-0')
    }
  })

  it('shows touch-friendly day navigation buttons', () => {
    render(<DashboardHeader />)

    expect(screen.getByLabelText('Предыдущий день')).toHaveClass(
      'min-h-[44px]',
      'min-w-[44px]'
    )
    expect(screen.getByLabelText('Следующий день')).toHaveClass(
      'min-h-[44px]',
      'min-w-[44px]'
    )
  })

  it('keeps the header on one non-wrapping row from the tablet breakpoint', () => {
    render(<DashboardHeader />)

    expect(screen.getByRole('banner')).toHaveClass('flex', 'md:flex-nowrap')
    expect(screen.getByTestId('header-actions')).toHaveClass(
      'shrink-0',
      'md:flex-1'
    )
  })
})
