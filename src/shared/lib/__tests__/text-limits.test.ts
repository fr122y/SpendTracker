import {
  getTextLimitMessage,
  isCategoryNameTooLong,
  isExpenseDescriptionTooLong,
} from '../text-limits'

describe('text limits', () => {
  it('allows 200-character descriptions and rejects 201', () => {
    expect(isExpenseDescriptionTooLong('а'.repeat(200))).toBe(false)
    expect(isExpenseDescriptionTooLong('а'.repeat(201))).toBe(true)
    expect(isExpenseDescriptionTooLong(` ${'а'.repeat(200)} `)).toBe(false)
  })

  it('allows 40-character category names and rejects 41', () => {
    expect(isCategoryNameTooLong('к'.repeat(40))).toBe(false)
    expect(isCategoryNameTooLong('к'.repeat(41))).toBe(true)
  })

  it('reports a reached limit and an over-limit change', () => {
    expect(getTextLimitMessage('abc', 40, 'long')).toBeUndefined()
    expect(getTextLimitMessage('к'.repeat(40), 40, 'long')).toBe(
      'Достигнут лимит: 40 символов'
    )
    expect(getTextLimitMessage('к'.repeat(41), 40, 'long')).toBe('long')
  })

  it('accepts an unchanged legacy value over the limit', () => {
    const legacy = 'л'.repeat(90)
    expect(getTextLimitMessage(legacy, 40, 'long', legacy)).toBeUndefined()
    expect(getTextLimitMessage(legacy.slice(1), 40, 'long', legacy)).toBe(
      'long'
    )
  })
})
