import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { POCKET_PURCHASE_HINT } from '@/entities/pocket/model/hints'

import { ExpenseForm } from '../ui/expense-form'

import type { Pocket, SharedBudget } from '@/shared/types'

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

let mockProjects = [{ id: 'project-1', name: 'Отпуск' }]
let mockExpenses: Array<Record<string, unknown>> = []

const ACTIVE_POCKET: Pocket = {
  id: 'pocket-1',
  name: 'Одежда',
  createdAt: '2026-01-01T00:00:00.000Z',
}
const SECOND_ACTIVE_POCKET: Pocket = {
  id: 'pocket-2',
  name: 'Подарки',
  createdAt: '2026-01-02T00:00:00.000Z',
}
const ARCHIVED_POCKET: Pocket = {
  id: 'pocket-archived',
  name: 'Старый карман',
  archivedAt: '2026-01-10T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
}

let mockPockets: Pocket[] | undefined = []

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
  useSharedCategorize: () => ({
    categorize: mockCategorizeShared,
    saveMappingAndGetResult: mockSaveSharedMapping,
    mappingsLoaded: true,
    isSavingMapping: false,
  }),
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

jest.mock('@/entities/pocket', () => ({
  ...jest.requireActual('@/entities/pocket/model/hints'),
  usePockets: () => ({ data: mockPockets }),
}))

jest.mock('@/entities/session', () => ({
  useSessionStore: (selector: (state: { selectedDate: Date }) => unknown) =>
    selector({ selectedDate: new Date('2025-01-15') }),
}))

describe('ExpenseForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPockets = []
    mockProjects = [{ id: 'project-1', name: 'Отпуск' }]
    mockExpenses = []
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

  it('adds one expense for a rapid triple submit while the mapping saves', async () => {
    let resolveMapping!: () => void
    mockCategorize.mockReturnValue({ found: false })
    mockSaveMapping.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveMapping = resolve))
    )

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
    const form = screen
      .getByRole('button', { name: /добавить/i })
      .closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    fireEvent.submit(form)

    await act(async () => resolveMapping())

    await waitFor(() => expect(mockAddExpense).toHaveBeenCalledTimes(1))
    expect(mockSaveMapping).toHaveBeenCalledTimes(1)
    expect(mockAddExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        description: 'кофемашина',
      })
    )
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

  describe('project return limit', () => {
    beforeEach(() => {
      mockExpenses = [
        {
          id: 'withdrawal-1',
          description: 'взял',
          amount: 5000,
          date: '2025-01-10',
          category: 'Проектные деньги',
          emoji: '💼',
          projectId: 'project-1',
          operationType: 'project_withdrawal',
        },
        {
          id: 'project-expense-1',
          description: 'краска',
          amount: 700,
          date: '2025-01-11',
          category: 'Другое',
          emoji: '📝',
          projectId: 'project-1',
          operationType: 'expense',
        },
      ]
    })

    function fillReturn(amount: string) {
      fireEvent.change(screen.getByLabelText(/сценарий операции/i), {
        target: { value: 'project_return' },
      })
      fireEvent.change(screen.getByLabelText(/^проект$/i), {
        target: { value: 'project-1' },
      })
      fireEvent.change(screen.getByPlaceholderText(/описание/i), {
        target: { value: 'остаток' },
      })
      fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
        target: { value: amount },
      })
    }

    it('blocks a return larger than the cash on hand with an inline error', () => {
      render(<ExpenseForm />)
      fillReturn('7000')

      expect(screen.getByRole('alert')).toHaveTextContent(
        /Нельзя вернуть больше, чем на руках: 5\s000 ₽/
      )
      const submit = screen.getByRole('button', { name: /добавить/i })
      expect(submit).toBeDisabled()
      fireEvent.submit(submit.closest('form')!)
      expect(mockAddExpense).not.toHaveBeenCalled()
    })

    it('allows returning the whole cash on hand', async () => {
      render(<ExpenseForm />)
      fillReturn('5000')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /добавить/i }))
      await waitFor(() =>
        expect(mockAddExpense).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 5000,
            projectId: 'project-1',
            operationType: 'project_return',
          })
        )
      )
    })
  })

  describe('without projects', () => {
    beforeEach(() => {
      mockProjects = []
    })

    it('does not offer project scenarios and points to project creation', () => {
      render(<ExpenseForm />)

      const labels = Array.from(
        screen.getByLabelText(/сценарий операции/i).querySelectorAll('option')
      ).map((option) => option.textContent)
      expect(labels).not.toContain('Проектный расход')
      expect(labels).not.toContain('Взял из проекта')
      expect(labels).not.toContain('Вернул в проект')
      expect(
        screen.getByText(/Проектные операции появятся после создания проекта/)
      ).toBeInTheDocument()
      expect(screen.queryByLabelText(/^проект$/i)).not.toBeInTheDocument()
    })
  })

  describe('pocket purchase scenario', () => {
    const POCKET_SCENARIO_LABEL = 'Покупка из кармана'

    function scenarioLabels() {
      const select = screen.getByLabelText(/сценарий операции/i)
      return Array.from(select.querySelectorAll('option')).map(
        (option) => option.textContent
      )
    }

    function selectPocketScenario() {
      fireEvent.change(screen.getByLabelText(/сценарий операции/i), {
        target: { value: 'pocket_purchase' },
      })
    }

    function fillPurchase(description: string, amount: string) {
      fireEvent.change(screen.getByPlaceholderText(/описание/i), {
        target: { value: description },
      })
      fireEvent.blur(screen.getByPlaceholderText(/описание/i))
      fireEvent.change(screen.getByPlaceholderText(/сумма/i), {
        target: { value: amount },
      })
    }

    function suggestGroceries() {
      mockCategorize.mockReturnValue({
        found: true,
        categoryId: '1',
        categoryName: 'Продукты',
        categoryEmoji: '🛒',
      })
    }

    it('offers the scenario when a non-archived pocket exists', () => {
      mockPockets = [ACTIVE_POCKET]

      render(<ExpenseForm />)

      expect(scenarioLabels()).toContain(POCKET_SCENARIO_LABEL)
    })

    it('does not offer a transfer from a pocket', () => {
      mockPockets = [ACTIVE_POCKET]

      render(<ExpenseForm />)

      expect(
        scenarioLabels().filter((label) => /перев/i.test(label ?? ''))
      ).toEqual([])
    })

    it('does not offer the scenario without pockets', () => {
      mockPockets = []

      render(<ExpenseForm />)

      expect(scenarioLabels()).not.toContain(POCKET_SCENARIO_LABEL)
    })

    it('does not offer the scenario when every pocket is archived', () => {
      mockPockets = [ARCHIVED_POCKET]

      render(<ExpenseForm />)

      expect(scenarioLabels()).not.toContain(POCKET_SCENARIO_LABEL)
    })

    it('does not offer the scenario while pockets are not loaded', () => {
      mockPockets = undefined

      render(<ExpenseForm />)

      expect(scenarioLabels()).not.toContain(POCKET_SCENARIO_LABEL)
    })

    it('shows the pocket select only for the pocket scenario', () => {
      mockPockets = [ACTIVE_POCKET]

      render(<ExpenseForm />)

      expect(screen.queryByLabelText('Карман')).not.toBeInTheDocument()
      expect(screen.queryByText(POCKET_PURCHASE_HINT)).not.toBeInTheDocument()
      selectPocketScenario()
      expect(screen.getByLabelText('Карман')).toBeInTheDocument()
      expect(screen.getByText(POCKET_PURCHASE_HINT)).toBeInTheDocument()
    })

    it('lists only non-archived pockets and renders no date field', () => {
      mockPockets = [ACTIVE_POCKET, ARCHIVED_POCKET, SECOND_ACTIVE_POCKET]

      render(<ExpenseForm />)
      selectPocketScenario()

      const pocketSelect = screen.getByLabelText('Карман')
      const values = Array.from(pocketSelect.querySelectorAll('option'))
        .map((option) => option.value)
        .filter(Boolean)
      expect(values).toEqual(['pocket-1', 'pocket-2'])
      expect(screen.queryByLabelText(/дата/i)).not.toBeInTheDocument()
      expect(document.querySelector('input[type="date"]')).toBeNull()
    })

    it('preselects the only non-archived pocket and adds without touching the select', async () => {
      mockPockets = [ARCHIVED_POCKET, ACTIVE_POCKET]
      suggestGroceries()

      render(<ExpenseForm />)
      selectPocketScenario()

      expect(screen.getByLabelText('Карман')).toHaveValue('pocket-1')

      fillPurchase('куртка', '4000')
      fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

      await waitFor(() => {
        expect(mockAddExpense).toHaveBeenCalledWith(
          expect.objectContaining({ pocketId: 'pocket-1' })
        )
      })
    })

    it('starts empty with several pockets and blocks adding until one is chosen', async () => {
      mockPockets = [ACTIVE_POCKET, SECOND_ACTIVE_POCKET]
      suggestGroceries()

      render(<ExpenseForm />)
      selectPocketScenario()

      expect(screen.getByLabelText('Карман')).toHaveValue('')

      fillPurchase('куртка', '4000')
      const submit = screen.getByRole('button', { name: /добавить/i })
      expect(submit).toBeDisabled()
      fireEvent.submit(submit.closest('form')!)
      await waitFor(() => expect(submit).not.toHaveAttribute('aria-busy'))
      expect(mockAddExpense).not.toHaveBeenCalled()

      fireEvent.change(screen.getByLabelText('Карман'), {
        target: { value: 'pocket-2' },
      })
      expect(submit).toBeEnabled()
      fireEvent.click(submit)

      await waitFor(() => {
        expect(mockAddExpense).toHaveBeenCalledWith(
          expect.objectContaining({ pocketId: 'pocket-2' })
        )
      })
    })

    it('saves the purchase as an expense of the pocket on the selected date', async () => {
      mockPockets = [ACTIVE_POCKET]
      suggestGroceries()

      render(<ExpenseForm />)
      selectPocketScenario()
      fillPurchase('  куртка  ', '4000')
      fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

      await waitFor(() => expect(mockAddExpense).toHaveBeenCalledTimes(1))

      const saved = mockAddExpense.mock.calls[0][0]
      expect(saved).toMatchObject({
        description: 'куртка',
        amount: 4000,
        date: '2025-01-15',
        category: 'Продукты',
        emoji: '🛒',
        pocketId: 'pocket-1',
        operationType: 'expense',
      })
      expect(saved.projectId).toBeUndefined()
      expect(saved.sharedBudgetId).toBeUndefined()
      expect(saved.sharedBudgetCategoryId).toBeUndefined()
      expect(saved.sharedBudgetName).toBeUndefined()
      expect(mockSaveMapping).not.toHaveBeenCalled()
      expect(mockCategorizeShared).not.toHaveBeenCalled()
    })

    it('saves an amount of any size without a balance check', async () => {
      mockPockets = [ACTIVE_POCKET]
      suggestGroceries()

      render(<ExpenseForm />)
      selectPocketScenario()
      fillPurchase('диван', '999999')
      fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

      await waitFor(() => {
        expect(mockAddExpense).toHaveBeenCalledWith(
          expect.objectContaining({ amount: 999999, pocketId: 'pocket-1' })
        )
      })
    })

    it('requires a manual category when no keyword matches and remembers it', async () => {
      mockPockets = [ACTIVE_POCKET]
      mockCategorize.mockReturnValue({ found: false })
      mockSaveMapping.mockResolvedValueOnce(undefined)

      render(<ExpenseForm />)
      selectPocketScenario()
      fillPurchase('кофемашина', '5000')

      const submit = screen.getByRole('button', { name: /добавить/i })
      expect(submit).toBeDisabled()

      fireEvent.change(screen.getByLabelText('Категория'), {
        target: { value: '2' },
      })
      fireEvent.click(submit)

      await waitFor(() => {
        expect(mockSaveMapping).toHaveBeenCalledWith('кофемашина', '2')
        expect(mockAddExpense).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'Транспорт',
            emoji: '🚕',
            pocketId: 'pocket-1',
            operationType: 'expense',
          })
        )
      })
    })

    it('lets the user change a suggested category', async () => {
      mockPockets = [ACTIVE_POCKET]
      suggestGroceries()
      mockSaveMapping.mockResolvedValueOnce(undefined)

      render(<ExpenseForm />)
      selectPocketScenario()
      fillPurchase('молоко', '100')

      await screen.findByText(/🛒 Продукты/i)
      fireEvent.click(screen.getByRole('button', { name: /изменить/i }))
      fireEvent.change(screen.getByLabelText('Категория'), {
        target: { value: '6' },
      })
      fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

      await waitFor(() => {
        expect(mockSaveMapping).toHaveBeenCalledWith('молоко', '6')
        expect(mockAddExpense).toHaveBeenCalledWith(
          expect.objectContaining({ category: 'Другое', pocketId: 'pocket-1' })
        )
      })
    })

    it('does not link a personal expense to a pocket', async () => {
      mockPockets = [ACTIVE_POCKET]
      suggestGroceries()

      render(<ExpenseForm />)
      fillPurchase('молоко', '100')
      fireEvent.click(screen.getByRole('button', { name: /добавить/i }))

      await waitFor(() => expect(mockAddExpense).toHaveBeenCalledTimes(1))
      expect(mockAddExpense.mock.calls[0][0].pocketId).toBeUndefined()
    })
  })
})
