/**
 * Category colors. A category stores one of these colors or null; null shows
 * a stable palette color picked by the category name, so a category keeps its
 * color across renders and devices without a stored value.
 *
 * Every color keeps white tile text readable (contrast at least 4.5:1).
 */
export const CATEGORY_COLORS = [
  { value: '#047857', label: 'Изумрудный' },
  { value: '#0f766e', label: 'Бирюзовый' },
  { value: '#0369a1', label: 'Голубой' },
  { value: '#4338ca', label: 'Индиго' },
  { value: '#7e22ce', label: 'Фиолетовый' },
  { value: '#be185d', label: 'Розовый' },
  { value: '#b91c1c', label: 'Красный' },
  { value: '#c2410c', label: 'Оранжевый' },
  { value: '#a16207', label: 'Горчичный' },
  { value: '#4d7c0f', label: 'Оливковый' },
] as const

export type CategoryColor = (typeof CATEGORY_COLORS)[number]['value']

const CATEGORY_COLOR_FORMAT = /^#[0-9a-f]{6}$/

export function isCategoryColor(value: unknown): value is CategoryColor {
  return (
    typeof value === 'string' &&
    CATEGORY_COLOR_FORMAT.test(value) &&
    CATEGORY_COLORS.some((color) => color.value === value)
  )
}

/** FNV-1a over UTF-16 code units: stable across runtimes. */
function hashName(name: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function getFallbackCategoryColor(name: string): CategoryColor {
  const key = name.trim().toLowerCase()
  return CATEGORY_COLORS[hashName(key) % CATEGORY_COLORS.length].value
}

/** The color to display: the stored one, or the stable fallback by name. */
export function getCategoryColor(name: string, color?: string | null): string {
  return isCategoryColor(color) ? color : getFallbackCategoryColor(name)
}
