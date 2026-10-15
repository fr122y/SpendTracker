import { evaluateMathExpression } from './math-eval'

/** Largest money amount a form or server action accepts, in rubles. */
export const MAX_MONEY_AMOUNT = 100_000_000

export const AMOUNT_FORMAT_ERROR = 'Введите сумму числом, напр. 1500 или 500+50'
export const AMOUNT_POSITIVE_ERROR = 'Сумма должна быть больше 0'
export const AMOUNT_NEGATIVE_ERROR = 'Сумма не может быть отрицательной'

const MONEY_DECIMAL_PLACES = 2
const ALLOWED_CHARACTERS = /^[\d\s.,+\-*/()]+$/

export interface MoneyAmountRules {
  /** Accept zero as a valid amount. Negative amounts are always rejected. */
  allowZero?: boolean
  /** Inclusive upper bound; defaults to {@link MAX_MONEY_AMOUNT}. */
  max?: number
}

export type ParsedAmountInput =
  | { ok: true; value: number; display: string }
  | { ok: false; reason: 'empty' | 'format' | 'range'; error: string }

function formatThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function getAmountMaxError(max: number = MAX_MONEY_AMOUNT): string {
  return `Не больше ${formatThousands(max)} ₽`
}

/** Rounds to kopecks and turns negative zero into zero. */
export function roundToKopecks(value: number): number {
  const multiplier = 10 ** MONEY_DECIMAL_PLACES
  const rounded =
    Math.round((value + Math.sign(value) * Number.EPSILON) * multiplier) /
    multiplier
  return Object.is(rounded, -0) ? 0 : rounded
}

/**
 * Parses what a user typed into an amount field.
 *
 * Whitespace (including NBSP) is a thousands separator, `,` or `.` is the
 * decimal separator, and `+ - * / ( )` expressions are evaluated. Letters,
 * exponents, and any leftover characters make the whole input invalid; there
 * is no partial parse. The result is rounded to kopecks.
 */
export function parseAmountInput(
  raw: string,
  { allowZero = false, max = MAX_MONEY_AMOUNT }: MoneyAmountRules = {}
): ParsedAmountInput {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return { ok: false, reason: 'empty', error: AMOUNT_FORMAT_ERROR }
  }
  if (!ALLOWED_CHARACTERS.test(trimmed)) {
    return { ok: false, reason: 'format', error: AMOUNT_FORMAT_ERROR }
  }

  const evaluated = evaluateMathExpression(trimmed)
  if (!Number.isFinite(evaluated)) {
    return { ok: false, reason: 'format', error: AMOUNT_FORMAT_ERROR }
  }

  const value = roundToKopecks(evaluated)
  if (value < 0 || (value === 0 && !allowZero)) {
    return {
      ok: false,
      reason: 'range',
      error: allowZero ? AMOUNT_NEGATIVE_ERROR : AMOUNT_POSITIVE_ERROR,
    }
  }
  if (value > max) {
    return { ok: false, reason: 'range', error: getAmountMaxError(max) }
  }

  return {
    ok: true,
    value,
    display: value.toFixed(MONEY_DECIMAL_PLACES).replace(/\.?0+$/, ''),
  }
}

/**
 * True for a finite number in `(0, MAX_MONEY_AMOUNT]`, or `[0, ...]` with
 * `allowZero`. Server actions use it to reject amounts the forms never send.
 */
export function isValidMoneyAmount(
  value: unknown,
  { allowZero = false, max = MAX_MONEY_AMOUNT }: MoneyAmountRules = {}
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    (allowZero ? value >= 0 : value > 0) &&
    value <= max
  )
}
