export const PAYDAY_MIN = 1
export const PAYDAY_MAX = 31

/** True when `value` is a valid saved salary or advance day: an integer 1–31. */
export function isValidPaydayDay(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= PAYDAY_MIN &&
    value <= PAYDAY_MAX
  )
}

/**
 * Day of the month on which a saved salary or advance day falls:
 * `min(day, daysInMonth)`. Day 31 lands on the last day of a short month.
 * Weekends are not shifted. `month` is zero-based, as in `Date`.
 */
export function getPaydayInMonth(
  day: number,
  year: number,
  month: number
): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Math.min(day, daysInMonth)
}
