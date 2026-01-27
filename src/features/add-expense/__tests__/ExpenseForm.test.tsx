import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { categorizeExpenseAction } from '@/shared/api'

import { ExpenseForm } from '../ui/expense-form'

// Mock the server action
jest.mock('@/shared/api', () => ({
  categorizeExpenseAction: jest.fn(),
}))

// Mock the stores
const mockAddExpense = jest.fn()
const mockCategories = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚕' },
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

describe('ExpenseForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form with description and amount inputs', () => {
    render(<ExpenseForm />, { wrapper: TestWrapper })

    expect(screen.getByPlaceholderText(/описание/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/сумма/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /добавить/i })
    ).toBeInTheDocument()
  })

  it('should trigger mutation on submit with correct parameters', async () => {
    mockedCategorizeAction.mockResolvedValueOnce({
      category: 'Продукты',
      emoji: '🛒',
    })

    render(<ExpenseForm />, { wrapper: TestWrapper })

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'Молоко' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '100' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockedCategorizeAction).toHaveBeenCalledWith(
        'Молоко',
        100,
        mockCategories
      )
    })
  })

  it('should add expense to store on successful categorization', async () => {
    mockedCategorizeAction.mockResolvedValueOnce({
      category: 'Продукты',
      emoji: '🛒',
    })

    render(<ExpenseForm />, { wrapper: TestWrapper })

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'Молоко' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '100' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Молоко',
          amount: 100,
          date: '2025-01-15',
          category: 'Продукты',
          emoji: '🛒',
        })
      )
    })
  })

  it('should reset form after successful submission', async () => {
    mockedCategorizeAction.mockResolvedValueOnce({
      category: 'Продукты',
      emoji: '🛒',
    })

    render(<ExpenseForm />, { wrapper: TestWrapper })

    const descriptionInput = screen.getByPlaceholderText(/описание/i)
    const amountInput = screen.getByPlaceholderText(/сумма/i)

    fireEvent.change(descriptionInput, { target: { value: 'Молоко' } })
    fireEvent.change(amountInput, { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(descriptionInput).toHaveValue('')
      expect(amountInput).toHaveValue('')
    })
  })

  it('should fallback to "Другое" category on error', async () => {
    mockedCategorizeAction.mockRejectedValueOnce(new Error('API Error'))

    render(<ExpenseForm />, { wrapper: TestWrapper })

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'Что-то' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '500' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Что-то',
          amount: 500,
          category: 'Другое',
          emoji: '📝',
        })
      )
    })
  })

  it('should disable submit button when form is empty', () => {
    render(<ExpenseForm />, { wrapper: TestWrapper })

    const submitButton = screen.getByRole('button', { name: /добавить/i })
    expect(submitButton).toBeDisabled()
  })

  it('should disable submit button when only description is filled', () => {
    render(<ExpenseForm />, { wrapper: TestWrapper })

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'Молоко' },
    })

    const submitButton = screen.getByRole('button', { name: /добавить/i })
    expect(submitButton).toBeDisabled()
  })

  it('should show loading state during mutation', async () => {
    let resolvePromise: (value: { category: string; emoji: string }) => void
    mockedCategorizeAction.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve
        })
    )

    render(<ExpenseForm />, { wrapper: TestWrapper })

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'Молоко' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '100' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /добавить/i })).toBeDisabled()
    })

    // Cleanup: resolve the promise to avoid warnings
    resolvePromise!({ category: 'Продукты', emoji: '🛒' })
  })
})
