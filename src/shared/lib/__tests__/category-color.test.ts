import {
  CATEGORY_COLORS,
  getCategoryColor,
  getFallbackCategoryColor,
  isCategoryColor,
} from '../category-color'
import { countGraphemes, limitGraphemes } from '../grapheme'

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

describe('category colors', () => {
  it('has about ten distinct lowercase hex colors', () => {
    const values = CATEGORY_COLORS.map((color) => color.value)
    expect(values.length).toBeGreaterThanOrEqual(8)
    expect(new Set(values).size).toBe(values.length)
    for (const value of values) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('keeps white tile text readable on every color', () => {
    for (const { value } of CATEGORY_COLORS) {
      const contrast = 1.05 / (relativeLuminance(value) + 0.05)
      expect(contrast).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('accepts only palette colors', () => {
    expect(isCategoryColor(CATEGORY_COLORS[0].value)).toBe(true)
    expect(isCategoryColor('#123456')).toBe(false)
    expect(isCategoryColor('#BE185D')).toBe(false)
    expect(isCategoryColor(null)).toBe(false)
  })

  it('returns the stored color when it is valid', () => {
    expect(getCategoryColor('Продукты', '#be185d')).toBe('#be185d')
  })

  it('falls back to a stable palette color by name', () => {
    const fallback = getFallbackCategoryColor('Продукты')
    expect(isCategoryColor(fallback)).toBe(true)
    expect(getCategoryColor('Продукты', null)).toBe(fallback)
    expect(getCategoryColor('Продукты')).toBe(fallback)
    expect(getCategoryColor('Продукты', 'not-a-color')).toBe(fallback)
    expect(getFallbackCategoryColor(' продукты ')).toBe(fallback)
  })

  it('spreads different names over the palette', () => {
    const names = ['Продукты', 'Транспорт', 'Кафе', 'Дом', 'Здоровье', 'Другое']
    const colors = new Set(names.map(getFallbackCategoryColor))
    expect(colors.size).toBeGreaterThan(1)
  })
})

describe('graphemes', () => {
  it('counts a ZWJ emoji and a flag as one grapheme', () => {
    expect(countGraphemes('👨‍👩‍👧')).toBe(1)
    expect(countGraphemes('🇷🇺')).toBe(1)
    expect(countGraphemes('🛍️')).toBe(1)
    expect(countGraphemes('🛒🚕')).toBe(2)
  })

  it('limits by graphemes without cutting a sequence', () => {
    expect(limitGraphemes('👩‍💻🚕', 1)).toBe('👩‍💻')
    expect(limitGraphemes('', 1)).toBe('')
  })
})
