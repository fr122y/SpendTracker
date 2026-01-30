import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { categorizeExpenseAction } from '@/shared/api'

import {
  mockCategories,
  mockSelectedDate,
  createTestWrapper,
  testExpenseData,
  mockCategoryResponses,
  getFormElements,
  fillAndSubmitForm,
  createDelayedResolver,
} from '../../test-utils/expense-form-helpers'
import { ExpenseForm } from '../ui/expense-form'

// Mock the server action
jest.mock('@/shared/api', () => ({
  categorizeExpenseAction: jest.fn(),
}))

// Mock the stores
const mockAddExpense = jest.fn()

jest.mock('@/entities/expense', () => ({
  useExpenseStore: (selector: (state: { addExpense: jest.Mock }) => unknown) =>
    selector({ addExpense: mockAddExpense }),
}))

jest.mock('@/entities/category', () => ({
  useCategoryStore: (
    selector: (state: { categories: typeof mockCategories }) => unknown
  ) => selector({ categories: mockCategories }),
}))

jest.mock('@/entities/session', () => ({
  useSessionStore: (selector: (state: { selectedDate: Date }) => unknown) =>
    selector({ selectedDate: mockSelectedDate }),
}))

const mockedCategorizeAction = categorizeExpenseAction as jest.MockedFunction<
  typeof categorizeExpenseAction
>

const TestWrapper = createTestWrapper()

describe('ExpenseForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form with description and amount inputs', () => {
    render(<ExpenseForm />, { wrapper: TestWrapper })

    const { descriptionInput, amountInput, submitButton } =
      getFormElements(screen)
    expect(descriptionInput).toBeInTheDocument()
    expect(amountInput).toBeInTheDocument()
    expect(submitButton).toBeInTheDocument()
  })

  it('should trigger mutation on submit with correct parameters', async () => {
    mockedCategorizeAction.mockResolvedValueOnce(
      mockCategoryResponses.groceries
    )

    render(<ExpenseForm />, { wrapper: TestWrapper })

    fillAndSubmitForm(screen, fireEvent, testExpenseData.simple)

    await waitFor(() => {
      expect(mockedCategorizeAction).toHaveBeenCalledWith(
        testExpenseData.simple.description,
        testExpenseData.simple.amount,
        mockCategories
      )
    })
  })

  it('should add expense to store on successful categorization', async () => {
    mockedCategorizeAction.mockResolvedValueOnce(
      mockCategoryResponses.groceries
    )

    render(<ExpenseForm />, { wrapper: TestWrapper })

    fillAndSubmitForm(screen, fireEvent, testExpenseData.simple)

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: testExpenseData.simple.description,
          amount: testExpenseData.simple.amount,
          date: '2025-01-15',
          category: mockCategoryResponses.groceries.category,
          emoji: mockCategoryResponses.groceries.emoji,
        })
      )
    })
  })

  it('should reset form after successful submission', async () => {
    mockedCategorizeAction.mockResolvedValueOnce(
      mockCategoryResponses.groceries
    )

    render(<ExpenseForm />, { wrapper: TestWrapper })

    const { descriptionInput, amountInput } = getFormElements(screen)

    fillAndSubmitForm(screen, fireEvent, testExpenseData.simple)

    await waitFor(() => {
      expect(descriptionInput).toHaveValue('')
      expect(amountInput).toHaveValue('')
    })
  })

  it('should fallback to "Другое" category on error', async () => {
    mockedCategorizeAction.mockRejectedValueOnce(new Error('API Error'))

    render(<ExpenseForm />, { wrapper: TestWrapper })

    fillAndSubmitForm(screen, fireEvent, testExpenseData.fallback)

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: testExpenseData.fallback.description,
          amount: testExpenseData.fallback.amount,
          category: mockCategoryResponses.other.category,
          emoji: mockCategoryResponses.other.emoji,
        })
      )
    })
  })

  it('should disable submit button when form is empty', () => {
    render(<ExpenseForm />, { wrapper: TestWrapper })

    const { submitButton } = getFormElements(screen)
    expect(submitButton).toBeDisabled()
  })

  it('should disable submit button when only description is filled', () => {
    render(<ExpenseForm />, { wrapper: TestWrapper })

    const { descriptionInput, submitButton } = getFormElements(screen)
    fireEvent.change(descriptionInput, {
      target: { value: testExpenseData.simple.description },
    })

    expect(submitButton).toBeDisabled()
  })

  it('should show loading state during mutation', async () => {
    const { promise, resolve } = createDelayedResolver<{
      category: string
      emoji: string
    }>()
    mockedCategorizeAction.mockImplementation(() => promise)

    render(<ExpenseForm />, { wrapper: TestWrapper })

    fillAndSubmitForm(screen, fireEvent, testExpenseData.simple)

    await waitFor(() => {
      const { submitButton } = getFormElements(screen)
      expect(submitButton).toBeDisabled()
    })

    // Cleanup: resolve the promise to avoid warnings
    resolve(mockCategoryResponses.groceries)
  })
})
