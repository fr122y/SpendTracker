jest.mock('@/shared/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn(() => ({})),
  asc: jest.fn(() => ({})),
  eq: jest.fn(() => ({})),
  inArray: jest.fn(() => ({})),
}))

jest.mock('@/shared/db', () => {
  const mocks = {
    insertValues: jest.fn(),
    orderBy: jest.fn(),
    selectWhere: jest.fn(),
    txInsertValues: jest.fn(),
    txUpdateSet: jest.fn(),
    txUpdateWhere: jest.fn(),
    updateSet: jest.fn(),
    updateWhere: jest.fn(),
  }

  const makeSelect = () => ({
    from: jest.fn(() => ({
      innerJoin: jest.fn(() => ({
        where: mocks.selectWhere,
      })),
      where: mocks.selectWhere,
    })),
  })

  const db = {
    select: jest.fn(makeSelect),
    insert: jest.fn(() => ({
      values: mocks.insertValues,
    })),
    update: jest.fn(() => ({
      set: mocks.updateSet,
    })),
    transaction: jest.fn(async (callback) =>
      callback({
        insert: jest.fn(() => ({
          values: mocks.txInsertValues,
        })),
        update: jest.fn(() => ({
          set: mocks.txUpdateSet,
        })),
      })
    ),
  }

  mocks.updateSet.mockReturnValue({ where: mocks.updateWhere })
  mocks.txUpdateSet.mockReturnValue({ where: mocks.txUpdateWhere })

  return {
    __mocks: mocks,
    db,
    categories: {
      userId: 'category.userId',
      name: 'category.name',
      emoji: 'category.emoji',
    },
    sharedBudgetCategories: {
      id: 'sharedCategory.id',
      sharedBudgetId: 'sharedCategory.sharedBudgetId',
      name: 'sharedCategory.name',
      emoji: 'sharedCategory.emoji',
    },
    sharedBudgetMembers: {
      sharedBudgetId: 'member.sharedBudgetId',
      userId: 'member.userId',
      role: 'member.role',
      isActive: 'member.isActive',
      joinedAt: 'member.joinedAt',
    },
    sharedBudgets: {
      id: 'sharedBudget.id',
      name: 'sharedBudget.name',
      createdByUserId: 'sharedBudget.createdByUserId',
      archivedAt: 'sharedBudget.archivedAt',
      createdAt: 'sharedBudget.createdAt',
    },
    sharedBudgetWeeklyLimits: {
      id: 'limit.id',
      sharedBudgetId: 'limit.sharedBudgetId',
      effectiveWeekStart: 'limit.effectiveWeekStart',
      amount: 'limit.amount',
    },
    users: {
      id: 'user.id',
      name: 'user.name',
      email: 'user.email',
    },
  }
})

import { auth } from '@/shared/auth'

import {
  archiveSharedBudget,
  createSharedBudget,
  setActiveSharedBudget,
} from '../shared-budget-actions'

describe('shared-budget-actions', () => {
  const dbModule = jest.requireMock('@/shared/db') as {
    __mocks: {
      orderBy: jest.Mock
      selectWhere: jest.Mock
      txInsertValues: jest.Mock
      txUpdateSet: jest.Mock
      txUpdateWhere: jest.Mock
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('creates a shared budget with owner membership and initial limit', async () => {
    dbModule.__mocks.selectWhere
      .mockResolvedValueOnce([
        { name: 'Продукты', emoji: '🛒' },
        { name: 'Кафе', emoji: '☕' },
      ])
      .mockReturnValueOnce({ orderBy: dbModule.__mocks.orderBy })
      .mockResolvedValueOnce([
        {
          sharedBudgetId: 'shared-1',
          userId: 'user-1',
          name: 'Ilya',
          email: 'ilya@example.com',
          role: 'owner',
          isActive: true,
          joinedAt: new Date('2026-06-15T00:00:00.000Z'),
        },
      ])
      .mockReturnValueOnce({ orderBy: dbModule.__mocks.orderBy })
    dbModule.__mocks.orderBy
      .mockResolvedValueOnce([
        {
          id: 'shared-1',
          name: 'Общий бюджет',
          createdByUserId: 'user-1',
          archivedAt: null,
          createdAt: new Date('2026-06-15T00:00:00.000Z'),
          role: 'owner',
          isActive: true,
        },
      ])
      .mockResolvedValueOnce([
        {
          sharedBudgetId: 'shared-1',
          effectiveWeekStart: '2026-06-15',
          amount: 8000,
        },
      ])

    const result = await createSharedBudget({
      name: '  Общий бюджет  ',
      initialWeeklyLimit: 8000,
      effectiveWeekStart: '2026-06-15',
    })

    expect(dbModule.__mocks.txUpdateSet).toHaveBeenCalledWith({
      isActive: false,
    })
    expect(dbModule.__mocks.txInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Общий бюджет',
        createdByUserId: 'user-1',
      })
    )
    expect(dbModule.__mocks.txInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'owner',
        isActive: true,
        userId: 'user-1',
      })
    )
    expect(dbModule.__mocks.txInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveWeekStart: '2026-06-15',
        amount: 8000,
      })
    )
    expect(dbModule.__mocks.txInsertValues).toHaveBeenCalledWith([
      expect.objectContaining({
        sharedBudgetId: expect.any(String),
        name: 'Продукты',
        emoji: '🛒',
      }),
      expect.objectContaining({
        sharedBudgetId: expect.any(String),
        name: 'Кафе',
        emoji: '☕',
      }),
    ])
    expect(result).toEqual(
      expect.objectContaining({
        name: 'Общий бюджет',
        role: 'owner',
        isActive: true,
      })
    )
  })

  it('rejects archive when the current user is only a member', async () => {
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([
      { role: 'member', archivedAt: null },
    ])

    await expect(archiveSharedBudget('shared-1')).rejects.toThrow(
      'Only the shared budget owner can perform this action'
    )
  })

  it('switches active shared budget for the current user', async () => {
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([
      { role: 'member', archivedAt: null },
    ])

    await setActiveSharedBudget('shared-1')

    expect(dbModule.__mocks.txUpdateSet).toHaveBeenCalledWith({
      isActive: false,
    })
    expect(dbModule.__mocks.txUpdateSet).toHaveBeenCalledWith({
      isActive: true,
    })
  })
})
