import { createMatcher } from '../model/fuzzy-matcher'

import type { KeywordMapping } from '@/shared/types'

const mappings: KeywordMapping[] = [
  {
    id: 'm1',
    keyword: 'молоко',
    categoryId: 'c1',
    categoryName: 'Продукты',
    categoryEmoji: '🛒',
  },
  {
    id: 'm2',
    keyword: 'такси',
    categoryId: 'c2',
    categoryName: 'Транспорт',
    categoryEmoji: '🚕',
  },
]

describe('createMatcher', () => {
  it('matches exact keyword', () => {
    const match = createMatcher(mappings)('молоко')
    expect(match).toEqual(
      expect.objectContaining({
        found: true,
        categoryName: 'Продукты',
        categoryEmoji: '🛒',
      })
    )
  })

  it('matches fuzzy typo', () => {
    const match = createMatcher(mappings)('малако')
    expect(match).toEqual(
      expect.objectContaining({
        found: true,
        categoryName: 'Продукты',
      })
    )
  })

  it('matches inside multi-word description', () => {
    const match = createMatcher(mappings)('купил молоко в магазине')
    expect(match).toEqual(
      expect.objectContaining({
        found: true,
        categoryName: 'Продукты',
      })
    )
  })

  it('returns no match for unknown description', () => {
    const match = createMatcher(mappings)('пылесос')
    expect(match).toEqual({ found: false })
  })

  it('returns no match for empty description', () => {
    const match = createMatcher(mappings)('   ')
    expect(match).toEqual({ found: false })
  })
})
