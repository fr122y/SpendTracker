jest.mock('@/shared/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn(() => ({})),
  eq: jest.fn(() => ({})),
  isNull: jest.fn(() => ({})),
}))

jest.mock('../shared-budget-actions', () => ({
  assertCanUseSharedBudget: jest.fn(),
}))

jest.mock('@/shared/db', () => {
  const mocks = {
    insertValues: jest.fn(),
    selectWhere: jest.fn(),
    updateSet: jest.fn(),
    updateWhere: jest.fn(),
  }

  const db = {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: mocks.selectWhere,
      })),
    })),
    insert: jest.fn(() => ({
      values: mocks.insertValues,
    })),
    update: jest.fn(() => ({
      set: mocks.updateSet,
    })),
  }

  mocks.updateSet.mockReturnValue({ where: mocks.updateWhere })

  return {
    __mocks: mocks,
    db,
    sharedBudgetCategories: {
      id: 'sharedCategory.id',
      sharedBudgetId: 'sharedCategory.sharedBudgetId',
      name: 'sharedCategory.name',
      emoji: 'sharedCategory.emoji',
      archivedAt: 'sharedCategory.archivedAt',
      createdAt: 'sharedCategory.createdAt',
    },
  }
})

import { auth } from '@/shared/auth'

import { assertCanUseSharedBudget } from '../shared-budget-actions'
import {
  addSharedBudgetCategory,
  archiveSharedBudgetCategory,
  getSharedBudgetCategories,
  getSharedCategoryForExpense,
  updateSharedBudgetCategory,
} from '../shared-category-actions'

describe('shared-category-actions', () => {
  const dbModule = jest.requireMock('@/shared/db') as {
    __mocks: {
      insertValues: jest.Mock
      selectWhere: jest.Mock
      updateSet: jest.Mock
      updateWhere: jest.Mock
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns active categories only after membership check', async () => {
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([
      {
        id: 'shared-category-1',
        sharedBudgetId: 'shared-1',
        name: 'Продукты',
        emoji: '🛒',
        archivedAt: null,
        createdAt: new Date('2026-06-15T00:00:00.000Z'),
      },
    ])

    const result = await getSharedBudgetCategories('shared-1')

    expect(assertCanUseSharedBudget).toHaveBeenCalledWith('shared-1', 'user-1')
    expect(result).toEqual([
      {
        id: 'shared-category-1',
        sharedBudgetId: 'shared-1',
        name: 'Продукты',
        emoji: '🛒',
        archivedAt: undefined,
        createdAt: '2026-06-15T00:00:00.000Z',
      },
    ])
  })

  it('adds a shared category for an active member', async () => {
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([
      {
        id: 'shared-category-1',
        sharedBudgetId: 'shared-1',
        name: 'Аптека',
        emoji: '💊',
        archivedAt: null,
        createdAt: new Date('2026-06-15T00:00:00.000Z'),
      },
    ])

    const result = await addSharedBudgetCategory('shared-1', {
      name: '  Аптека  ',
      emoji: ' 💊 ',
    })

    expect(assertCanUseSharedBudget).toHaveBeenCalledWith('shared-1', 'user-1')
    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        sharedBudgetId: 'shared-1',
        name: 'Аптека',
        emoji: '💊',
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        sharedBudgetId: 'shared-1',
        name: 'Аптека',
        emoji: '💊',
      })
    )
  })

  it('updates a non-archived shared category for an active member', async () => {
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([
      {
        id: 'shared-category-1',
        sharedBudgetId: 'shared-1',
        name: 'Продукты',
        emoji: '🛒',
        archivedAt: null,
        createdAt: new Date('2026-06-15T00:00:00.000Z'),
      },
    ])

    await updateSharedBudgetCategory('shared-category-1', {
      name: 'Супермаркет',
      emoji: '🛍️',
    })

    expect(assertCanUseSharedBudget).toHaveBeenCalledWith('shared-1', 'user-1')
    expect(dbModule.__mocks.updateSet).toHaveBeenCalledWith({
      name: 'Супермаркет',
      emoji: '🛍️',
    })
  })

  it('archives instead of deleting a shared category', async () => {
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([
      {
        id: 'shared-category-1',
        sharedBudgetId: 'shared-1',
        name: 'Продукты',
        emoji: '🛒',
        archivedAt: null,
        createdAt: new Date('2026-06-15T00:00:00.000Z'),
      },
    ])

    await archiveSharedBudgetCategory('shared-category-1')

    expect(assertCanUseSharedBudget).toHaveBeenCalledWith('shared-1', 'user-1')
    expect(dbModule.__mocks.updateSet).toHaveBeenCalledWith({
      archivedAt: expect.any(Date),
    })
  })

  it('resolves category metadata for a shared expense', async () => {
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([
      { name: 'Общие продукты', emoji: '🛒' },
    ])

    const result = await getSharedCategoryForExpense(
      'shared-1',
      'shared-category-1',
      'user-1'
    )

    expect(assertCanUseSharedBudget).toHaveBeenCalledWith('shared-1', 'user-1')
    expect(result).toEqual({ name: 'Общие продукты', emoji: '🛒' })
  })

  it('rejects missing, archived, or foreign shared categories for expenses', async () => {
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([])

    await expect(
      getSharedCategoryForExpense('shared-1', 'shared-category-2', 'user-1')
    ).rejects.toThrow('Shared category not found')
  })
})
