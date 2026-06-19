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
    categorySelectWhere: jest.fn(),
    insertValues: jest.fn(),
    insertReturning: jest.fn(),
    mappingSelectWhere: jest.fn(),
  }

  mocks.insertValues.mockReturnValue({
    onConflictDoUpdate: jest.fn(() => ({
      returning: mocks.insertReturning,
    })),
  })

  let selectCall = 0
  const db = {
    select: jest.fn(() => {
      selectCall += 1
      const where =
        selectCall === 1 ? mocks.categorySelectWhere : mocks.mappingSelectWhere

      return {
        from: jest.fn(() => ({
          innerJoin: jest.fn(() => ({
            where,
          })),
          where,
        })),
      }
    }),
    insert: jest.fn(() => ({
      values: mocks.insertValues,
    })),
  }

  return {
    __mocks: {
      ...mocks,
      resetSelectCall: () => {
        selectCall = 0
      },
    },
    db,
    sharedBudgetCategories: {
      id: 'sharedCategory.id',
      sharedBudgetId: 'sharedCategory.sharedBudgetId',
      name: 'sharedCategory.name',
      emoji: 'sharedCategory.emoji',
      archivedAt: 'sharedCategory.archivedAt',
    },
    sharedBudgetKeywordMappings: {
      id: 'sharedKeyword.id',
      sharedBudgetId: 'sharedKeyword.sharedBudgetId',
      keyword: 'sharedKeyword.keyword',
      sharedBudgetCategoryId: 'sharedKeyword.sharedBudgetCategoryId',
    },
  }
})

import { auth } from '@/shared/auth'

import { assertCanUseSharedBudget } from '../shared-budget-actions'
import {
  getSharedKeywordMappings,
  saveSharedKeywordMapping,
} from '../shared-keyword-actions'

describe('shared-keyword-actions', () => {
  const dbModule = jest.requireMock('@/shared/db') as {
    __mocks: {
      categorySelectWhere: jest.Mock
      insertValues: jest.Mock
      insertReturning: jest.Mock
      mappingSelectWhere: jest.Mock
      resetSelectCall: () => void
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    dbModule.__mocks.resetSelectCall()
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns joined shared keyword mappings after membership check', async () => {
    dbModule.__mocks.categorySelectWhere.mockResolvedValueOnce([
      {
        id: 'm1',
        keyword: 'молоко',
        categoryId: 'shared-category-1',
        categoryName: 'Продукты',
        categoryEmoji: '🧺',
      },
    ])

    const result = await getSharedKeywordMappings('shared-1')

    expect(assertCanUseSharedBudget).toHaveBeenCalledWith('shared-1', 'user-1')
    expect(result).toEqual([
      {
        id: 'm1',
        keyword: 'молоко',
        categoryId: 'shared-category-1',
        categoryName: 'Продукты',
        categoryEmoji: '🧺',
      },
    ])
  })

  it('normalizes keyword and upserts mapping for a shared category', async () => {
    dbModule.__mocks.categorySelectWhere.mockResolvedValueOnce([
      {
        id: 'shared-category-1',
        name: 'Продукты',
        emoji: '🧺',
      },
    ])
    dbModule.__mocks.insertReturning.mockResolvedValueOnce([{ id: 'm1' }])
    dbModule.__mocks.mappingSelectWhere.mockResolvedValueOnce([
      {
        id: 'm1',
        keyword: 'молоко',
        categoryId: 'shared-category-1',
        categoryName: 'Продукты',
        categoryEmoji: '🧺',
      },
    ])

    const result = await saveSharedKeywordMapping(
      'shared-1',
      '  МоЛоКо  ',
      'shared-category-1'
    )

    expect(assertCanUseSharedBudget).toHaveBeenCalledWith('shared-1', 'user-1')
    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        sharedBudgetId: 'shared-1',
        keyword: 'молоко',
        sharedBudgetCategoryId: 'shared-category-1',
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        id: 'm1',
        keyword: 'молоко',
        categoryName: 'Продукты',
      })
    )
  })

  it('rejects empty keyword', async () => {
    await expect(
      saveSharedKeywordMapping('shared-1', '   ', 'shared-category-1')
    ).rejects.toThrow('Keyword is required')
  })

  it('rejects missing, archived, or foreign shared category', async () => {
    dbModule.__mocks.categorySelectWhere.mockResolvedValueOnce([])

    await expect(
      saveSharedKeywordMapping('shared-1', 'молоко', 'shared-category-2')
    ).rejects.toThrow('Shared category not found')
  })

  it('throws unauthorized when no session user id', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce({ user: {} })

    await expect(getSharedKeywordMappings('shared-1')).rejects.toThrow(
      'Unauthorized'
    )
  })
})
