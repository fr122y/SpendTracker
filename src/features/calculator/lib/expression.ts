import { evaluateMathExpression } from '@/shared/lib'

import { abbreviateLabel } from './abbreviate'
import { kopecksToPlainRubles, type SavingsValue } from './savings-values'

/** One character of the expression: digit, `.`, `+ - * /`, or a parenthesis. */
export interface CharToken {
  kind: 'char'
  value: string
}

/** An indivisible savings value, evaluated by its current amount. */
export interface SavingsToken {
  kind: 'savings'
  id: string
  label: string
  lastKopecks: number
}

export type Token = CharToken | SavingsToken

/** `caret` is an index between tokens: 0 … tokens.length. */
export interface CalculatorState {
  tokens: Token[]
  caret: number
}

/** Current amounts by savings id; `null` while they are unknown. */
export type Amounts = ReadonlyMap<string, number> | null

export const EMPTY_STATE: CalculatorState = { tokens: [], caret: 0 }

const CHARS = new Set('0123456789.+-*/()')
const OPERATORS = new Set('+-*/')
const MAX_TOKENS = 500

const isDigit = (token: Token | undefined): boolean =>
  token?.kind === 'char' && /[\d.]/.test(token.value)
const isOperator = (token: Token | undefined): boolean =>
  token?.kind === 'char' && OPERATORS.has(token.value)
const isChar = (token: Token | undefined, value: string): boolean =>
  token?.kind === 'char' && token.value === value
const isOperand = (token: Token | undefined): boolean =>
  isDigit(token) || token?.kind === 'savings'

export function charsToTokens(text: string): Token[] {
  return [...text].map((value) => ({ kind: 'char', value }))
}

function insertAt(
  state: CalculatorState,
  inserted: Token[],
  caretOffset = inserted.length
): CalculatorState {
  if (state.tokens.length + inserted.length > MAX_TOKENS) return state
  const tokens = [
    ...state.tokens.slice(0, state.caret),
    ...inserted,
    ...state.tokens.slice(state.caret),
  ]
  return { tokens, caret: state.caret + caretOffset }
}

/** The digits and `.` of the number the caret is in. */
function numberAroundCaret(state: CalculatorState): Token[] {
  let start = state.caret
  let end = state.caret
  while (start > 0 && isDigit(state.tokens[start - 1])) start--
  while (end < state.tokens.length && isDigit(state.tokens[end])) end++
  return state.tokens.slice(start, end)
}

export function pressKey(state: CalculatorState, key: string): CalculatorState {
  if (!CHARS.has(key) || key.length !== 1) return state
  const prev = state.tokens[state.caret - 1]

  if (key === '.') {
    if (numberAroundCaret(state).some((token) => isChar(token, '.'))) {
      return state
    }
    return isDigit(prev)
      ? insertAt(state, charsToTokens('.'))
      : insertAt(state, charsToTokens('0.'))
  }

  if (OPERATORS.has(key)) {
    const atStart = prev === undefined || isChar(prev, '(')
    if (atStart)
      return key === '-' ? insertAt(state, charsToTokens('-')) : state

    if (isOperator(prev)) {
      const beforePrev = state.tokens[state.caret - 2]
      if (beforePrev === undefined || isChar(beforePrev, '(')) return state
      const tokens = [...state.tokens]
      tokens[state.caret - 1] = { kind: 'char', value: key }
      return { ...state, tokens }
    }
  }

  return insertAt(state, charsToTokens(key))
}

export function deleteBackward(state: CalculatorState): CalculatorState {
  if (state.caret === 0) return state
  return {
    tokens: [
      ...state.tokens.slice(0, state.caret - 1),
      ...state.tokens.slice(state.caret),
    ],
    caret: state.caret - 1,
  }
}

export function setCaret(
  state: CalculatorState,
  index: number
): CalculatorState {
  const caret = Math.min(Math.max(0, Math.trunc(index)), state.tokens.length)
  return caret === state.caret ? state : { ...state, caret }
}

export function moveCaret(
  state: CalculatorState,
  delta: number
): CalculatorState {
  return setCaret(state, state.caret + delta)
}

/**
 * Inserts a value at the caret. A `+` joins it to a number, value, or `)`
 * right before it, and to a number or value right after it.
 */
export function insertSavings(
  state: CalculatorState,
  value: SavingsValue
): CalculatorState {
  const prev = state.tokens[state.caret - 1]
  const next = state.tokens[state.caret]
  const plus: Token = { kind: 'char', value: '+' }
  const token: SavingsToken = {
    kind: 'savings',
    id: value.id,
    label: value.label,
    lastKopecks: value.kopecks,
  }

  const before = isOperand(prev) || isChar(prev, ')') ? [plus] : []
  const after = isOperand(next) ? [plus] : []
  return insertAt(state, [...before, token, ...after], before.length + 1)
}

/** Stores the current amounts as the fallback for later. */
export function refreshAmounts(
  state: CalculatorState,
  amounts: Amounts
): CalculatorState {
  if (!amounts) return state
  let changed = false
  const tokens = state.tokens.map((token) => {
    if (token.kind !== 'savings') return token
    const current = amounts.get(token.id)
    if (current === undefined || current === token.lastKopecks) return token
    changed = true
    return { ...token, lastKopecks: current }
  })
  return changed ? { ...state, tokens } : state
}

function amountOf(token: SavingsToken, amounts: Amounts): number {
  return amounts?.get(token.id) ?? token.lastKopecks
}

export function toEvaluable(tokens: Token[], amounts: Amounts): string {
  return tokens
    .map((token) => {
      if (token.kind === 'char') return token.value
      const rubles = kopecksToPlainRubles(amountOf(token, amounts))
      return rubles.startsWith('-') ? `(${rubles})` : rubles
    })
    .join('')
}

/** Rounds to kopecks; returns null for an incomplete or non-finite expression. */
export function evaluateExpression(expr: string): number | null {
  const value = evaluateMathExpression(expr)
  if (!Number.isFinite(value)) return null

  const scaled = value * 100
  const rounded =
    Math.sign(scaled) *
    Math.round(
      Math.abs(scaled) + Number.EPSILON * Math.max(1, Math.abs(scaled))
    )
  const result = rounded / 100

  return Object.is(result, -0) ? 0 : result
}

export function evaluateTokens(
  tokens: Token[],
  amounts: Amounts
): number | null {
  return evaluateExpression(toEvaluable(tokens, amounts))
}

export function applyEquals(
  state: CalculatorState,
  amounts: Amounts
): CalculatorState {
  const result = evaluateTokens(state.tokens, amounts)
  if (result === null) return state
  const tokens = charsToTokens(formatResultForCopy(result))
  return { tokens, caret: tokens.length }
}

const SYMBOLS: Record<string, string> = {
  '*': '×',
  '/': '÷',
  '-': '−',
  '.': ',',
}

/**
 * How a token reads in the expression line. A value whose category no
 * longer exists is shown as its last known number.
 */
export function displayToken(
  token: Token,
  amounts: Amounts
): { text: string; isValue: boolean; title?: string } {
  if (token.kind === 'char') {
    return { text: SYMBOLS[token.value] ?? token.value, isValue: false }
  }
  if (amounts && !amounts.has(token.id)) {
    return {
      text: kopecksToPlainRubles(token.lastKopecks).replace('.', ','),
      isValue: false,
      title: token.label,
    }
  }
  return {
    text: abbreviateLabel(token.label) || token.label,
    isValue: true,
    title: token.label,
  }
}

export function formatResultForCopy(value: number): string {
  return String(Number(value.toFixed(2)))
}

export function formatResultForDisplay(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
    .format(value)
    .replace(/[  ]/g, ' ')
    .replace('-', '−')
}

function sanitizeToken(value: unknown): Token | null {
  if (typeof value !== 'object' || value === null) return null
  const token = value as Record<string, unknown>

  if (token.kind === 'char') {
    return typeof token.value === 'string' &&
      token.value.length === 1 &&
      CHARS.has(token.value)
      ? { kind: 'char', value: token.value }
      : null
  }

  if (token.kind === 'savings') {
    return typeof token.id === 'string' &&
      typeof token.label === 'string' &&
      Number.isSafeInteger(token.lastKopecks)
      ? {
          kind: 'savings',
          id: token.id,
          label: token.label,
          lastKopecks: token.lastKopecks as number,
        }
      : null
  }

  return null
}

/** Validates persisted data; anything unexpected yields an empty expression. */
export function sanitizeCalculatorState(value: unknown): CalculatorState {
  if (typeof value !== 'object' || value === null) return EMPTY_STATE
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.tokens) || raw.tokens.length > MAX_TOKENS) {
    return EMPTY_STATE
  }

  const tokens: Token[] = []
  for (const item of raw.tokens) {
    const token = sanitizeToken(item)
    if (!token) return EMPTY_STATE
    tokens.push(token)
  }

  const caret =
    typeof raw.caret === 'number' && Number.isInteger(raw.caret)
      ? Math.min(Math.max(0, raw.caret), tokens.length)
      : tokens.length
  return { tokens, caret }
}
