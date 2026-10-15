import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ProjectExpenseForm } from '../ui/project-expense-form'

const mockAddExpense = jest.fn()
const mockCategorize = jest.fn()
const mockSaveMapping = jest.fn()
let mockExpenses: Array<Record<string, unknown>> = []

const mockCategories = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚕' },
  { id: '6', name: 'Другое', emoji: '📝' },
]

jest.mock('@/entities/expense', () => ({
  useExpenseStore: (
    selector: (state: {
      addExpense: jest.Mock
      expenses: typeof mockExpenses
    }) => unknown
  ) => selector({ addExpense: mockAddExpense, expenses: mockExpenses }),
}))

jest.mock('@/entities/category', () => ({
  useCategorize: () => ({
    categorize: mockCategorize,
    saveMappingAndGetResult: mockSaveMapping,
    mappingsLoaded: true,
    isSavingMapping: false,
  }),
  useCategoryStore: (
    selector: (state: { categories: typeof mockCategories }) => unknown
  ) => selector({ categories: mockCategories }),
}))

jest.mock('@/entities/session', () => ({
  useSessionStore: (selector: (state: { selectedDate: Date }) => unknown) =>
    selector({ selectedDate: new Date('2025-01-15') }),
}))

describe('ProjectExpenseForm', () => {
  const projectId = 'project-1'

  beforeEach(() => {
    jest.clearAllMocks()
    mockExpenses = [
      {
        id: 'withdrawal-1',
        description: 'взял',
        amount: 5000,
        date: '2025-01-10',
        category: 'Проектные деньги',
        emoji: '💼',
        projectId,
        operationType: 'project_withdrawal',
      },
      {
        id: 'return-1',
        description: 'вернул',
        amount: 1000,
        date: '2025-01-11',
        category: 'Проектные деньги',
        emoji: '💼',
        projectId,
        operationType: 'project_return',
      },
    ]
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

  it('adds project movement with the technical category', async () => {
    render(<ProjectExpenseForm projectId={projectId} />)

    fireEvent.change(screen.getByLabelText(/сценарий операции проекта/i), {
      target: { value: 'project_return' },
    })
    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'остаток' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '500' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'остаток',
          amount: 500,
          projectId,
          operationType: 'project_return',
          category: 'Проектные деньги',
        })
      )
    })
  })

  it('rejects a return larger than the cash on hand with an inline error', () => {
    render(<ProjectExpenseForm projectId={projectId} />)

    fireEvent.change(screen.getByLabelText(/сценарий операции проекта/i), {
      target: { value: 'project_return' },
    })
    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'лишнее' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '4001' },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      /Нельзя вернуть больше, чем на руках: 4\s000 ₽/
    )
    expect(screen.getByRole('button', { name: /добавить/i })).toBeDisabled()
    fireEvent.submit(screen.getByRole('button', { name: /добавить/i }))
    expect(mockAddExpense).not.toHaveBeenCalled()
  })

  it('allows returning exactly the cash on hand', async () => {
    render(<ProjectExpenseForm projectId={projectId} />)

    fireEvent.change(screen.getByLabelText(/сценарий операции проекта/i), {
      target: { value: 'project_return' },
    })
    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'всё' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '4000' },
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))
    await waitFor(() =>
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 4000,
          operationType: 'project_return',
        })
      )
    )
  })
})
