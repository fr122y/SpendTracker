import { evaluateMathExpression } from '@/shared/lib'

/**
 * The expression is stored with ASCII operators (`+ - * /`) and `.` as the
 * decimal separator so `evaluateMathExpression` can parse it directly.
 */

const OPERATORS = new Set(['+', '-', '*', '/'])
const TRAILING_NUMBER = /\d*\.?\d*$/

function lastChar(expr: string): string {
  return expr.slice(-1)
}

function trailingNumber(expr: string): string {
  return TRAILING_NUMBER.exec(expr)?.[0] ?? ''
}

export function appendKey(expr: string, key: string): string {
  if (/^\d$/.test(key)) return expr + key

  if (key === '.') {
    const current = trailingNumber(expr)
    if (current.includes('.')) return expr
    return current === '' ? `${expr}0.` : `${expr}.`
  }

  if (OPERATORS.has(key)) {
    const last = lastChar(expr)
    if (expr === '' || last === '(') return key === '-' ? expr + key : expr
    if (OPERATORS.has(last)) {
      const head = expr.slice(0, -1)
      if (head === '' || lastChar(head) === '(') {
        return key === '-' ? expr : head
      }
      return head + key
    }
    return expr + key
  }

  if (key === '(' || key === ')') return expr + key

  return expr
}

export function backspace(expr: string): string {
  return expr.slice(0, -1)
}

export function insertValue(expr: string, value: string): string {
  const token = value.startsWith('-') ? `(${value})` : value
  const current = trailingNumber(expr)

  if (current !== '') return expr.slice(0, -current.length) + token
  if (lastChar(expr) === ')') return `${expr}*${token}`
  return expr + token
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

export function formatExpressionForDisplay(expr: string): string {
  return expr
    .replace(/(?<=[\d)])([+\-*/])/g, ' $1 ')
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−')
    .replace(/\./g, ',')
    .trim()
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
