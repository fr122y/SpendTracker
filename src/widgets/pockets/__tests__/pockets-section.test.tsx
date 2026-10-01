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
const mockSetPocketMonthBudget = jest.fn()
const mockCreatePocket = jest.fn().mockResolvedValue(undefined)
const mockRenamePocket = jest.fn().mockResolvedValue(undefined)
const mockArchivePocket = jest.fn().mockResolvedValue(undefined)
const mockExpenses: Expense[] = [
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
}))

jest.mock('@/entities/category', () => ({
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
    mockPockets[0].archivedAt = undefined
    mockArchivePocket.mockImplementation(async ({ id }: { id: string }) => {
      if (id === mockPockets[0].id) {
        mockPockets[0].archivedAt = '2026-01-22T00:00:00.000Z'
      }
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

  it('allows editing transfer amount, date, and comment from history', () => {
    render(<PocketsSection />)
    fireEvent.click(screen.getByRole('button', { name: /Переводы/ }))

    fireEvent.change(screen.getByLabelText('Сумма операции transfer-1'), {
      target: { value: '150' },
    })
    fireEvent.blur(screen.getByLabelText('Сумма операции transfer-1'))
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
