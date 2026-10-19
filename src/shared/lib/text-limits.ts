/**
 * Length limits for user-entered text that the dashboard renders in narrow
 * rows and tiles. Lengths are JavaScript string lengths (UTF-16 code units),
 * the same unit the HTML `maxLength` attribute counts, so the field and the
 * server agree. The database has no matching constraint: rows saved before
 * the limit keep their text and are truncated only on screen.
 */
export const EXPENSE_DESCRIPTION_MAX_LENGTH = 200
export const CATEGORY_NAME_MAX_LENGTH = 40

export const EXPENSE_DESCRIPTION_TOO_LONG_MESSAGE = `Комментарий не длиннее ${EXPENSE_DESCRIPTION_MAX_LENGTH} символов`
export const CATEGORY_NAME_TOO_LONG_MESSAGE = `Название категории не длиннее ${CATEGORY_NAME_MAX_LENGTH} символов`

export function isExpenseDescriptionTooLong(description: string): boolean {
  return description.trim().length > EXPENSE_DESCRIPTION_MAX_LENGTH
}

export function isCategoryNameTooLong(name: string): boolean {
  return name.trim().length > CATEGORY_NAME_MAX_LENGTH
}

/**
 * Throws when a new or changed description exceeds the limit. `previous` is
 * the stored text of an edited row: an unchanged legacy description longer
 * than the limit is accepted, so editing other fields still works.
 */
export function assertExpenseDescriptionLength(
  description: string,
  previous?: string
): void {
  if (previous !== undefined && description.trim() === previous.trim()) return
  if (isExpenseDescriptionTooLong(description)) {
    throw new Error(EXPENSE_DESCRIPTION_TOO_LONG_MESSAGE)
  }
}

/** The same rule as {@link assertExpenseDescriptionLength} for categories. */
export function assertCategoryNameLength(
  name: string,
  previous?: string
): void {
  if (previous !== undefined && name.trim() === previous.trim()) return
  if (isCategoryNameTooLong(name)) {
    throw new Error(CATEGORY_NAME_TOO_LONG_MESSAGE)
  }
}

/**
 * Field-level message: shown when the text is over the limit and differs from
 * the stored value, or when typing reached the limit.
 */
export function getTextLimitMessage(
  value: string,
  limit: number,
  tooLongMessage: string,
  previous?: string
): string | undefined {
  const changed = previous === undefined || value.trim() !== previous.trim()
  if (changed && value.trim().length > limit) return tooLongMessage
  if (value.length === limit) return `Достигнут лимит: ${limit} символов`
  return undefined
}
