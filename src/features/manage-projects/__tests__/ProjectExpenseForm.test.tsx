import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { categorizeExpenseAction } from '@/shared/api'

import { ProjectExpenseForm } from '../ui/project-expense-form'

// Mock the server action
jest.mock('@/shared/api', () => ({
  categorizeExpenseAction: jest.fn(),
}))

// Mock the stores
const mockAddExpense = jest.fn()
const mockCategories = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '6', name: 'Другое', emoji: '📝' },
]

jest.mock('@/entities/expense', () => ({
  useExpenseStore: (selector: (state: { addExpense: jest.Mock }) => unknown) =>
    selector({ addExpense: mockAddExpense }),
}))

jest.mock('@/entities/category', () => ({
  useCategoryStore: (
    selector: (state: { categories: typeof mockCategories }) => unknown
  ) => selector({ categories: mockCategories }),
}))

const mockSelectedDate = new Date('2025-01-15')
jest.mock('@/entities/session', () => ({
  useSessionStore: (selector: (state: { selectedDate: Date }) => unknown) =>
    selector({ selectedDate: mockSelectedDate }),
}))

const mockedCategorizeAction = categorizeExpenseAction as jest.MockedFunction<
  typeof categorizeExpenseAction
>

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('ProjectExpenseForm', () => {
  const projectId = 'project-1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form with description and amount inputs', () => {
    render(<ProjectExpenseForm projectId={projectId} />, {
      wrapper: TestWrapper,
    })

    expect(screen.getByPlaceholderText(/описание/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/сумма/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /добавить/i })
    ).toBeInTheDocument()
  })

  it('adds expense with projectId and selected date on submit', async () => {
    mockedCategorizeAction.mockResolvedValueOnce({
      category: 'Продукты',
      emoji: '🛒',
    })

    render(<ProjectExpenseForm projectId={projectId} />, {
      wrapper: TestWrapper,
    })

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'Материалы' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '5000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Материалы',
          amount: 5000,
          date: '2025-01-15',
          projectId: projectId,
        })
      )
    })
  })

  it('calls AI categorization with project context', async () => {
    mockedCategorizeAction.mockResolvedValueOnce({
      category: 'Продукты',
      emoji: '🛒',
    })

    render(<ProjectExpenseForm projectId={projectId} />, {
      wrapper: TestWrapper,
    })

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'Материалы' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '5000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockedCategorizeAction).toHaveBeenCalledWith(
        'Материалы',
        5000,
        mockCategories
      )
    })
  })

  it('resets form after submission', async () => {
    mockedCategorizeAction.mockResolvedValueOnce({
      category: 'Продукты',
      emoji: '🛒',
    })

    render(<ProjectExpenseForm projectId={projectId} />, {
      wrapper: TestWrapper,
    })

    const descriptionInput = screen.getByPlaceholderText(/описание/i)
    const amountInput = screen.getByPlaceholderText(/сумма/i)

    fireEvent.change(descriptionInput, { target: { value: 'Материалы' } })
    fireEvent.change(amountInput, { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(descriptionInput).toHaveValue('')
      expect(amountInput).toHaveValue('')
    })
  })

  it('falls back to "Другое" category on error', async () => {
    mockedCategorizeAction.mockRejectedValueOnce(new Error('API Error'))

    render(<ProjectExpenseForm projectId={projectId} />, {
      wrapper: TestWrapper,
    })

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'Материалы' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '5000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Другое',
          emoji: '📝',
          projectId: projectId,
        })
      )
    })
  })

  it('disables submit button when form is empty', () => {
    render(<ProjectExpenseForm projectId={projectId} />, {
      wrapper: TestWrapper,
    })

    const submitButton = screen.getByRole('button', { name: /добавить/i })
    expect(submitButton).toBeDisabled()
  })
})
