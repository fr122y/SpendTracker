import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'

import { CategoryManager } from '../ui/category-manager'

const mockCategories = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚕' },
  { id: '6', name: 'Другое', emoji: '📝' },
]

const mockAddCategoryIfUnique = jest.fn()
const mockDeleteCategory = jest.fn()
const mockAddSharedCategory = jest.fn()
const mockUpdateSharedCategory = jest.fn()
const mockUpdateCategory = jest.fn()
const mockArchiveSharedCategory = jest.fn()
let mockIsLoading = false
let mockExpenseCount: number | undefined = 0
let mockCategoriesList = mockCategories
let mockSharedBudgets = [
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
    name: 'Продукты',
    emoji: '🛒',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'shared-category-2',
    sharedBudgetId: 'shared-1',
    name: 'Кафе',
    emoji: '☕',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
]

jest.mock('@/entities/category', () => ({
  useCategories: () => ({
    data: mockCategories,
    isLoading: false,
  }),
  useAddCategory: () => ({
    mutate: mockAddCategoryIfUnique,
    isPending: false,
  }),
  useDeleteCategory: () => ({ mutate: mockDeleteCategory, isPending: false }),
  useUpdateCategory: () => ({ mutate: mockUpdateCategory, isPending: false }),
  useCategoryExpenseCount: () => ({
    data: mockExpenseCount,
    isLoading: false,
  }),
  getDefaultReassignTarget: (
    categories: typeof mockCategories,
    deletedId: string
  ) => {
    const remaining = categories.filter((category) => category.id !== deletedId)
    return (
      remaining.find((category) => category.name === 'Другое') ?? remaining[0]
    )
  },
  useSharedBudgetCategories: () => ({
    data: mockSharedCategories,
    isLoading: false,
  }),
  useAddSharedBudgetCategory: () => ({
    mutateAsync: mockAddSharedCategory,
    isPending: false,
  }),
  useUpdateSharedBudgetCategory: () => ({
    mutateAsync: mockUpdateSharedCategory,
    isPending: false,
  }),
  useArchiveSharedBudgetCategory: () => ({
    mutate: mockArchiveSharedCategory,
    isPending: false,
  }),
  isSharedCategoryNameDuplicate: (
    name: string,
    categories: typeof mockSharedCategories,
    excludeId?: string
  ) =>
    categories.some(
      (category) =>
        category.id !== excludeId &&
        category.name.toLowerCase() === name.trim().toLowerCase()
    ),
  useCategoryStore: (
    selector: (state: {
      categories: typeof mockCategories
      isLoading: boolean
      addCategoryIfUnique: jest.Mock
      deleteCategory: jest.Mock
    }) => unknown
  ) =>
    selector({
      categories: mockCategoriesList,
      isLoading: mockIsLoading,
      addCategoryIfUnique: mockAddCategoryIfUnique,
      deleteCategory: mockDeleteCategory,
    }),
}))

const mockDeleteRule = jest.fn()
const mockDeleteSharedRule = jest.fn()
let mockRules = [
  {
    id: 'rule-1',
    keyword: 'ресторан',
    matchType: 'fuzzy' as const,
    categoryId: '1',
    categoryName: 'Продукты',
    categoryEmoji: '🛒',
  },
  {
    id: 'rule-2',
    keyword: 'такси домой',
    matchType: 'exact' as const,
    categoryId: '2',
    categoryName: 'Транспорт',
    categoryEmoji: '🚕',
  },
]
const mockSharedRules = [
  {
    id: 'shared-rule-1',
    keyword: 'кофе',
    matchType: 'exact' as const,
    categoryId: 'shared-category-2',
    categoryName: 'Кафе',
    categoryEmoji: '☕',
  },
]

jest.mock('@/entities/keyword-mapping', () => ({
  useKeywordMappings: () => ({ data: mockRules }),
  useDeleteKeywordMapping: () => ({ mutate: mockDeleteRule }),
  useSharedKeywordMappings: (sharedBudgetId: string | undefined) => ({
    data: sharedBudgetId ? mockSharedRules : [],
  }),
  useDeleteSharedKeywordMapping: () => ({ mutate: mockDeleteSharedRule }),
}))

jest.mock('@/entities/shared-budget', () => ({
  getActiveSharedBudget: (budgets: typeof mockSharedBudgets) =>
    budgets.find((budget) => budget.isActive),
  useSharedBudgets: () => ({
    data: mockSharedBudgets,
    isLoading: false,
  }),
}))

describe('CategoryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsLoading = false
    mockExpenseCount = 0
    mockCategoriesList = mockCategories
    mockAddCategoryIfUnique.mockReturnValue(true)
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
        name: 'Продукты',
        emoji: '🛒',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'shared-category-2',
        sharedBudgetId: 'shared-1',
        name: 'Кафе',
        emoji: '☕',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ]
  })

  it('renders skeleton while categories are loading', () => {
    mockIsLoading = true

    render(<CategoryManager />)

    expect(screen.getByTestId('category-manager-skeleton')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/название/i)).not.toBeInTheDocument()
  })

  it('renders list of existing categories', () => {
    render(<CategoryManager />)

    expect(screen.getByText('Продукты')).toBeInTheDocument()
    expect(screen.getByText('Транспорт')).toBeInTheDocument()
    expect(screen.getByText('Другое')).toBeInTheDocument()
  })

  it('renders category emojis', () => {
    render(<CategoryManager />)

    expect(screen.getByText('🛒')).toBeInTheDocument()
    expect(screen.getByText('🚕')).toBeInTheDocument()
    expect(screen.getByText('📝')).toBeInTheDocument()
  })

  it('renders delete button for each category', () => {
    render(<CategoryManager />)

    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    expect(deleteButtons).toHaveLength(3)
  })

  it('opens confirmation dialog when delete button is clicked', () => {
    render(<CategoryManager />)

    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    fireEvent.click(deleteButtons[0])

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(
      screen.getByText('Удалить категорию «Продукты»?')
    ).toBeInTheDocument()
    expect(mockDeleteCategory).not.toHaveBeenCalled()
  })

  it('does not call deleteCategory when deletion is canceled', () => {
    render(<CategoryManager />)

    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(mockDeleteCategory).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('calls deleteCategory when deletion is confirmed', () => {
    render(<CategoryManager />)

    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByRole('button', { name: 'Удалить категорию' }))

    expect(mockDeleteCategory).toHaveBeenCalledWith('1', '6')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('shows a simple confirmation without a target select when empty', () => {
    mockExpenseCount = 0
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Удалить Продукты' }))

    expect(screen.getByText('В категории нет операций.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Правила автокатегоризации этой категории будут удалены.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Перенести в')).not.toBeInTheDocument()
  })

  it('defaults the target to «Другое» and moves expenses there', () => {
    mockExpenseCount = 4
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Удалить Продукты' }))

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'В категории 4 операции. Куда перенести?'
    )
    expect(screen.getByLabelText('Перенести в')).toHaveValue('6')

    fireEvent.click(screen.getByRole('button', { name: 'Удалить категорию' }))
    expect(mockDeleteCategory).toHaveBeenCalledWith('1', '6')
  })

  it('uses the singular form for one expense', () => {
    mockExpenseCount = 1
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Удалить Продукты' }))

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'В категории 1 операция. Куда перенести?'
    )
  })

  it('defaults to the first remaining category when «Другое» is deleted', () => {
    mockExpenseCount = 2
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Удалить Другое' }))

    expect(screen.getByLabelText('Перенести в')).toHaveValue('1')
  })

  it('moves expenses to the category the user picks', () => {
    mockExpenseCount = 2
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Удалить Продукты' }))
    fireEvent.change(screen.getByLabelText('Перенести в'), {
      target: { value: '2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Удалить категорию' }))

    expect(mockDeleteCategory).toHaveBeenCalledWith('1', '2')
  })

  it('disables delete when only one category remains', () => {
    mockCategoriesList = [mockCategories[0]]
    render(<CategoryManager />)

    expect(
      screen.getByRole('button', { name: 'Удалить Продукты' })
    ).toBeDisabled()
  })

  it('renders form to add new category', () => {
    render(<CategoryManager />)

    expect(screen.getByPlaceholderText(/название/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/эмодзи/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /добавить личную категорию/i })
    ).toBeInTheDocument()
  })

  it('caps the category name at 40 characters and blocks a longer one', () => {
    render(<CategoryManager />)

    const nameInput = screen.getByPlaceholderText(/название/i)
    expect(nameInput).toHaveAttribute('maxLength', '40')

    fireEvent.change(nameInput, { target: { value: 'к'.repeat(41) } })
    fireEvent.change(screen.getByPlaceholderText(/эмодзи/i), {
      target: { value: '👕' },
    })

    expect(
      screen.getByRole('button', { name: /добавить личную категорию/i })
    ).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Название категории не длиннее 40 символов'
    )
  })

  it('adds new category when form is submitted', async () => {
    render(<CategoryManager />)

    fireEvent.change(screen.getByPlaceholderText(/название/i), {
      target: { value: 'Одежда' },
    })
    fireEvent.change(screen.getByPlaceholderText(/эмодзи/i), {
      target: { value: '👕' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /добавить личную категорию/i })
    )

    await waitFor(() => {
      expect(mockAddCategoryIfUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Одежда',
          emoji: '👕',
        })
      )
    })
  })

  it('resets form after adding category', async () => {
    render(<CategoryManager />)

    const nameInput = screen.getByPlaceholderText(/название/i)
    const emojiInput = screen.getByPlaceholderText(/эмодзи/i)

    fireEvent.change(nameInput, { target: { value: 'Одежда' } })
    fireEvent.change(emojiInput, { target: { value: '👕' } })
    fireEvent.click(
      screen.getByRole('button', { name: /добавить личную категорию/i })
    )

    await waitFor(() => {
      expect(nameInput).toHaveValue('')
      expect(emojiInput).toHaveValue('')
    })
  })

  it('shows validation error for duplicate category name', async () => {
    mockAddCategoryIfUnique.mockReturnValue(false)

    render(<CategoryManager />)

    fireEvent.change(screen.getByPlaceholderText(/название/i), {
      target: { value: 'Продукты' },
    })
    fireEvent.change(screen.getByPlaceholderText(/эмодзи/i), {
      target: { value: '🍎' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /добавить личную категорию/i })
    )

    await waitFor(() => {
      expect(screen.getByText(/категория.*существует/i)).toBeInTheDocument()
    })
    expect(mockAddCategoryIfUnique).toHaveBeenCalled()
  })

  it('disables add button when form is empty', () => {
    render(<CategoryManager />)

    const addButton = screen.getByRole('button', {
      name: /добавить личную категорию/i,
    })
    expect(addButton).toBeDisabled()
  })

  it('disables add button when only name is filled', () => {
    render(<CategoryManager />)

    fireEvent.change(screen.getByPlaceholderText(/название/i), {
      target: { value: 'Одежда' },
    })

    const addButton = screen.getByRole('button', {
      name: /добавить личную категорию/i,
    })
    expect(addButton).toBeDisabled()
  })

  it('shows shared categories for the selected shared budget', () => {
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Общие' }))

    expect(screen.getByLabelText('Общий бюджет')).toHaveValue('shared-1')
    expect(screen.getByText('Кафе')).toBeInTheDocument()
  })

  it('adds a shared category', async () => {
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Общие' }))
    fireEvent.change(screen.getByPlaceholderText(/название/i), {
      target: { value: 'Аптека' },
    })
    fireEvent.change(screen.getByPlaceholderText(/эмодзи/i), {
      target: { value: '💊' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /добавить категорию общего бюджета/i })
    )

    await waitFor(() => {
      expect(mockAddSharedCategory).toHaveBeenCalledWith({
        name: 'Аптека',
        emoji: '💊',
      })
    })
  })

  it('adds one shared category for a rapid triple submit', async () => {
    let resolveRequest!: () => void
    mockAddSharedCategory.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveRequest = resolve))
    )
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Общие' }))
    fireEvent.change(screen.getByPlaceholderText(/название/i), {
      target: { value: 'Аптека' },
    })
    fireEvent.change(screen.getByPlaceholderText(/эмодзи/i), {
      target: { value: '💊' },
    })
    const form = screen
      .getByRole('button', { name: /добавить категорию общего бюджета/i })
      .closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    fireEvent.submit(form)

    await waitFor(() => expect(mockAddSharedCategory).toHaveBeenCalledTimes(1))
    await act(async () => resolveRequest())
    expect(mockAddSharedCategory).toHaveBeenCalledTimes(1)
  })

  it('edits a shared category', async () => {
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Общие' }))
    fireEvent.click(screen.getAllByRole('button', { name: /изменить/i })[0])
    fireEvent.change(screen.getByDisplayValue('Продукты'), {
      target: { value: 'Супермаркет' },
    })
    fireEvent.change(screen.getByDisplayValue('🛒'), {
      target: { value: '🛍️' },
    })
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    await waitFor(() => {
      expect(mockUpdateSharedCategory).toHaveBeenCalledWith({
        id: 'shared-category-1',
        name: 'Супермаркет',
        emoji: '🛍️',
        color: null,
      })
    })
  })

  it('changes the color of a shared category', async () => {
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Общие' }))
    fireEvent.click(screen.getByRole('button', { name: 'Изменить Кафе' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Индиго' }))
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    await waitFor(() => {
      expect(mockUpdateSharedCategory).toHaveBeenCalledWith({
        id: 'shared-category-2',
        name: 'Кафе',
        emoji: '☕',
        color: '#4338ca',
      })
    })
  })

  it('renames a personal category and changes its emoji and color', () => {
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Изменить Продукты' }))
    fireEvent.change(screen.getByDisplayValue('Продукты'), {
      target: { value: '  Еда  ' },
    })
    fireEvent.change(screen.getByDisplayValue('🛒'), {
      target: { value: '👨‍👩‍👧' },
    })
    fireEvent.click(screen.getByRole('radio', { name: 'Красный' }))
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(mockUpdateCategory).toHaveBeenCalledWith({
      id: '1',
      name: 'Еда',
      emoji: '👨‍👩‍👧',
      color: '#b91c1c',
    })
    expect(mockAddCategoryIfUnique).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: /добавить личную категорию/i })
    ).toBeInTheDocument()
  })

  it('rejects renaming a personal category to an existing name', () => {
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Изменить Продукты' }))
    fireEvent.change(screen.getByDisplayValue('Продукты'), {
      target: { value: 'транспорт' },
    })
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(mockUpdateCategory).not.toHaveBeenCalled()
    expect(
      screen.getByText('Категория с таким названием уже существует')
    ).toBeInTheDocument()
  })

  it('keeps a ZWJ emoji whole and limits the field to one emoji', () => {
    render(<CategoryManager />)

    const emojiInput = screen.getByPlaceholderText(/эмодзи/i)
    fireEvent.change(emojiInput, { target: { value: '👩‍💻🚕' } })

    expect(emojiInput).toHaveValue('👩‍💻')
    expect(emojiInput).not.toHaveAttribute('maxLength')
  })

  it('labels the personal and shared add forms differently', () => {
    render(<CategoryManager />)

    expect(
      screen.getByPlaceholderText('Название личной категории')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Общие' }))

    expect(
      screen.getByPlaceholderText('Название категории общего бюджета')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /добавить категорию общего бюджета/i })
    ).toBeInTheDocument()
  })

  it('archives a shared category after confirmation', () => {
    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Общие' }))
    fireEvent.click(screen.getAllByRole('button', { name: /архив/i })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Архивировать' }))

    expect(mockArchiveSharedCategory).toHaveBeenCalledWith(
      'shared-category-1',
      expect.any(Object)
    )
  })

  it('shows empty state when there are no shared budgets', () => {
    mockSharedBudgets = []

    render(<CategoryManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Общие' }))

    expect(screen.getByText('Нет общих бюджетов')).toBeInTheDocument()
  })

  it('lists rules of a personal category and deletes one', () => {
    render(<CategoryManager />)

    expect(screen.queryByText('ресторан')).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Правила категории Продукты: 1' })
    )

    expect(screen.getByText('ресторан')).toBeInTheDocument()
    expect(screen.getByText('по слову')).toBeInTheDocument()
    expect(screen.queryByText('такси домой')).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Удалить правило «ресторан»' })
    )
    expect(mockDeleteRule).toHaveBeenCalledWith('rule-1')
  })

  it('shows an empty rules hint for a category without rules', () => {
    const allRules = mockRules
    mockRules = []
    render(<CategoryManager />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Правила категории Другое: 0' })
    )
    expect(screen.getByText(/Правил нет/)).toBeInTheDocument()
    mockRules = allRules
  })

  it('lists and deletes rules of a shared category', () => {
    render(<CategoryManager />)
    fireEvent.click(screen.getByRole('button', { name: 'Общие' }))

    fireEvent.click(
      screen.getByRole('button', { name: 'Правила категории Кафе: 1' })
    )
    expect(screen.getByText('вся фраза')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Удалить правило «кофе»' })
    )
    expect(mockDeleteSharedRule).toHaveBeenCalledWith('shared-rule-1')
    expect(mockDeleteRule).not.toHaveBeenCalled()
  })
})
