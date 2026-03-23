import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { CategoryManager } from '../ui/category-manager'

const mockCategories = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚕' },
  { id: '6', name: 'Другое', emoji: '📝' },
]

const mockAddCategoryIfUnique = jest.fn()
const mockDeleteCategory = jest.fn()

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
  useCategoryStore: (
    selector: (state: {
      categories: typeof mockCategories
      addCategoryIfUnique: jest.Mock
      deleteCategory: jest.Mock
    }) => unknown
  ) =>
    selector({
      categories: mockCategories,
      addCategoryIfUnique: mockAddCategoryIfUnique,
      deleteCategory: mockDeleteCategory,
    }),
}))

describe('CategoryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAddCategoryIfUnique.mockReturnValue(true)
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

  it('calls deleteCategory when delete button is clicked', () => {
    render(<CategoryManager />)

    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    fireEvent.click(deleteButtons[0])

    expect(mockDeleteCategory).toHaveBeenCalledWith('1')
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
})
