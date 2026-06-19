import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ExpenseForm } from '../ui/expense-form'

import type { SharedBudget } from '@/shared/types'

const mockAddExpense = jest.fn()
const mockCategorize = jest.fn()
const mockCategorizeShared = jest.fn()
const mockSaveMapping = jest.fn()
const mockSaveSharedMapping = jest.fn()

const mockCategories = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚕' },
  { id: '6', name: 'Другое', emoji: '📝' },
]

let mockSharedBudgets: SharedBudget[] = [
  {
    id: 'shared-1',
    name: 'Дом',
    createdByUserId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    role: 'owner' as const,
    isActive: true,
    members: [],
    weeklyLimits: [],
  },
]
let mockSharedCategories = [
  {
    id: 'shared-category-1',
    sharedBudgetId: 'shared-1',
    name: 'Продукты общие',
    emoji: '🧺',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
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
  useSharedBudgetCategories: () => ({ data: mockSharedCategories }),
}))

jest.mock('@/entities/shared-budget', () => ({
  getActiveSharedBudget: (budgets: typeof mockSharedBudgets) =>
    budgets.find((budget) => budget.isActive && !budget.archivedAt),
  useSharedBudgets: () => ({ data: mockSharedBudgets }),
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
  useSharedCategorize: () => ({
    categorize: mockCategorizeShared,
    saveMappingAndGetResult: mockSaveSharedMapping,
    mappingsLoaded: true,
    isSavingMapping: false,
  }),
}))

describe('ExpenseForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCategorizeShared.mockReturnValue({ found: false })
    mockSaveSharedMapping.mockResolvedValue(undefined)
    mockSharedBudgets = [
      {
        id: 'shared-1',
        name: 'Дом',
        createdByUserId: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        role: 'owner',
        isActive: true,
        members: [],
        weeklyLimits: [],
      },
    ]
    mockSharedCategories = [
      {
        id: 'shared-category-1',
        sharedBudgetId: 'shared-1',
        name: 'Продукты общие',
        emoji: '🧺',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
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

  it('creates a shared expense with a shared budget category', async () => {
    mockCategorizeShared.mockReturnValue({ found: false })
    mockSaveSharedMapping.mockResolvedValueOnce(undefined)

    render(<ExpenseForm />)

    fireEvent.change(screen.getByLabelText(/сценарий операции/i), {
      target: { value: 'shared_expense' },
    })
    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'ужин' },
    })
    fireEvent.change(screen.getByLabelText(/категория общего бюджета/i), {
      target: { value: 'shared-category-1' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '1600' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockCategorize).not.toHaveBeenCalled()
      expect(mockSaveMapping).not.toHaveBeenCalled()
      expect(mockSaveSharedMapping).toHaveBeenCalledWith(
        'ужин',
        'shared-category-1'
      )
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'ужин',
          amount: 1600,
          category: 'Продукты общие',
          emoji: '🧺',
          sharedBudgetId: 'shared-1',
          sharedBudgetCategoryId: 'shared-category-1',
          sharedBudgetName: 'Дом',
          operationType: 'expense',
        })
      )
    })
  })

  it('shows suggested shared category on description blur when match is found', async () => {
    mockCategorizeShared.mockReturnValueOnce({
      found: true,
      categoryId: 'shared-category-1',
      categoryName: 'Продукты общие',
      categoryEmoji: '🧺',
    })

    render(<ExpenseForm />)

    fireEvent.change(screen.getByLabelText(/сценарий операции/i), {
      target: { value: 'shared_expense' },
    })
    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'молоко' },
    })
    fireEvent.blur(screen.getByPlaceholderText(/описание/i))

    await waitFor(() => {
      expect(screen.getByText(/🧺 Продукты общие/i)).toBeInTheDocument()
      expect(
        screen.queryByLabelText(/категория общего бюджета/i)
      ).not.toBeInTheDocument()
    })
  })

  it('submits shared expense with suggested category without saving mapping', async () => {
    mockCategorizeShared.mockReturnValueOnce({
      found: true,
      categoryId: 'shared-category-1',
      categoryName: 'Продукты общие',
      categoryEmoji: '🧺',
    })

    render(<ExpenseForm />)

    fireEvent.change(screen.getByLabelText(/сценарий операции/i), {
      target: { value: 'shared_expense' },
    })
    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'молоко' },
    })
    fireEvent.blur(screen.getByPlaceholderText(/описание/i))
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '300' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockSaveSharedMapping).not.toHaveBeenCalled()
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'молоко',
          amount: 300,
          category: 'Продукты общие',
          emoji: '🧺',
          sharedBudgetCategoryId: 'shared-category-1',
        })
      )
    })
  })

  it('saves shared mapping when user changes suggested shared category', async () => {
    mockSharedCategories = [
      {
        id: 'shared-category-1',
        sharedBudgetId: 'shared-1',
        name: 'Продукты общие',
        emoji: '🧺',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'shared-category-2',
        sharedBudgetId: 'shared-1',
        name: 'Кафе',
        emoji: '☕',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    mockCategorizeShared.mockReturnValueOnce({
      found: true,
      categoryId: 'shared-category-1',
      categoryName: 'Продукты общие',
      categoryEmoji: '🧺',
    })
    mockSaveSharedMapping.mockResolvedValueOnce(undefined)

    render(<ExpenseForm />)

    fireEvent.change(screen.getByLabelText(/сценарий операции/i), {
      target: { value: 'shared_expense' },
    })
    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'кофе' },
    })
    fireEvent.blur(screen.getByPlaceholderText(/описание/i))

    await screen.findByText(/🧺 Продукты общие/i)
    fireEvent.click(screen.getByRole('button', { name: /изменить/i }))
    fireEvent.change(screen.getByLabelText(/категория общего бюджета/i), {
      target: { value: 'shared-category-2' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '450' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockSaveSharedMapping).toHaveBeenCalledWith(
        'кофе',
        'shared-category-2'
      )
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Кафе',
          emoji: '☕',
          sharedBudgetCategoryId: 'shared-category-2',
        })
      )
    })
  })

  it('does not overwrite a manual shared category after description blur', async () => {
    mockSharedCategories = [
      {
        id: 'shared-category-1',
        sharedBudgetId: 'shared-1',
        name: 'Продукты общие',
        emoji: '🧺',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'shared-category-2',
        sharedBudgetId: 'shared-1',
        name: 'Кафе',
        emoji: '☕',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    mockCategorizeShared.mockReturnValue({
      found: true,
      categoryId: 'shared-category-1',
      categoryName: 'Продукты общие',
      categoryEmoji: '🧺',
    })

    render(<ExpenseForm />)

    fireEvent.change(screen.getByLabelText(/сценарий операции/i), {
      target: { value: 'shared_expense' },
    })
    fireEvent.change(screen.getByLabelText(/категория общего бюджета/i), {
      target: { value: 'shared-category-2' },
    })
    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'кофе' },
    })
    fireEvent.blur(screen.getByPlaceholderText(/описание/i))
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '450' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Кафе',
          emoji: '☕',
          sharedBudgetCategoryId: 'shared-category-2',
        })
      )
    })
  })

  it('does not show shared expense scenario without active shared budgets', () => {
    mockSharedBudgets = []

    render(<ExpenseForm />)

    expect(screen.queryByText('Общий расход')).not.toBeInTheDocument()
  })

  it('lets the user choose among active shared budgets', async () => {
    mockSharedBudgets = [
      {
        id: 'shared-1',
        name: 'Дом',
        createdByUserId: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        role: 'owner',
        isActive: true,
        members: [],
        weeklyLimits: [],
      },
      {
        id: 'shared-2',
        name: 'Путешествие',
        createdByUserId: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        role: 'member',
        isActive: false,
        members: [],
        weeklyLimits: [],
      },
    ]
    mockSharedCategories = [
      {
        id: 'shared-category-2',
        sharedBudgetId: 'shared-2',
        name: 'Билеты',
        emoji: '🎫',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    render(<ExpenseForm />)

    fireEvent.change(screen.getByLabelText(/сценарий операции/i), {
      target: { value: 'shared_expense' },
    })
    fireEvent.change(screen.getByLabelText(/^общий бюджет$/i), {
      target: { value: 'shared-2' },
    })
    fireEvent.change(screen.getByPlaceholderText(/описание/i), {
      target: { value: 'самолет' },
    })
    fireEvent.change(screen.getByLabelText(/категория общего бюджета/i), {
      target: { value: 'shared-category-2' },
    })
    fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
      target: { value: '9000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          sharedBudgetId: 'shared-2',
          sharedBudgetCategoryId: 'shared-category-2',
          sharedBudgetName: 'Путешествие',
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
