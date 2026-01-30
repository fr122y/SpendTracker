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
} from '../../test-utils/expense-form-helpers'
import { ProjectExpenseForm } from '../ui/project-expense-form'

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

describe('ProjectExpenseForm', () => {
  const projectId = 'project-1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form with description and amount inputs', () => {
    render(<ProjectExpenseForm projectId={projectId} />, {
      wrapper: TestWrapper,
    })

    const { descriptionInput, amountInput, submitButton } =
      getFormElements(screen)
    expect(descriptionInput).toBeInTheDocument()
    expect(amountInput).toBeInTheDocument()
    expect(submitButton).toBeInTheDocument()
  })

  it('adds expense with projectId and selected date on submit', async () => {
    mockedCategorizeAction.mockResolvedValueOnce(
      mockCategoryResponses.groceries
    )

    render(<ProjectExpenseForm projectId={projectId} />, {
      wrapper: TestWrapper,
    })

    fillAndSubmitForm(screen, fireEvent, testExpenseData.project)

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: testExpenseData.project.description,
          amount: testExpenseData.project.amount,
          date: '2025-01-15',
          projectId: projectId,
        })
      )
    })
  })

  it('calls AI categorization with project context', async () => {
    mockedCategorizeAction.mockResolvedValueOnce(
      mockCategoryResponses.groceries
    )

    render(<ProjectExpenseForm projectId={projectId} />, {
      wrapper: TestWrapper,
    })

    fillAndSubmitForm(screen, fireEvent, testExpenseData.project)

    await waitFor(() => {
      expect(mockedCategorizeAction).toHaveBeenCalledWith(
        testExpenseData.project.description,
        testExpenseData.project.amount,
        mockCategories
      )
    })
  })

  it('resets form after submission', async () => {
    mockedCategorizeAction.mockResolvedValueOnce(
      mockCategoryResponses.groceries
    )

    render(<ProjectExpenseForm projectId={projectId} />, {
      wrapper: TestWrapper,
    })

    const { descriptionInput, amountInput } = getFormElements(screen)

    fillAndSubmitForm(screen, fireEvent, testExpenseData.project)

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

    fillAndSubmitForm(screen, fireEvent, testExpenseData.project)

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          category: mockCategoryResponses.other.category,
          emoji: mockCategoryResponses.other.emoji,
          projectId: projectId,
        })
      )
    })
  })

  it('disables submit button when form is empty', () => {
    render(<ProjectExpenseForm projectId={projectId} />, {
      wrapper: TestWrapper,
    })

    const { submitButton } = getFormElements(screen)
    expect(submitButton).toBeDisabled()
  })
})
