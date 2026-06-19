import { render, screen, fireEvent, waitFor } from '@testing-library/react'

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
const mockArchiveSharedCategory = jest.fn()
let mockIsLoading = false
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
  useSharedBudgetCategories: () => ({
    data: mockSharedCategories,
    isLoading: false,
  }),
  useAddSharedBudgetCategory: () => ({
    mutate: mockAddSharedCategory,
    isPending: false,
  }),
  useUpdateSharedBudgetCategory: () => ({
    mutate: mockUpdateSharedCategory,
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
      categories: mockCategories,
      isLoading: mockIsLoading,
      addCategoryIfUnique: mockAddCategoryIfUnique,
      deleteCategory: mockDeleteCategory,
    }),
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

    expect(mockDeleteCategory).toHaveBeenCalledWith('1')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('renders form to add new category', () => {
    render(<CategoryManager />)

    expect(screen.getByPlaceholderText(/название/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/эмодзи/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /добавить категорию/i })
    ).toBeInTheDocument()
  })

  it('adds new category when form is submitted', async () => {
    render(<CategoryManager />)

    fireEvent.change(screen.getByPlaceholderText(/название/i), {
      target: { value: 'Одежда' },
    })
    fireEvent.change(screen.getByPlaceholderText(/эмодзи/i), {
      target: { value: '👕' },
    })
    fireEvent.click(screen.getByRole('button', { name: /добавить категорию/i }))

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
    fireEvent.click(screen.getByRole('button', { name: /добавить категорию/i }))

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
    fireEvent.click(screen.getByRole('button', { name: /добавить категорию/i }))

    await waitFor(() => {
      expect(screen.getByText(/категория.*существует/i)).toBeInTheDocument()
    })
    expect(mockAddCategoryIfUnique).toHaveBeenCalled()
  })

  it('disables add button when form is empty', () => {
    render(<CategoryManager />)

    const addButton = screen.getByRole('button', {
      name: /добавить категорию/i,
    })
    expect(addButton).toBeDisabled()
  })

  it('disables add button when only name is filled', () => {
    render(<CategoryManager />)

    fireEvent.change(screen.getByPlaceholderText(/название/i), {
      target: { value: 'Одежда' },
    })

    const addButton = screen.getByRole('button', {
      name: /добавить категорию/i,
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
    fireEvent.click(screen.getByRole('button', { name: /добавить категорию/i }))

    await waitFor(() => {
      expect(mockAddSharedCategory).toHaveBeenCalledWith(
        { name: 'Аптека', emoji: '💊' },
        expect.any(Object)
      )
    })
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
      expect(mockUpdateSharedCategory).toHaveBeenCalledWith(
        {
          id: 'shared-category-1',
          name: 'Супермаркет',
          emoji: '🛍️',
        },
        expect.any(Object)
      )
    })
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
})
