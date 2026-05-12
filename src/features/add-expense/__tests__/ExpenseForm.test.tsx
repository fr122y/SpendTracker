import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ExpenseForm } from '../ui/expense-form'

const mockAddExpense = jest.fn()
const mockCategorize = jest.fn()
const mockSaveMapping = jest.fn()

const mockCategories = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚕' },
  { id: '6', name: 'Другое', emoji: '📝' },
]

const mockProjects = [{ id: 'project-1', name: 'Отпуск' }]

jest.mock('@/entities/expense', () => ({
  useExpenseStore: (selector: (state: { addExpense: jest.Mock }) => unknown) =>
    selector({ addExpense: mockAddExpense }),
}))

jest.mock('@/entities/category', () => ({
  useCategoryStore: (
    selector: (state: { categories: typeof mockCategories }) => unknown
  ) => selector({ categories: mockCategories }),
}))

jest.mock('@/entities/project', () => ({
  useProjectStore: (
    selector: (state: { projects: typeof mockProjects }) => unknown
  ) => selector({ projects: mockProjects }),
}))

jest.mock('@/entities/session', () => ({
  useSessionStore: (selector: (state: { selectedDate: Date }) => unknown) =>
    selector({ selectedDate: new Date('2025-01-15') }),
}))

jest.mock('../model/use-categorize', () => ({
  useCategorize: () => ({
    categorize: mockCategorize,
    saveMappingAndGetResult: mockSaveMapping,
    mappingsLoaded: true,
    isSavingMapping: false,
  }),
}))

describe('ExpenseForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form fields', () => {
    render(<ExpenseForm />)

    expect(screen.getByPlaceholderText(/описание/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/сумма/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /добавить/i })
    ).toBeInTheDocument()
  })

  it('shows suggested category on description blur when match is found', async () => {
    mockCategorize.mockReturnValueOnce({
      found: true,
      categoryId: '1',
      categoryName: 'Продукты',
      categoryEmoji: '🛒',
    })

    render(<ExpenseForm />)

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'молоко' },
    })
    fireEvent.blur(screen.getByPlaceholderText(/описание/i))

    await waitFor(() => {
      expect(screen.getByText(/🛒 Продукты/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/категория/i)).not.toBeInTheDocument()
    })
  })

  it('shows category select when no match is found', async () => {
    mockCategorize.mockReturnValueOnce({ found: false })

    render(<ExpenseForm />)

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'неизвестная покупка' },
    })
    fireEvent.blur(screen.getByPlaceholderText(/описание/i))

    await waitFor(() => {
      expect(screen.getByLabelText(/категория/i)).toBeInTheDocument()
    })
  })

  it('submits with suggested category without saving mapping', async () => {
    mockCategorize.mockReturnValueOnce({
      found: true,
      categoryId: '1',
      categoryName: 'Продукты',
      categoryEmoji: '🛒',
    })

    render(<ExpenseForm />)

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'молоко' },
    })
    fireEvent.blur(screen.getByPlaceholderText(/описание/i))
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '100' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'молоко',
          amount: 100,
          category: 'Продукты',
          emoji: '🛒',
          date: '2025-01-15',
          projectId: undefined,
          operationType: 'expense',
        })
      )
      expect(mockSaveMapping).not.toHaveBeenCalled()
    })
  })

  it('saves mapping and submits when user selects category manually', async () => {
    mockCategorize.mockReturnValue({ found: false })
    mockSaveMapping.mockResolvedValueOnce(undefined)

    render(<ExpenseForm />)

    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'кофемашина' },
    })
    fireEvent.blur(screen.getByPlaceholderText(/описание/i))
    fireEvent.change(screen.getByLabelText(/категория/i), {
      target: { value: '2' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '5000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockSaveMapping).toHaveBeenCalledWith('кофемашина', '2')
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'кофемашина',
          amount: 5000,
          category: 'Транспорт',
          emoji: '🚕',
        })
      )
    })
  })

  it('disables submit button when required data is missing', () => {
    render(<ExpenseForm />)
    expect(screen.getByRole('button', { name: /добавить/i })).toBeDisabled()
  })

  it('creates a direct project expense from the project expense scenario', async () => {
    mockCategorize.mockReturnValueOnce({
      found: true,
      categoryId: '1',
      categoryName: 'Продукты',
      categoryEmoji: '🛒',
    })

    render(<ExpenseForm />)

    fireEvent.change(screen.getByLabelText(/сценарий операции/i), {
      target: { value: 'project_expense' },
    })
    fireEvent.change(screen.getByLabelText(/^проект$/i), {
      target: { value: 'project-1' },
    })
    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'материалы' },
    })
    fireEvent.blur(screen.getByPlaceholderText(/описание/i))
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '1200' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'материалы',
          amount: 1200,
          projectId: 'project-1',
          operationType: 'expense',
          category: 'Продукты',
        })
      )
    })
  })

  it('creates project money movements with the technical category', async () => {
    render(<ExpenseForm />)

    fireEvent.change(screen.getByLabelText(/сценарий операции/i), {
      target: { value: 'project_withdrawal' },
    })
    fireEvent.change(screen.getByLabelText(/^проект$/i), {
      target: { value: 'project-1' },
    })
    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'на неделю' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '3000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'на неделю',
          amount: 3000,
          projectId: 'project-1',
          operationType: 'project_withdrawal',
          category: 'Проектные деньги',
        })
      )
    })
  })
})
