import {
  appendKey,
  backspace,
  evaluateExpression,
  formatExpressionForDisplay,
  formatResultForCopy,
  formatResultForDisplay,
  insertValue,
} from '../expression'

function type(keys: string[], start = ''): string {
  return keys.reduce((expr, key) => appendKey(expr, key), start)
}

describe('appendKey', () => {
  it('builds an expression from digits and operators', () => {
    expect(type(['1', '2', '+', '3', '*', '(', '4', ')'])).toBe('12+3*(4)')
  })

  it('replaces a trailing operator with the next one', () => {
    expect(type(['5', '+', '*'])).toBe('5*')
  })

  it('ignores a leading binary operator but allows a leading minus', () => {
    expect(type(['*'])).toBe('')
    expect(type(['-', '3'])).toBe('-3')
  })

  it('prefixes a bare decimal separator with zero and allows one per number', () => {
    expect(type(['.', '5', '.', '1'])).toBe('0.51')
    expect(type(['1', '+', '.'])).toBe('1+0.')
  })
})

describe('backspace', () => {
  it('removes the last character', () => {
    expect(backspace('12+3')).toBe('12+')
    expect(backspace('')).toBe('')
  })
})

describe('insertValue', () => {
  it('appends a value after an operator or to an empty expression', () => {
    expect(insertValue('', '16000')).toBe('16000')
    expect(insertValue('100+', '16000')).toBe('100+16000')
  })

  it('replaces a trailing number', () => {
    expect(insertValue('100+25', '16000')).toBe('100+16000')
  })

  it('multiplies after a closing parenthesis', () => {
    expect(insertValue('(2+3)', '10')).toBe('(2+3)*10')
  })

  it('wraps a negative value in parentheses', () => {
    expect(insertValue('100+', '-5000')).toBe('100+(-5000)')
  })
})

describe('evaluateExpression', () => {
  it('evaluates with operator precedence and rounds to kopecks', () => {
    expect(evaluateExpression('1000+250.5*2')).toBe(1501)
    expect(evaluateExpression('10/3')).toBe(3.33)
    expect(evaluateExpression('0.1+0.2')).toBe(0.3)
    expect(evaluateExpression('1.005*1')).toBe(1.01)
  })

  it('returns null for incomplete, empty, or non-finite expressions', () => {
    expect(evaluateExpression('')).toBeNull()
    expect(evaluateExpression('5+')).toBeNull()
    expect(evaluateExpression('(5')).toBeNull()
    expect(evaluateExpression('5/0')).toBeNull()
  })
})

describe('formatting', () => {
  it('shows calculator symbols and a decimal comma in the expression', () => {
    expect(formatExpressionForDisplay('-1.5*2/3-(4)')).toBe(
      '−1,5 × 2 ÷ 3 − (4)'
    )
  })

  it('formats the result for display with grouping', () => {
    expect(formatResultForDisplay(12345.67)).toBe('12 345,67')
    expect(formatResultForDisplay(-5000)).toBe('−5 000')
  })

  it('copies a plain number without grouping or currency', () => {
    expect(formatResultForCopy(12345.67)).toBe('12345.67')
    expect(formatResultForCopy(12345.5)).toBe('12345.5')
    expect(formatResultForCopy(1501)).toBe('1501')
    expect(formatResultForCopy(-5000)).toBe('-5000')
    expect(formatResultForCopy(0.1 + 0.2)).toBe('0.3')
  })
})
