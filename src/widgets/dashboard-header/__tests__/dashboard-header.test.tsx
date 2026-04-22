import { fireEvent, render, screen } from '@testing-library/react'

import { DashboardHeader } from '../ui/dashboard-header'

const mockNextDay = jest.fn()
const mockPrevDay = jest.fn()
const mockSetToday = jest.fn()
const mockSetSelectedDate = jest.fn()
const mockToggleEditMode = jest.fn()

let mockSelectedDate = new Date(2026, 0, 15)
let mockIsEditMode = false
let mockViewport = 'desktop'
let mockIsMobile = false

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
  useLayoutStore: () => ({
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

jest.mock('@/shared/lib', () => ({
  ...jest.requireActual('@/shared/lib'),
  useViewport: () => mockViewport,
  isMobile: () => mockIsMobile,
}))

describe('DashboardHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 15))
    mockSelectedDate = new Date(2026, 0, 15)
    mockIsEditMode = false
    mockViewport = 'desktop'
    mockIsMobile = false
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the application title', () => {
    render(<DashboardHeader />)

    expect(screen.getByText('SmartSpend Terminal')).toBeInTheDocument()
  })

  it('renders the full selected date in Russian format', () => {
    render(<DashboardHeader />)

    expect(screen.getByText('15 января 2026 г.')).toBeInTheDocument()
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

    expect(screen.getAllByText('Сегодня').length).toBeGreaterThanOrEqual(1)
  })

  it('hides today button when selected date is today', () => {
    render(<DashboardHeader />)

    expect(screen.queryByText('Сегодня')).not.toBeInTheDocument()
  })

  it('calls setToday when clicking today button', () => {
    mockSelectedDate = new Date(2026, 0, 16)

    render(<DashboardHeader />)

    fireEvent.click(screen.getAllByText('Сегодня')[0])

    expect(mockSetToday).toHaveBeenCalledTimes(1)
  })

  it('calls toggleEditMode when clicking edit button', () => {
    render(<DashboardHeader />)

    fireEvent.click(screen.getAllByLabelText('Редактировать')[0])

    expect(mockToggleEditMode).toHaveBeenCalledTimes(1)
  })

  it('shows mobile touch-friendly button sizing', () => {
    mockViewport = 'mobile'
    mockIsMobile = true

    render(<DashboardHeader />)

    expect(screen.getByLabelText('Предыдущий день')).toHaveClass(
      'min-h-[44px]',
      'min-w-[44px]'
    )
  })
})
