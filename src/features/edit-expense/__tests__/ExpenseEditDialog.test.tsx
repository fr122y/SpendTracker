import { fireEvent, render, screen } from '@testing-library/react'

import { ExpenseEditDialog } from '../ui/expense-edit-dialog'

import type { Category, Expense, Pocket } from '@/shared/types'

const mockMutate = jest.fn()
const mockSaveRule = jest.fn()
let mockPockets: Partial<Pocket>[] = []
const mockCategories: Category[] = [
  { id: 'c-food', name: 'Еда', emoji: '🍔' },
  { id: 'c-taxi', name: 'Такси', emoji: '🚕' },
]

jest.mock('@/entities/expense', () => ({
  ARCHIVED_POCKET_OPERATION_HINT:
    'Карман в архиве — восстановите, чтобы изменить',
  useUpdateExpense: () => ({ mutate: mockMutate }),
}))

jest.mock('@/entities/category', () => ({
  useCategoryStore: (
    selector: (state: { categories: Category[] }) => unknown
  ) => selector({ categories: mockCategories }),
}))

jest.mock('@/entities/keyword-mapping', () => ({
  useSaveKeywordMapping: () => ({ mutate: mockSaveRule }),
}))

jest.mock('@/entities/pocket', () => ({
  usePockets: () => ({ data: mockPockets }),
}))

const lunch: Expense = {
  id: 'lunch',
  description: 'Обед',
  amount: 500,
  date: '2026-01-31',
  category: 'Еда',
  emoji: '🍔',
}

function renderDialog(expense: Expense) {
  const onClose = jest.fn()
  render(<ExpenseEditDialog expense={expense} onClose={onClose} />)
  return { onClose }
}

describe('ExpenseEditDialog', () => {
  beforeEach(() => {
    mockMutate.mockReset()
    mockSaveRule.mockReset()
    mockPockets = []
  })

  it('saves an exact rule for the new description when the category changes', () => {
    renderDialog(lunch)

    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: ' Такси домой ' },
    })
    fireEvent.change(screen.getByLabelText('Категория'), {
      target: { value: 'Такси' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockSaveRule).toHaveBeenCalledTimes(1)
    expect(mockSaveRule).toHaveBeenCalledWith({
      keyword: 'Такси домой',
      categoryId: 'c-taxi',
    })
  })

  it('does not save a rule when only the description changes', () => {
    renderDialog(lunch)

    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: 'Бизнес-ланч' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockSaveRule).not.toHaveBeenCalled()
  })

  it('saves amount, description, category, and a move to another month in one update', () => {
    const { onClose } = renderDialog(lunch)

    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: ' Такси домой ' },
    })
    fireEvent.change(screen.getByLabelText('Сумма'), {
      target: { value: '300+50,5' },
    })
    fireEvent.change(screen.getByLabelText('Категория'), {
      target: { value: 'Такси' },
    })
    fireEvent.change(screen.getByLabelText('Дата'), {
      target: { value: '2026-02-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockMutate).toHaveBeenCalledWith({
      id: 'lunch',
      data: {
        description: 'Такси домой',
        amount: 350.5,
        date: '2026-02-01',
        category: 'Такси',
        emoji: '🚕',
      },
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('sends only the date when only the date changes', () => {
    renderDialog(lunch)
    fireEvent.change(screen.getByLabelText('Дата'), {
      target: { value: '2026-01-05' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(mockMutate).toHaveBeenCalledWith({
      id: 'lunch',
      data: { date: '2026-01-05' },
    })
  })

  it('keeps save disabled without changes or with an invalid amount', () => {
    renderDialog(lunch)
    const save = screen.getByRole('button', { name: 'Сохранить' })
    expect(save).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Сумма'), {
      target: { value: '0' },
    })
    expect(save).toBeDisabled()
  })

  it('locks the category of a shared-budget expense with a hint', () => {
    renderDialog({
      ...lunch,
      sharedBudgetId: 'shared-1',
      sharedBudgetCategoryId: 'shared-cat',
    })

    expect(screen.getByLabelText('Категория')).toBeDisabled()
    expect(
      screen.getByText('Категорию общего расхода нельзя изменить здесь')
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Сумма'), {
      target: { value: '600' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(mockMutate).toHaveBeenCalledWith({
      id: 'lunch',
      data: { amount: 600 },
    })
  })

  it('opens operations of an archived pocket read-only', () => {
    mockPockets = [{ id: 'pocket-1', archivedAt: '2026-01-10T00:00:00Z' }]
    renderDialog({ ...lunch, pocketId: 'pocket-1' })

    expect(
      screen.getByText('Карман в архиве — восстановите, чтобы изменить')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Описание')).toBeDisabled()
    expect(screen.getByLabelText('Сумма')).toBeDisabled()
    expect(screen.getByLabelText('Категория')).toBeDisabled()
    expect(screen.getByLabelText('Дата')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('allows a pocket transfer to drop to zero but not below', () => {
    renderDialog({
      ...lunch,
      pocketId: 'pocket-1',
      operationType: 'pocket_transfer',
      category: 'Перевод из кармана',
      emoji: '↗️',
    })
    const save = screen.getByRole('button', { name: 'Сохранить' })
    expect(screen.getByLabelText('Категория')).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Сумма'), {
      target: { value: '-1' },
    })
    expect(save).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Сумма'), {
      target: { value: '0' },
    })
    fireEvent.click(save)
    expect(mockMutate).toHaveBeenCalledWith({
      id: 'lunch',
      data: { amount: 0 },
    })
  })

  it('lets project withdrawals change only description and date', () => {
    renderDialog({
      ...lunch,
      projectId: 'project-1',
      operationType: 'project_withdrawal',
    })
    expect(screen.getByLabelText('Сумма')).toBeDisabled()
    expect(screen.getByLabelText('Категория')).toBeDisabled()
    expect(screen.getByLabelText('Дата')).not.toBeDisabled()
  })

  it('closes on Escape without saving', () => {
    const { onClose } = renderDialog(lunch)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
    expect(mockMutate).not.toHaveBeenCalled()
  })
})
