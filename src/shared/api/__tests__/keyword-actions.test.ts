jest.mock('@/shared/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(() => ({})),
  and: jest.fn(() => ({})),
}))

jest.mock('@/shared/db', () => {
  const mocks = {
    selectWhere: jest.fn(),
    insertValues: jest.fn(),
    insertReturning: jest.fn(),
    deleteWhere: jest.fn(),
  }

  mocks.insertValues.mockReturnValue({
    onConflictDoUpdate: jest.fn(() => ({
      returning: mocks.insertReturning,
    })),
  })

  const db = {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        innerJoin: jest.fn(() => ({
          where: mocks.selectWhere,
        })),
      })),
    })),
    insert: jest.fn(() => ({
      values: mocks.insertValues,
    })),
    delete: jest.fn(() => ({
      where: mocks.deleteWhere,
    })),
  }

  return {
    __mocks: mocks,
    db,
    categories: {
      id: 'category.id',
      name: 'category.name',
      emoji: 'category.emoji',
    },
    keywordMappings: {
      id: 'keyword.id',
      userId: 'keyword.userId',
      keyword: 'keyword.keyword',
      categoryId: 'keyword.categoryId',
    },
  }
})

import { auth } from '@/shared/auth'

import {
  deleteKeywordMapping,
  getKeywordMappings,
  saveKeywordMapping,
} from '../keyword-actions'

describe('keyword-actions', () => {
  const dbModule = jest.requireMock('@/shared/db') as {
    __mocks: {
      selectWhere: jest.Mock
      insertValues: jest.Mock
      insertReturning: jest.Mock
      deleteWhere: jest.Mock
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns joined keyword mappings for current user', async () => {
    const rows = [
      {
        id: 'm1',
        keyword: 'молоко',
        categoryId: 'c1',
        categoryName: 'Продукты',
        categoryEmoji: '🛒',
      },
    ]
    dbModule.__mocks.selectWhere.mockResolvedValueOnce(rows)

    const result = await getKeywordMappings()

    expect(result).toEqual(rows)
  })

  it('normalizes keyword before save and returns saved mapping', async () => {
    dbModule.__mocks.insertReturning.mockResolvedValueOnce([{ id: 'm1' }])
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([
      {
        id: 'm1',
        keyword: 'молоко',
        categoryId: 'c1',
        categoryName: 'Продукты',
        categoryEmoji: '🛒',
      },
    ])

    const result = await saveKeywordMapping('  МоЛоКо  ', 'c1')

    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        categoryId: 'c1',
        keyword: 'молоко',
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

  it('throws for empty keyword', async () => {
    await expect(saveKeywordMapping('   ', 'c1')).rejects.toThrow(
      'Keyword is required'
    )
  })

  it('deletes mapping for authorized user', async () => {
    dbModule.__mocks.deleteWhere.mockResolvedValueOnce(undefined)

    await deleteKeywordMapping('m1')

    expect(dbModule.__mocks.deleteWhere).toHaveBeenCalled()
  })

  it('throws unauthorized when no session user id', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce({ user: {} })

    await expect(getKeywordMappings()).rejects.toThrow('Unauthorized')
  })
})
