jest.mock('@/shared/auth', () => ({
  auth: jest.fn(),
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

jest.mock('@/shared/db', () => {
  const mocks = {
    deleteWhere: jest.fn(),
    insertValues: jest.fn(),
    membershipWhere: jest.fn(),
    expenseWhere: jest.fn(),
    updateSet: jest.fn(),
    updateWhere: jest.fn(),
  }

  const membershipSelect = {
    from: jest.fn(() => ({
      where: mocks.membershipWhere,
    })),
  }
  const expenseSelect = {
    from: jest.fn(() => ({
      leftJoin: jest.fn(() => ({
        leftJoin: jest.fn(() => ({
          where: mocks.expenseWhere,
        })),
      })),
      where: mocks.expenseWhere,
    })),
  }

  const db = {
    select: jest
      .fn()
      .mockImplementationOnce(() => membershipSelect)
      .mockImplementation(() => expenseSelect),
    insert: jest.fn(() => ({
      values: mocks.insertValues,
    })),
    delete: jest.fn(() => ({
      where: mocks.deleteWhere,
    })),
    update: jest.fn(() => ({
      set: mocks.updateSet,
    })),
  }

  mocks.updateSet.mockReturnValue({ where: mocks.updateWhere })

  return {
    __mocks: mocks,
    db,
    expenses: {
      id: 'expense.id',
      userId: 'expense.userId',
      description: 'expense.description',
      amount: 'expense.amount',
      date: 'expense.date',
      category: 'expense.category',
      emoji: 'expense.emoji',
      projectId: 'expense.projectId',
      sharedBudgetId: 'expense.sharedBudgetId',
      sharedBudgetCategoryId: 'expense.sharedBudgetCategoryId',
      operationType: 'expense.operationType',
    },
    sharedBudgetMembers: {
      sharedBudgetId: 'member.sharedBudgetId',
      userId: 'member.userId',
    },
    sharedBudgets: {
      id: 'sharedBudget.id',
      name: 'sharedBudget.name',
    },
    users: {
      id: 'user.id',
      name: 'user.name',
    },
  }
})

import { auth } from '@/shared/auth'

import {
  addExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from '../expense-actions'
import {
  assertCanManageSharedBudgetExpense,
  assertCanUseSharedBudget,
} from '../shared-budget-actions'
import { getSharedCategoryForExpense } from '../shared-category-actions'

describe('expense-actions shared budget access', () => {
  const dbModule = jest.requireMock('@/shared/db') as {
    db: { select: jest.Mock }
    __mocks: {
      deleteWhere: jest.Mock
      expenseWhere: jest.Mock
      insertValues: jest.Mock
      membershipWhere: jest.Mock
      updateSet: jest.Mock
      updateWhere: jest.Mock
    }
  }

  const makeMembershipSelect = () => ({
    from: jest.fn(() => ({ where: dbModule.__mocks.membershipWhere })),
  })

  const makeExpenseSelect = () => ({
    from: jest.fn(() => ({
      leftJoin: jest.fn(() => ({
        leftJoin: jest.fn(() => ({
          where: dbModule.__mocks.expenseWhere,
        })),
      })),
      where: dbModule.__mocks.expenseWhere,
    })),
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })

    dbModule.db.select.mockReset()
    dbModule.db.select.mockImplementation(makeExpenseSelect)
  })

  it('returns personal expenses plus shared expenses from memberships', async () => {
    dbModule.db.select
      .mockImplementationOnce(makeMembershipSelect)
      .mockImplementation(makeExpenseSelect)
    dbModule.__mocks.membershipWhere.mockResolvedValueOnce([
      { sharedBudgetId: 'shared-1' },
    ])
    dbModule.__mocks.expenseWhere.mockResolvedValueOnce([
      {
        id: 'personal-1',
        authorUserId: 'user-1',
        authorName: 'Ilya',
        description: 'Личный расход',
        amount: 500,
        date: '2026-06-15',
        category: 'Еда',
        emoji: '☕',
        projectId: null,
        sharedBudgetId: null,
        sharedBudgetCategoryId: null,
        sharedBudgetName: null,
        operationType: 'expense',
      },
      {
        id: 'shared-expense-1',
        authorUserId: 'user-2',
        authorName: 'Partner',
        description: 'Общий расход',
        amount: 1200,
        date: '2026-06-15',
        category: 'Продукты',
        emoji: '🛒',
        projectId: null,
        sharedBudgetId: 'shared-1',
        sharedBudgetCategoryId: 'shared-category-1',
        sharedBudgetName: 'Общий бюджет',
        operationType: 'expense',
      },
    ])

    const result = await getExpenses()

    expect(result).toEqual([
      expect.objectContaining({
        id: 'personal-1',
        sharedBudgetId: undefined,
      }),
      expect.objectContaining({
        id: 'shared-expense-1',
        authorUserId: 'user-2',
        sharedBudgetId: 'shared-1',
        sharedBudgetCategoryId: 'shared-category-1',
        sharedBudgetName: 'Общий бюджет',
      }),
    ])
  })

  it('requires membership before adding a shared expense', async () => {
    ;(getSharedCategoryForExpense as jest.Mock).mockResolvedValueOnce({
      name: 'Общие продукты',
      emoji: '🛒',
    })

    await addExpense({
      description: 'Общий расход',
      amount: 900,
      date: '2026-06-15',
      category: 'Личная категория не используется',
      emoji: '❌',
      sharedBudgetId: 'shared-1',
      sharedBudgetCategoryId: 'shared-category-1',
    })

    expect(assertCanUseSharedBudget).toHaveBeenCalledWith('shared-1', 'user-1')
    expect(getSharedCategoryForExpense).toHaveBeenCalledWith(
      'shared-1',
      'shared-category-1',
      'user-1'
    )
    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        sharedBudgetId: 'shared-1',
        sharedBudgetCategoryId: 'shared-category-1',
        userId: 'user-1',
        category: 'Общие продукты',
        emoji: '🛒',
      })
    )
  })

  it('rejects shared expenses without a shared category', async () => {
    await expect(
      addExpense({
        description: 'Общий расход',
        amount: 900,
        date: '2026-06-15',
        category: 'Еда',
        emoji: '☕',
        sharedBudgetId: 'shared-1',
      })
    ).rejects.toThrow('Shared expenses require a shared category')

    expect(getSharedCategoryForExpense).not.toHaveBeenCalled()
    expect(dbModule.__mocks.insertValues).not.toHaveBeenCalled()
  })

  it('rejects project operations linked to a shared budget', async () => {
    await expect(
      addExpense({
        description: 'Нельзя',
        amount: 900,
        date: '2026-06-15',
        category: 'Проектные деньги',
        emoji: '💼',
        operationType: 'project_withdrawal',
        projectId: 'project-1',
        sharedBudgetId: 'shared-1',
      })
    ).rejects.toThrow('Shared expenses cannot be linked to project operations')

    expect(assertCanUseSharedBudget).not.toHaveBeenCalled()
  })

  it('allows a member to update a shared expense', async () => {
    dbModule.__mocks.expenseWhere.mockResolvedValueOnce([
      {
        userId: 'user-2',
        projectId: null,
        sharedBudgetId: 'shared-1',
        sharedBudgetCategoryId: 'shared-category-1',
        operationType: 'expense',
      },
    ])

    await updateExpense('expense-1', { amount: 1000 })

    expect(assertCanManageSharedBudgetExpense).toHaveBeenCalledWith(
      'shared-1',
      'user-1'
    )
    expect(dbModule.__mocks.updateSet).toHaveBeenCalledWith({ amount: 1000 })
  })

  it('prevents direct category metadata updates for shared expenses', async () => {
    dbModule.__mocks.expenseWhere.mockResolvedValueOnce([
      {
        userId: 'user-2',
        projectId: null,
        sharedBudgetId: 'shared-1',
        sharedBudgetCategoryId: 'shared-category-1',
        operationType: 'expense',
      },
    ])

    await expect(
      updateExpense('expense-1', { category: 'Личная', emoji: '❌' })
    ).rejects.toThrow('Shared expense category metadata cannot be changed')

    expect(dbModule.__mocks.updateSet).not.toHaveBeenCalled()
  })

  it('prevents non-authors from deleting private expenses', async () => {
    dbModule.__mocks.expenseWhere.mockResolvedValueOnce([
      {
        userId: 'user-2',
        sharedBudgetId: null,
      },
    ])

    await expect(deleteExpense('expense-1')).rejects.toThrow(
      'Expense not found'
    )
    expect(dbModule.__mocks.deleteWhere).not.toHaveBeenCalled()
  })
})
