import { wrap } from '@reatom/core'
import { renderHook } from '@testing-library/react'

import {
  isCategoryNameDuplicate,
  categoriesAtom,
  addCategoryIfUnique,
  useCategoryStore,
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

describe('Hydration Safety', () => {
  it('should return empty array when atom is undefined during hydration', () => {
    // Simulate pre-hydration state where localStorage hasn't loaded yet
    // @ts-expect-error -- simulate pre-hydration undefined
    categoriesAtom.set(undefined)

    const { result } = renderHook(() => useCategoryStore())

    // Should return empty array, not undefined
    expect(result.current.categories).toBeDefined()
    expect(Array.isArray(result.current.categories)).toBe(true)
    expect(result.current.categories.length).toBe(0)
  })

  it('should not throw when calling reduce on categories during hydration', () => {
    // Simulate pre-hydration state
    // @ts-expect-error -- simulate pre-hydration undefined
    categoriesAtom.set(undefined)

    const { result } = renderHook(() => useCategoryStore())

    // This should not throw "Cannot read properties of undefined (reading 'reduce')"
    expect(() => {
      result.current.categories.reduce((acc, c) => acc + c.name, '')
    }).not.toThrow()

    // Result should be empty string for empty array
    const combined = result.current.categories.reduce(
      (acc, c) => acc + c.name,
      ''
    )
    expect(combined).toBe('')
  })

  it('should handle array methods safely when atom is undefined', () => {
    // @ts-expect-error -- simulate pre-hydration undefined
    categoriesAtom.set(undefined)

    const { result } = renderHook(() => useCategoryStore())

    // All array methods should work without throwing
    expect(() => result.current.categories.map((c) => c.id)).not.toThrow()
    expect(() =>
      result.current.categories.filter((c) => c.id === 'test')
    ).not.toThrow()
    expect(() =>
      result.current.categories.find((c) => c.id === 'test')
    ).not.toThrow()

    expect(result.current.categories.map((c) => c.id)).toEqual([])
    expect(result.current.categories.filter((c) => c.id === 'test')).toEqual([])
    expect(
      result.current.categories.find((c) => c.id === 'test')
    ).toBeUndefined()
  })
})
