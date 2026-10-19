jest.mock('@/shared/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn((...conditions: unknown[]) => ({ and: conditions })),
  count: jest.fn(() => 'count(*)'),
  eq: jest.fn((column: unknown, value: unknown) => ({ eq: [column, value] })),
  isNull: jest.fn((column: unknown) => ({ isNull: column })),
}))

jest.mock('@/shared/db', () => {
  const mocks = {
    selectWhere: jest.fn(),
    updateSet: jest.fn(),
    updateWhere: jest.fn(),
    updateReturning: jest.fn(),
    deleteFrom: jest.fn(),
    deleteWhere: jest.fn(),
  }

  mocks.updateSet.mockReturnValue({ where: mocks.updateWhere })
  mocks.updateWhere.mockReturnValue({ returning: mocks.updateReturning })

  const tx = {
    select: jest.fn(() => ({
      from: jest.fn(() => ({ where: mocks.selectWhere })),
    })),
    update: jest.fn(() => ({ set: mocks.updateSet })),
    delete: jest.fn((table: unknown) => {
      mocks.deleteFrom(table)
      return { where: mocks.deleteWhere }
    }),
  }

  const db = {
    ...tx,
    transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  }

  return {
    __mocks: mocks,
    db,
    categories: {
      id: 'category.id',
      userId: 'category.userId',
      name: 'category.name',
      emoji: 'category.emoji',
      color: 'category.color',
    },
    expenses: {
      id: 'expense.id',
      userId: 'expense.userId',
      sharedBudgetId: 'expense.sharedBudgetId',
      category: 'expense.category',
      emoji: 'expense.emoji',
    },
    keywordMappings: { categoryId: 'keyword.categoryId' },
  }
})

import { auth } from '@/shared/auth'

import {
  addCategory,
  countCategoryExpenses,
  deleteCategoryWithReassign,
  updateCategory,
} from '../category-actions'

const ownCategories = [
  { id: 'food', name: 'Продукты', emoji: '🛒' },
  { id: 'other', name: 'Другое', emoji: '📝' },
]

const personalFoodFilter = {
  and: [
    { eq: ['expense.userId', 'user-1'] },
    { isNull: 'expense.sharedBudgetId' },
    { eq: ['expense.category', 'Продукты'] },
  ],
}

describe('category-actions', () => {
  const dbModule = jest.requireMock('@/shared/db') as {
    __mocks: Record<string, jest.Mock>
    db: { transaction: jest.Mock; update: jest.Mock }
    categories: unknown
  }
  const mocks = dbModule.__mocks

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere })
    mocks.updateWhere.mockReturnValue({ returning: mocks.updateReturning })
  })

  describe('deleteCategoryWithReassign', () => {
    it('moves own personal expenses to the target and returns the count', async () => {
      mocks.selectWhere.mockResolvedValueOnce(ownCategories)
      mocks.updateReturning.mockResolvedValueOnce([{ id: 'e1' }, { id: 'e2' }])

      const result = await deleteCategoryWithReassign('food', 'other')

      expect(result).toEqual({ moved: 2 })
      expect(dbModule.db.transaction).toHaveBeenCalledTimes(1)
      expect(mocks.updateSet).toHaveBeenCalledWith({
        category: 'Другое',
        emoji: '📝',
      })
      // Only the user's expenses outside shared budgets are touched.
      expect(mocks.updateWhere).toHaveBeenCalledWith(personalFoodFilter)
    })

    it('deletes only the category row and relies on the rules cascade', async () => {
      mocks.selectWhere.mockResolvedValueOnce(ownCategories)
      mocks.updateReturning.mockResolvedValueOnce([])

      await deleteCategoryWithReassign('food', 'other')

      expect(mocks.deleteFrom).toHaveBeenCalledTimes(1)
      expect(mocks.deleteFrom).toHaveBeenCalledWith(dbModule.categories)
      expect(mocks.deleteWhere).toHaveBeenCalledWith({
        and: [
          { eq: ['category.id', 'food'] },
          { eq: ['category.userId', 'user-1'] },
        ],
      })
    })

    it('rejects the same category as target', async () => {
      await expect(deleteCategoryWithReassign('food', 'food')).rejects.toThrow(
        'Target category must differ'
      )
      expect(dbModule.db.transaction).not.toHaveBeenCalled()
    })

    it('rejects a target that belongs to another user', async () => {
      mocks.selectWhere.mockResolvedValueOnce(ownCategories)

      await expect(
        deleteCategoryWithReassign('food', 'foreign')
      ).rejects.toThrow('Target category not found')
      expect(dbModule.db.update).not.toHaveBeenCalled()
      expect(mocks.deleteFrom).not.toHaveBeenCalled()
    })

    it('rejects a category that belongs to another user', async () => {
      mocks.selectWhere.mockResolvedValueOnce(ownCategories)

      await expect(
        deleteCategoryWithReassign('foreign', 'other')
      ).rejects.toThrow('Category not found')
      expect(mocks.deleteFrom).not.toHaveBeenCalled()
    })

    it('rejects deleting the last category', async () => {
      mocks.selectWhere.mockResolvedValueOnce([ownCategories[0]])

      await expect(
        deleteCategoryWithReassign('food', 'other')
      ).rejects.toThrow()
      expect(mocks.deleteFrom).not.toHaveBeenCalled()
    })

    it('rejects unauthenticated calls', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      await expect(deleteCategoryWithReassign('food', 'other')).rejects.toThrow(
        'Unauthorized'
      )
    })
  })

  describe('addCategory', () => {
    it('rejects a 41-character name with a Russian message', async () => {
      await expect(
        addCategory({ name: 'к'.repeat(41), emoji: '🛒' })
      ).rejects.toThrow('Название категории не длиннее 40 символов')
    })
  })

  describe('countCategoryExpenses', () => {
    it('counts own personal expenses with the category name', async () => {
      mocks.selectWhere
        .mockResolvedValueOnce([{ name: 'Продукты' }])
        .mockResolvedValueOnce([{ value: 3 }])

      await expect(countCategoryExpenses('food')).resolves.toBe(3)
      expect(mocks.selectWhere).toHaveBeenLastCalledWith(personalFoodFilter)
    })

    it('rejects a category of another user', async () => {
      mocks.selectWhere.mockResolvedValueOnce([])

      await expect(countCategoryExpenses('foreign')).rejects.toThrow(
        'Category not found'
      )
    })
  })

  describe('updateCategory', () => {
    const owned = [
      { id: 'food', name: 'Продукты', emoji: '🛒', color: null },
      { id: 'other', name: 'Другое', emoji: '📝', color: '#047857' },
    ]

    it('renames own personal expenses with the category in one transaction', async () => {
      mocks.selectWhere.mockResolvedValueOnce(owned)

      const result = await updateCategory('food', { name: '  Еда  ' })

      expect(result).toEqual({
        id: 'food',
        name: 'Еда',
        emoji: '🛒',
        color: null,
      })
      expect(dbModule.db.transaction).toHaveBeenCalledTimes(1)
      expect(mocks.updateSet).toHaveBeenNthCalledWith(1, {
        name: 'Еда',
        emoji: '🛒',
        color: null,
      })
      expect(mocks.updateWhere).toHaveBeenNthCalledWith(1, {
        and: [
          { eq: ['category.id', 'food'] },
          { eq: ['category.userId', 'user-1'] },
        ],
      })
      expect(mocks.updateSet).toHaveBeenNthCalledWith(2, {
        category: 'Еда',
        emoji: '🛒',
      })
      // Only the user's expenses outside shared budgets with the old name:
      // other users and shared-budget expenses are not touched.
      expect(mocks.updateWhere).toHaveBeenNthCalledWith(2, personalFoodFilter)
    })

    it('updates the emoji on the expenses when only the emoji changes', async () => {
      mocks.selectWhere.mockResolvedValueOnce(owned)

      await updateCategory('food', { emoji: '👨‍👩‍👧' })

      expect(mocks.updateSet).toHaveBeenNthCalledWith(2, {
        category: 'Продукты',
        emoji: '👨‍👩‍👧',
      })
      expect(mocks.updateWhere).toHaveBeenNthCalledWith(2, personalFoodFilter)
    })

    it('rejects a 41-character new name with a Russian message', async () => {
      mocks.selectWhere.mockResolvedValueOnce(owned)

      await expect(
        updateCategory('food', { name: 'к'.repeat(41) })
      ).rejects.toThrow('Название категории не длиннее 40 символов')
      expect(mocks.updateSet).not.toHaveBeenCalled()
    })

    it('keeps an unchanged legacy name longer than the limit', async () => {
      const legacy = 'л'.repeat(90)
      mocks.selectWhere.mockResolvedValueOnce([
        { id: 'long', name: legacy, emoji: '🛒', color: null },
      ])

      await updateCategory('long', { name: legacy, color: '#be185d' })

      expect(mocks.updateSet).toHaveBeenCalledWith({
        name: legacy,
        emoji: '🛒',
        color: '#be185d',
      })
    })

    it('changes only the category row for a color change', async () => {
      mocks.selectWhere.mockResolvedValueOnce(owned)

      await updateCategory('food', { color: '#be185d' })

      expect(mocks.updateSet).toHaveBeenCalledTimes(1)
      expect(mocks.updateSet).toHaveBeenCalledWith({
        name: 'Продукты',
        emoji: '🛒',
        color: '#be185d',
      })
    })

    it('resets the color to the automatic one with null', async () => {
      mocks.selectWhere.mockResolvedValueOnce(owned)

      await updateCategory('other', { color: null })

      expect(mocks.updateSet).toHaveBeenCalledWith({
        name: 'Другое',
        emoji: '📝',
        color: null,
      })
    })

    it('allows a case-only rename of the same category', async () => {
      mocks.selectWhere.mockResolvedValueOnce(owned)

      await expect(
        updateCategory('food', { name: 'продукты' })
      ).resolves.toMatchObject({ name: 'продукты' })
    })

    it('rejects a duplicate name regardless of case', async () => {
      mocks.selectWhere.mockResolvedValueOnce(owned)

      await expect(updateCategory('food', { name: 'ДРУГОЕ' })).rejects.toThrow(
        'Category with this name already exists'
      )
      expect(mocks.updateSet).not.toHaveBeenCalled()
    })

    it.each([
      [{ name: '   ' }, 'Category name is required'],
      [{ emoji: '' }, 'Category emoji must be one character'],
      [{ emoji: '🛒🚕' }, 'Category emoji must be one character'],
      [{ emoji: 'ab' }, 'Category emoji must be one character'],
      [{ color: '#BE185D' }, 'Category color must be a palette color'],
      [{ color: 'red' }, 'Category color must be a palette color'],
      [{ color: '#123456' }, 'Category color must be a palette color'],
    ])('rejects invalid input %j', async (data, message) => {
      await expect(updateCategory('food', data)).rejects.toThrow(message)
      expect(dbModule.db.transaction).not.toHaveBeenCalled()
    })

    it('rejects a category of another user', async () => {
      mocks.selectWhere.mockResolvedValueOnce(owned)

      await expect(updateCategory('foreign', { name: 'Еда' })).rejects.toThrow(
        'Category not found'
      )
      expect(mocks.updateSet).not.toHaveBeenCalled()
    })

    it('rejects unauthenticated calls', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      await expect(updateCategory('food', { name: 'Еда' })).rejects.toThrow(
        'Unauthorized'
      )
    })
  })
})
