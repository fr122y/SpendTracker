import { wrap } from '@reatom/core'

import {
  isCategoryNameDuplicate,
  categoriesAtom,
  addCategoryIfUnique,
} from '../model/store'

import type { Category } from '@/shared/types'

describe('isCategoryNameDuplicate', () => {
  const testCategories: Category[] = [
    { id: '1', name: 'Продукты', emoji: '🛒' },
    { id: '2', name: 'Транспорт', emoji: '🚕' },
  ]

  it('returns true for exact match', () => {
    expect(isCategoryNameDuplicate('Продукты', testCategories)).toBe(true)
  })

  it('returns true for case-insensitive match', () => {
    expect(isCategoryNameDuplicate('ПРОДУКТЫ', testCategories)).toBe(true)
    expect(isCategoryNameDuplicate('продукты', testCategories)).toBe(true)
    expect(isCategoryNameDuplicate('ПрОдУкТы', testCategories)).toBe(true)
  })

  it('returns true when name has leading/trailing whitespace', () => {
    expect(isCategoryNameDuplicate('  Продукты  ', testCategories)).toBe(true)
    expect(isCategoryNameDuplicate('\tТранспорт\n', testCategories)).toBe(true)
  })

  it('returns false for non-existent category', () => {
    expect(isCategoryNameDuplicate('Здоровье', testCategories)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isCategoryNameDuplicate('', testCategories)).toBe(false)
  })

  it('returns false for whitespace-only string', () => {
    expect(isCategoryNameDuplicate('   ', testCategories)).toBe(false)
  })

  it('returns false for partial match', () => {
    expect(isCategoryNameDuplicate('Продукт', testCategories)).toBe(false)
    expect(isCategoryNameDuplicate('Транс', testCategories)).toBe(false)
  })
})

describe('addCategoryIfUnique', () => {
  beforeEach(() => {
    // Reset categories to default state before each test
    categoriesAtom.set([
      { id: '1', name: 'Продукты', emoji: '🛒' },
      { id: '2', name: 'Транспорт', emoji: '🚕' },
    ])
  })

  it('returns true and adds category when name is unique', () => {
    const newCategory: Category = {
      id: '3',
      name: 'Здоровье',
      emoji: '💊',
    }

    const result = wrap(addCategoryIfUnique)(newCategory)

    expect(result).toBe(true)
    expect(categoriesAtom()).toContainEqual(newCategory)
    expect(categoriesAtom()).toHaveLength(3)
  })

  it('returns false and does not add category when name is duplicate', () => {
    const duplicateCategory: Category = {
      id: '3',
      name: 'Продукты',
      emoji: '🛒',
    }

    const result = wrap(addCategoryIfUnique)(duplicateCategory)

    expect(result).toBe(false)
    expect(categoriesAtom()).toHaveLength(2)
  })

  it('returns false for case-insensitive duplicate', () => {
    const duplicateCategory: Category = {
      id: '3',
      name: 'ПРОДУКТЫ',
      emoji: '🛒',
    }

    const result = wrap(addCategoryIfUnique)(duplicateCategory)

    expect(result).toBe(false)
    expect(categoriesAtom()).toHaveLength(2)
  })

  it('returns false for duplicate with whitespace', () => {
    const duplicateCategory: Category = {
      id: '3',
      name: '  Продукты  ',
      emoji: '🛒',
    }

    const result = wrap(addCategoryIfUnique)(duplicateCategory)

    expect(result).toBe(false)
    expect(categoriesAtom()).toHaveLength(2)
  })
})
