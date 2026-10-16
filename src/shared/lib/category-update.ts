import { isCategoryColor } from './category-color'
import { countGraphemes } from './grapheme'

export interface CategoryUpdate {
  name?: string
  emoji?: string
  /** A palette color, or null to return to the fallback color by name. */
  color?: string | null
}

/**
 * Validates a partial category edit; shared by personal and shared-budget
 * categories. Fields left undefined are not changed.
 */
export function normalizeCategoryUpdate(data: CategoryUpdate): CategoryUpdate {
  const next: CategoryUpdate = {}

  if (data.name !== undefined) {
    const name = data.name.trim()
    if (!name) {
      throw new Error('Category name is required')
    }
    next.name = name
  }

  if (data.emoji !== undefined) {
    const emoji = data.emoji.trim()
    if (countGraphemes(emoji) !== 1) {
      throw new Error('Category emoji must be one character')
    }
    next.emoji = emoji
  }

  if (data.color !== undefined) {
    if (data.color !== null && !isCategoryColor(data.color)) {
      throw new Error('Category color must be a palette color')
    }
    next.color = data.color
  }

  return next
}
