import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ProjectExpenseForm } from '../ui/project-expense-form'

const mockAddExpense = jest.fn()
const mockCategorize = jest.fn()
const mockSaveMapping = jest.fn()

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

jest.mock('@/entities/session', () => ({
  useSessionStore: (selector: (state: { selectedDate: Date }) => unknown) =>
    selector({ selectedDate: new Date('2025-01-15') }),
}))

jest.mock('@/features/add-expense/model/use-categorize', () => ({
  useCategorize: () => ({
    categorize: mockCategorize,
    saveMappingAndGetResult: mockSaveMapping,
    mappingsLoaded: true,
    isSavingMapping: false,
  }),
}))

describe('ProjectExpenseForm', () => {
  const projectId = 'project-1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('adds project expense with suggested category', async () => {
    mockCategorize.mockReturnValueOnce({
      found: true,
      categoryId: '1',
      categoryName: 'Продукты',
      categoryEmoji: '🛒',
    })

    render(<ProjectExpenseForm projectId={projectId} />)

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'молоко' },
    })
    fireEvent.blur(screen.getByPlaceholderText(/описание/i))
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '250' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'молоко',
          amount: 250,
          projectId,
          category: 'Продукты',
          emoji: '🛒',
        })
      )
      expect(mockSaveMapping).not.toHaveBeenCalled()
    })
  })

  it('shows category select and saves mapping for manual choice', async () => {
    mockCategorize.mockReturnValue({ found: false })
    mockSaveMapping.mockResolvedValueOnce(undefined)

    render(<ProjectExpenseForm projectId={projectId} />)

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'поездка' },
    })
    fireEvent.blur(screen.getByPlaceholderText(/описание/i))
    fireEvent.change(screen.getByLabelText(/категория/i), {
      target: { value: '2' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '700' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockSaveMapping).toHaveBeenCalledWith('поездка', '2')
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId,
          category: 'Транспорт',
          emoji: '🚕',
        })
      )
    })
  })

  it('disables submit button when form is empty', () => {
    render(<ProjectExpenseForm projectId={projectId} />)
    expect(screen.getByRole('button', { name: /добавить/i })).toBeDisabled()
  })
})
