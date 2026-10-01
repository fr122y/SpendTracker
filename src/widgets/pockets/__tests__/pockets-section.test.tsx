import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import { PocketsSection } from '../ui/pockets-section'

import type { Expense, Pocket } from '@/shared/types'

const mockPockets: Pocket[] = [
  { id: 'pocket-1', name: 'Отпуск', createdAt: '2026-01-01' },
]
const mockBudget = { pocketId: 'pocket-1', period: '2026-01', budget: 1000 }
const mockAddExpense = jest.fn().mockResolvedValue(undefined)
const mockUpdateExpense = jest.fn()
const mockDeleteExpense = jest.fn()
const mockSetPocketMonthBudget = jest.fn()
const mockCreatePocket = jest.fn().mockResolvedValue(undefined)
const mockRenamePocket = jest.fn().mockResolvedValue(undefined)
const mockArchivePocket = jest.fn().mockResolvedValue(undefined)
const mockCategorize = jest.fn()
const mockSaveMapping = jest.fn().mockResolvedValue(undefined)
const initialMockExpenses: Expense[] = [
  {
    id: 'purchase-1',
    pocketId: 'pocket-1',
    description: 'Билеты',
    amount: 1200,
    date: '2026-01-10',
    category: 'Путешествия',
    emoji: '✈️',
  },
  {
    id: 'transfer-1',
    pocketId: 'pocket-1',
    operationType: 'pocket_transfer',
    description: 'На текущие расходы',
    amount: 300,
    date: '2026-01-20',
    category: 'Перевод из кармана',
    emoji: '↗️',
  },
]
let mockExpenses = [...initialMockExpenses]

jest.mock('@/entities/pocket', () => ({
  usePockets: () => ({ data: mockPockets, isLoading: false, isError: false }),
  usePocketMonthBudget: () => ({
    data: mockBudget,
    isLoading: false,
    isError: false,
  }),
  useCreatePocket: () => ({
    mutateAsync: mockCreatePocket,
    isPending: false,
    isError: false,
  }),
  useRenamePocket: () => ({
    mutateAsync: mockRenamePocket,
    isPending: false,
    isError: false,
  }),
  useArchivePocket: () => ({
    mutateAsync: mockArchivePocket,
    isPending: false,
    isError: false,
  }),
  useSetPocketMonthBudget: () => ({
    mutate: mockSetPocketMonthBudget,
    isPending: false,
    isError: false,
  }),
}))

jest.mock('@/entities/expense', () => ({
  ExpenseCard: jest.requireActual('@/entities/expense/ui/expense-card')
    .ExpenseCard,
  useExpenses: () => ({ data: mockExpenses, isLoading: false, isError: false }),
  useAddExpense: () => ({
    mutateAsync: mockAddExpense,
    isPending: false,
    isError: false,
  }),
  useUpdateExpense: () => ({
    mutate: mockUpdateExpense,
    isPending: false,
    isError: false,
  }),
  useDeleteExpense: () => ({
    mutate: mockDeleteExpense,
    isPending: false,
    isError: false,
  }),
}))

jest.mock('@/entities/category', () => ({
  useCategorize: () => ({
    categorize: mockCategorize,
    saveMappingAndGetResult: mockSaveMapping,
    mappingsLoaded: true,
    isSavingMapping: false,
  }),
  useCategoryStore: (selector: (state: { categories: unknown[] }) => unknown) =>
    selector({
      categories: [
        { id: 'travel', name: 'Путешествия', emoji: '✈️' },
        { id: 'food', name: 'Еда', emoji: '🍲' },
      ],
    }),
}))

jest.mock('@/entities/session', () => ({
  useSessionStore: (selector: (state: { selectedDate: Date }) => unknown) =>
    selector({ selectedDate: new Date(2026, 0, 21) }),
}))

jest.mock('@/shared/lib', () => ({
  ...jest.requireActual('@/shared/lib'),
  getPocketMonthSummary: (
    expenses: Expense[],
    pocketId: string,
    date: Date,
    budget: number
  ) => {
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const operations = expenses.filter(
      (expense) =>
        expense.pocketId === pocketId && expense.date.startsWith(period)
    )
    const purchases = operations.filter(
      (expense) => (expense.operationType ?? 'expense') === 'expense'
    )
    const transfers = operations.filter(
      (expense) => expense.operationType === 'pocket_transfer'
    )
    const purchaseTotal = purchases.reduce((sum, item) => sum + item.amount, 0)
    const transferTotal = transfers.reduce((sum, item) => sum + item.amount, 0)
    const used = purchaseTotal + transferTotal

    return {
      purchases,
      transfers,
      purchaseTotal,
      transferTotal,
      used,
      remaining: budget - used,
    }
  },
}))

describe('PocketsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockExpenses = [...initialMockExpenses]
    mockCategorize.mockReturnValue({ found: false })
    mockSaveMapping.mockResolvedValue(undefined)
    mockPockets[0].archivedAt = undefined
    mockArchivePocket.mockImplementation(async ({ id }: { id: string }) => {
      if (id === mockPockets[0].id) {
        mockPockets[0].archivedAt = '2026-01-22T00:00:00.000Z'
      }
    })
    mockDeleteExpense.mockImplementation((id: string) => {
      mockExpenses = mockExpenses.filter((expense) => expense.id !== id)
    })
  })

  it('uses the selected dashboard month and shows negative remaining amount', () => {
    render(<PocketsSection />)

    expect(
      screen.getByRole('region', { name: 'Карман Отпуск' })
    ).toBeInTheDocument()
    expect(screen.getByText('1 500 ₽')).toBeInTheDocument()
    expect(screen.getByText('-500 ₽')).toBeInTheDocument()
    expect(
      screen.queryByLabelText(/выберите месяц|дата кармана/i)
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/января 2026/)).not.toBeInTheDocument()
  })

  it('creates a new pocket from the widget', async () => {
    render(<PocketsSection />)
    fireEvent.click(screen.getByRole('button', { name: /Создать карман/ }))
    fireEvent.change(screen.getByLabelText('Название кармана'), {
      target: { value: 'Ноутбук' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать карман' }))

    await waitFor(() =>
      expect(mockCreatePocket).toHaveBeenCalledWith({ name: 'Ноутбук' })
    )
  })

  it('updates the selected month budget only', () => {
    render(<PocketsSection />)
    const budget = screen.getByLabelText('Бюджет кармана Отпуск')
    fireEvent.change(budget, { target: { value: '2500' } })
    fireEvent.blur(budget)

    expect(mockSetPocketMonthBudget).toHaveBeenCalledWith({
      pocketId: 'pocket-1',
      period: '2026-01',
      budget: 2500,
    })
  })

  it('renames a pocket without changing its history link', async () => {
    render(<PocketsSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Переименовать' }))
    fireEvent.change(screen.getByLabelText('Новое название'), {
      target: { value: 'Большая поездка' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(mockRenamePocket).toHaveBeenCalledWith({
        id: 'pocket-1',
        name: 'Большая поездка',
      })
    )
  })

  it('creates a pocket purchase and a transfer with the shared selected date', async () => {
    render(<PocketsSection />)

    fireEvent.click(screen.getByRole('button', { name: 'Добавить покупку' }))
    expect(screen.getByLabelText('Дата')).toHaveValue('2026-01-21')
    fireEvent.change(screen.getByLabelText('Комментарий'), {
      target: { value: 'Обед' },
    })
    fireEvent.blur(screen.getByLabelText('Комментарий'))
    fireEvent.change(screen.getByLabelText('Сумма'), {
      target: { value: '450' },
    })
    fireEvent.change(screen.getByLabelText('Категория покупки'), {
      target: { value: 'food' },
    })
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Добавить покупку' }).at(-1)!
    )

    await waitFor(() =>
      expect(mockAddExpense).toHaveBeenCalledWith({
        description: 'Обед',
        amount: 450,
        date: '2026-01-21',
        category: 'Еда',
        emoji: '🍲',
        pocketId: 'pocket-1',
        operationType: 'expense',
      })
    )
    expect(mockSaveMapping).toHaveBeenCalledWith('Обед', 'food')

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Перевести в расходы' }).at(0)!
    )
    fireEvent.change(screen.getByLabelText('Комментарий'), {
      target: { value: 'Продукты' },
    })
    fireEvent.change(screen.getByLabelText('Сумма'), {
      target: { value: '200' },
    })
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Перевести в расходы' }).at(-1)!
    )

    await waitFor(() =>
      expect(mockAddExpense).toHaveBeenCalledWith({
        description: 'Продукты',
        amount: 200,
        date: '2026-01-21',
        pocketId: 'pocket-1',
        operationType: 'pocket_transfer',
      })
    )
  })

  it('shows an automatic category suggestion with a deliberate override', async () => {
    mockCategorize.mockReturnValue({
      found: true,
      categoryId: 'food',
      categoryName: 'Еда',
      categoryEmoji: '🍲',
    })
    render(<PocketsSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Добавить покупку' }))
    fireEvent.change(screen.getByLabelText('Комментарий'), {
      target: { value: 'Кофе' },
    })
    fireEvent.blur(screen.getByLabelText('Комментарий'))

    expect(screen.getByText('Категория:')).toBeInTheDocument()
    expect(screen.getByText('🍲 Еда')).toBeInTheDocument()
    expect(screen.queryByLabelText('Категория покупки')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Изменить' }))
    fireEvent.change(screen.getByLabelText('Категория покупки'), {
      target: { value: 'travel' },
    })
    fireEvent.change(screen.getByLabelText('Сумма'), {
      target: { value: '400' },
    })
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Добавить покупку' }).at(-1)!
    )

    await waitFor(() => {
      expect(mockSaveMapping).toHaveBeenCalledWith('Кофе', 'travel')
      expect(mockAddExpense).toHaveBeenCalledWith({
        description: 'Кофе',
        amount: 400,
        date: '2026-01-21',
        category: 'Путешествия',
        emoji: '✈️',
        pocketId: 'pocket-1',
        operationType: 'expense',
      })
    })
  })

  it('uses a suggested category when submitting before the description loses focus', async () => {
    mockCategorize.mockReturnValue({
      found: true,
      categoryId: 'food',
      categoryName: 'Еда',
      categoryEmoji: '🍲',
    })
    render(<PocketsSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Добавить покупку' }))
    fireEvent.change(screen.getByLabelText('Комментарий'), {
      target: { value: 'Кофе' },
    })
    fireEvent.change(screen.getByLabelText('Сумма'), {
      target: { value: '200' },
    })
    fireEvent.submit(screen.getByLabelText('Комментарий').closest('form')!)

    await waitFor(() =>
      expect(mockAddExpense).toHaveBeenCalledWith({
        description: 'Кофе',
        amount: 200,
        date: '2026-01-21',
        category: 'Еда',
        emoji: '🍲',
        pocketId: 'pocket-1',
        operationType: 'expense',
      })
    )
  })

  it('allows editing transfer amount, date, and comment from history', () => {
    render(<PocketsSection />)
    fireEvent.click(screen.getByRole('button', { name: /Переводы/ }))

    expect(
      screen.queryByRole('textbox', { name: /edit amount/i })
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /edit amount/i }))
    fireEvent.change(screen.getByRole('textbox', { name: /edit amount/i }), {
      target: { value: '150' },
    })
    fireEvent.blur(screen.getByRole('textbox', { name: /edit amount/i }))
    fireEvent.change(screen.getByLabelText('Дата операции transfer-1'), {
      target: { value: '2026-01-19' },
    })
    fireEvent.change(screen.getByLabelText('Комментарий операции transfer-1'), {
      target: { value: 'Часть вернулась' },
    })
    fireEvent.blur(screen.getByLabelText('Комментарий операции transfer-1'))

    expect(mockUpdateExpense).toHaveBeenCalledWith({
      id: 'transfer-1',
      data: { amount: 150 },
    })
    expect(mockUpdateExpense).toHaveBeenCalledWith({
      id: 'transfer-1',
      data: { date: '2026-01-19' },
    })
    expect(mockUpdateExpense).toHaveBeenCalledWith({
      id: 'transfer-1',
      data: { description: 'Часть вернулась' },
    })
  })

  it('keeps purchase category compact until the user asks to edit it', () => {
    render(<PocketsSection />)
    fireEvent.click(screen.getByRole('button', { name: /Покупки/ }))

    expect(screen.getByText('Покупка из кармана')).toBeInTheDocument()
    expect(
      screen.queryByLabelText('Категория операции purchase-1')
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Изменить категорию' }))
    fireEvent.change(screen.getByLabelText('Категория операции purchase-1'), {
      target: { value: 'food' },
    })

    expect(mockUpdateExpense).toHaveBeenCalledWith({
      id: 'purchase-1',
      data: { category: 'Еда', emoji: '🍲' },
    })
  })

  it.each([
    ['purchase', 'Покупки', 'purchase-1'],
    ['transfer', 'Переводы', 'transfer-1'],
  ])(
    'allows deleting a %s after confirmation and updates the monthly total',
    async (_kind, history, id) => {
      const view = render(<PocketsSection />)
      const region = screen.getByRole('region', { name: 'Карман Отпуск' })
      expect(
        within(region).getByTestId('pocket-used-pocket-1')
      ).toHaveTextContent('1 500 ₽')
      fireEvent.click(screen.getByRole('button', { name: new RegExp(history) }))
      fireEvent.click(screen.getByRole('button', { name: 'delete' }))
      fireEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', {
          name: 'Отмена',
        })
      )

      expect(mockDeleteExpense).not.toHaveBeenCalled()
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(
        within(region).getByTestId('pocket-used-pocket-1')
      ).toHaveTextContent('1 500 ₽')

      fireEvent.click(screen.getByRole('button', { name: 'delete' }))
      fireEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', {
          name: 'Удалить',
        })
      )

      await waitFor(() => expect(mockDeleteExpense).toHaveBeenCalledWith(id))
      view.rerender(<PocketsSection />)
      expect(
        within(region).getByTestId('pocket-used-pocket-1')
      ).toHaveTextContent(id === 'purchase-1' ? '300 ₽' : '1 200 ₽')
      expect(
        within(region).getByTestId('pocket-remaining-pocket-1')
      ).toHaveTextContent(id === 'purchase-1' ? '700 ₽' : '-200 ₽')
    }
  )

  it('keeps archived history visible and hides new-operation controls', async () => {
    const view = render(<PocketsSection />)
    fireEvent.click(screen.getByRole('button', { name: /Архивировать/ }))
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Архивировать',
      })
    )

    await waitFor(() =>
      expect(mockArchivePocket).toHaveBeenCalledWith({ id: 'pocket-1' })
    )
    view.rerender(<PocketsSection />)

    expect(screen.getByRole('button', { name: /Покупки/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Бюджет кармана Отпуск')).not.toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Добавить покупку' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Переименовать' })
    ).not.toBeInTheDocument()
  })
})
