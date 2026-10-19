import { createMatcher } from '../model/fuzzy-matcher'

import type { KeywordMapping } from '@/shared/types'

function rule(
  id: string,
  keyword: string,
  categoryName: string,
  matchType: KeywordMapping['matchType'] = 'fuzzy'
): KeywordMapping {
  return {
    id,
    keyword,
    matchType,
    categoryId: `c-${categoryName}`,
    categoryName,
    categoryEmoji: '🏷️',
  }
}

const mappings: KeywordMapping[] = [
  rule('m1', 'молоко', 'Продукты'),
  rule('m2', 'такси', 'Транспорт'),
]

describe('createMatcher', () => {
  it('matches exact keyword', () => {
    const match = createMatcher(mappings)('молоко')
    expect(match).toEqual(
      expect.objectContaining({ found: true, categoryName: 'Продукты' })
    )
  })

  it('matches fuzzy typo', () => {
    const match = createMatcher(mappings)('малако')
    expect(match).toEqual(
      expect.objectContaining({ found: true, categoryName: 'Продукты' })
    )
  })

  it('matches inside multi-word description', () => {
    const match = createMatcher(mappings)('купил молоко в магазине')
    expect(match).toEqual(
      expect.objectContaining({ found: true, categoryName: 'Продукты' })
    )
  })

  it('matches an inflected word', () => {
    const match = createMatcher([rule('m1', 'продукты', 'Еда')])(
      'много продуктов'
    )
    expect(match).toEqual(
      expect.objectContaining({ found: true, categoryName: 'Еда' })
    )
  })

  it('returns no match for unknown description', () => {
    expect(createMatcher(mappings)('пылесос')).toEqual({ found: false })
  })

  it('returns no match for empty description', () => {
    expect(createMatcher(mappings)('   ')).toEqual({ found: false })
  })

  it('does not match a keyword inside an unrelated longer word', () => {
    const matcher = createMatcher([rule('m1', 'ресторан', 'Еда')])
    expect(matcher('тест')).toEqual({ found: false })
    expect(matcher('ТЕСТ покупка')).toEqual({ found: false })

    const reverse = createMatcher([rule('m2', 'тест', 'Тесты')])
    expect(reverse('ресторан')).toEqual({ found: false })
  })

  it('prefers a whole-word match later in the text over a typo match earlier', () => {
    const matcher = createMatcher([
      rule('m1', 'ресторан', 'Еда'),
      rule('m2', 'такси', 'Транспорт'),
    ])
    const match = matcher('ресторн такси')
    expect(match).toEqual(
      expect.objectContaining({ found: true, categoryName: 'Транспорт' })
    )
  })

  describe('exact rules', () => {
    it('match the whole normalized phrase', () => {
      const matcher = createMatcher([
        rule('e1', 'кофе с собой', 'Кафе', 'exact'),
      ])
      expect(matcher('  Кофе   С собой ')).toEqual(
        expect.objectContaining({ found: true, categoryName: 'Кафе' })
      )
    })

    it('do not match other descriptions that share words', () => {
      const matcher = createMatcher([
        rule('e1', 'тест расход', 'Тесты', 'exact'),
      ])
      expect(matcher('тест')).toEqual({ found: false })
      expect(matcher('тест расход большой')).toEqual({ found: false })
      expect(matcher('расход')).toEqual({ found: false })
    })

    it('win over fuzzy rules', () => {
      const matcher = createMatcher([
        rule('m1', 'молоко', 'Продукты'),
        rule('e1', 'молоко для кофе', 'Кафе', 'exact'),
      ])
      expect(matcher('молоко для кофе')).toEqual(
        expect.objectContaining({ found: true, id: 'e1', categoryName: 'Кафе' })
      )
      expect(matcher('молоко')).toEqual(
        expect.objectContaining({ found: true, id: 'm1' })
      )
    })
  })
})
