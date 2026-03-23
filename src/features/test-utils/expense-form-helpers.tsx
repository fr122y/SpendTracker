import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent as fireEventType, type Screen } from '@testing-library/react'

/**
 * Shared test utilities for ExpenseForm and ProjectExpenseForm tests
 */

// Standard mock categories used across expense form tests
export const mockCategories = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚕' },
  { id: '6', name: 'Другое', emoji: '📝' },
]

// Standard selected date for testing
export const mockSelectedDate = new Date('2025-01-15')

/**
 * Creates QueryClient wrapper for testing with retry disabled
 */
export function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  })
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

/**
 * Setup mocks for expense form tests.
 * Exposes both query-hook style mocks and legacy store aliases so the tests can
 * run while the component migration is still in flight.
 */
export function setupExpenseFormMocks() {
  const mockAddExpense = jest.fn()

  // Mock expense hooks
  jest.mock('@/entities/expense', () => ({
    useExpenses: () => ({ data: [], isLoading: false }),
    useAddExpense: () => ({ mutate: mockAddExpense, isPending: false }),
    useExpenseStore: (
      selector: (state: { addExpense: jest.Mock }) => unknown
    ) => selector({ addExpense: mockAddExpense }),
  }))

  // Mock category hooks
  jest.mock('@/entities/category', () => ({
    useCategories: () => ({ data: mockCategories, isLoading: false }),
    useCategoryStore: (
      selector: (state: { categories: typeof mockCategories }) => unknown
    ) => selector({ categories: mockCategories }),
  }))

  // Mock session store
  jest.mock('@/entities/session', () => ({
    useSessionStore: (selector: (state: { selectedDate: Date }) => unknown) =>
      selector({ selectedDate: mockSelectedDate }),
  }))

  return { mockAddExpense }
}

/**
 * Common test data for expense form submissions
 */
export const testExpenseData = {
  simple: {
    description: 'Молоко',
    amount: 100,
  },
  project: {
    description: 'Материалы',
    amount: 5000,
  },
  fallback: {
    description: 'Что-то',
    amount: 500,
  },
}

/**
 * Common AI categorization responses
 */
export const mockCategoryResponses = {
  groceries: {
    category: 'Продукты',
    emoji: '🛒',
  },
  other: {
    category: 'Другое',
    emoji: '📝',
  },
}

/**
 * Helper to get form elements consistently
 */
export function getFormElements(screen: Screen) {
  return {
    descriptionInput: screen.getByPlaceholderText(/описание/i),
    amountInput: screen.getByPlaceholderText(/сумма/i),
    submitButton: screen.getByRole('button', { name: /добавить/i }),
  }
}

/**
 * Helper to fill form with test data
 */
export function fillExpenseForm(
  screen: Screen,
  fireEvent: typeof fireEventType,
  data: { description: string; amount: number }
) {
  const { descriptionInput, amountInput } = getFormElements(screen)
  fireEvent.change(descriptionInput, { target: { value: data.description } })
  fireEvent.change(amountInput, { target: { value: data.amount.toString() } })
}

/**
 * Helper to submit the form
 */
export function submitExpenseForm(
  screen: Screen,
  fireEvent: typeof fireEventType
) {
  const { submitButton } = getFormElements(screen)
  fireEvent.click(submitButton)
}

/**
 * Helper to fill and submit form in one action
 */
export function fillAndSubmitForm(
  screen: Screen,
  fireEvent: typeof fireEventType,
  data: { description: string; amount: number }
) {
  fillExpenseForm(screen, fireEvent, data)
  submitExpenseForm(screen, fireEvent)
}

/**
 * Create a delayed promise resolver for testing loading states
 */
export function createDelayedResolver<T>() {
  let resolvePromise: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })
  return {
    promise,
    resolve: (value: T) => resolvePromise(value),
  }
}
