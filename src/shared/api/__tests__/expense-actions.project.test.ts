jest.mock('@/shared/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn(() => ({})),
  eq: jest.fn(() => ({})),
  inArray: jest.fn(() => ({})),
  isNull: jest.fn(() => ({})),
  or: jest.fn(() => ({})),
}))

jest.mock('../shared-budget-actions', () => ({
  assertCanManageSharedBudgetExpense: jest.fn(),
  assertCanUseSharedBudget: jest.fn(),
}))

jest.mock('../shared-category-actions', () => ({
  getSharedCategoryForExpense: jest.fn(),
}))

jest.mock('../project-helpers', () => ({
  ...jest.requireActual('../project-helpers'),
  assertProjectCashCovers: jest.fn(),
}))

jest.mock('@/shared/db', () => {
  const mocks = {
    insertValues: jest.fn(),
    txInsertValues: jest.fn(),
    txDeleteWhere: jest.fn(),
    deleteWhere: jest.fn(),
    txUpdateSet: jest.fn(),
    txUpdateWhere: jest.fn(),
    updateSet: jest.fn(),
    updateWhere: jest.fn(),
    existingWhere: jest.fn(),
  }
  const transaction = {
    insert: jest.fn(() => ({ values: mocks.txInsertValues })),
    delete: jest.fn(() => ({ where: mocks.txDeleteWhere })),
    update: jest.fn(() => ({ set: mocks.txUpdateSet })),
  }
  mocks.txUpdateSet.mockReturnValue({ where: mocks.txUpdateWhere })
  mocks.updateSet.mockReturnValue({ where: mocks.updateWhere })

  return {
    __mocks: mocks,
    __transaction: transaction,
    db: {
      select: jest.fn(() => ({
        from: () => ({ where: mocks.existingWhere }),
      })),
      insert: jest.fn(() => ({ values: mocks.insertValues })),
      delete: jest.fn(() => ({ where: mocks.deleteWhere })),
      update: jest.fn(() => ({ set: mocks.updateSet })),
      transaction: jest.fn(
        async (callback: (tx: typeof transaction) => unknown) =>
          callback(transaction)
      ),
    },
    categories: {},
    expenses: { id: 'expense.id' },
    sharedBudgetMembers: {},
    sharedBudgets: {},
    users: {},
  }
})

import { addExpense, deleteExpense, updateExpense } from '../expense-actions'
import {
  assertProjectCashCovers,
  PROJECT_RETURN_EXCEEDS_CASH_ERROR,
} from '../project-helpers'

const dbModule = jest.requireMock('@/shared/db') as {
  __mocks: Record<string, jest.Mock>
  __transaction: unknown
}
const assertCash = assertProjectCashCovers as jest.Mock

describe('expense-actions project cash on hand', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    dbModule.__mocks.txUpdateSet.mockReturnValue({
      where: dbModule.__mocks.txUpdateWhere,
    })
    dbModule.__mocks.updateSet.mockReturnValue({
      where: dbModule.__mocks.updateWhere,
    })
  })

  it('checks a project return inside the insert transaction', async () => {
    await addExpense({
      description: 'остаток',
      amount: 4000,
      date: '2026-06-15',
      projectId: 'project-1',
      operationType: 'project_return',
    })

    expect(assertCash).toHaveBeenCalledWith(dbModule.__transaction, {
      userId: 'user-1',
      projectId: 'project-1',
      delta: -4000,
    })
    expect(dbModule.__mocks.txInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ operationType: 'project_return', amount: 4000 })
    )
    expect(dbModule.__mocks.insertValues).not.toHaveBeenCalled()
  })

  it('does not store a return that exceeds the cash on hand', async () => {
    assertCash.mockRejectedValueOnce(
      new Error(PROJECT_RETURN_EXCEEDS_CASH_ERROR)
    )

    await expect(
      addExpense({
        description: 'лишнее',
        amount: 7000,
        date: '2026-06-15',
        projectId: 'project-1',
        operationType: 'project_return',
      })
    ).rejects.toThrow(PROJECT_RETURN_EXCEEDS_CASH_ERROR)
    expect(dbModule.__mocks.txInsertValues).not.toHaveBeenCalled()
  })

  it('rechecks the balance when a return amount is edited', async () => {
    dbModule.__mocks.existingWhere.mockResolvedValueOnce([
      {
        userId: 'user-1',
        amount: 1000,
        projectId: 'project-1',
        pocketId: null,
        sharedBudgetId: null,
        sharedBudgetCategoryId: null,
        operationType: 'project_return',
      },
    ])

    await updateExpense('return-1', { amount: 3000 })

    expect(assertCash).toHaveBeenCalledWith(dbModule.__transaction, {
      userId: 'user-1',
      projectId: 'project-1',
      excludeExpenseId: 'return-1',
      delta: -3000,
    })
    expect(dbModule.__mocks.txUpdateSet).toHaveBeenCalledWith({ amount: 3000 })
  })

  it('updates personal expenses without a project lock', async () => {
    dbModule.__mocks.existingWhere.mockResolvedValueOnce([
      {
        userId: 'user-1',
        amount: 100,
        projectId: null,
        pocketId: null,
        sharedBudgetId: null,
        sharedBudgetCategoryId: null,
        operationType: 'expense',
      },
    ])

    await updateExpense('expense-1', { amount: 200 })

    expect(assertCash).not.toHaveBeenCalled()
    expect(dbModule.__mocks.updateSet).toHaveBeenCalledWith({ amount: 200 })
  })

  const withdrawal = {
    userId: 'user-1',
    sharedBudgetId: null,
    pocketId: null,
    projectId: 'project-1',
    operationType: 'project_withdrawal',
  }

  it('rejects deleting a withdrawal that would make cash on hand negative', async () => {
    dbModule.__mocks.existingWhere.mockResolvedValueOnce([withdrawal])
    assertCash.mockRejectedValueOnce(
      new Error(PROJECT_RETURN_EXCEEDS_CASH_ERROR)
    )

    await expect(deleteExpense('withdrawal-1')).resolves.toEqual({
      status: 'project_cash_negative',
    })
    expect(assertCash).toHaveBeenCalledWith(dbModule.__transaction, {
      userId: 'user-1',
      projectId: 'project-1',
      excludeExpenseId: 'withdrawal-1',
      delta: 0,
    })
    expect(dbModule.__mocks.txDeleteWhere).not.toHaveBeenCalled()
    expect(dbModule.__mocks.deleteWhere).not.toHaveBeenCalled()
  })

  it('deletes a covered withdrawal under the project lock', async () => {
    dbModule.__mocks.existingWhere.mockResolvedValueOnce([withdrawal])

    await expect(deleteExpense('withdrawal-1')).resolves.toEqual({
      status: 'deleted',
    })
    expect(dbModule.__mocks.txDeleteWhere).toHaveBeenCalled()
  })

  it('deletes a personal expense without a project lock', async () => {
    dbModule.__mocks.existingWhere.mockResolvedValueOnce([
      { ...withdrawal, projectId: null, operationType: 'expense' },
    ])

    await expect(deleteExpense('expense-1')).resolves.toEqual({
      status: 'deleted',
    })
    expect(assertCash).not.toHaveBeenCalled()
    expect(dbModule.__mocks.deleteWhere).toHaveBeenCalled()
  })
})
