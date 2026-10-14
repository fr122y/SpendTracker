import {
  applyEquals,
  charsToTokens,
  deleteBackward,
  displayToken,
  EMPTY_STATE,
  evaluateExpression,
  evaluateTokens,
  formatResultForCopy,
  formatResultForDisplay,
  insertSavings,
  moveCaret,
  pressKey,
  refreshAmounts,
  sanitizeCalculatorState,
  setCaret,
  toEvaluable,
  type CalculatorState,
  type Token,
} from '../expression'

function type(keys: string[], start: CalculatorState = EMPTY_STATE) {
  return keys.reduce((state, key) => pressKey(state, key), start)
}

function text(tokens: Token[]): string {
  return tokens
    .map((token) => (token.kind === 'char' ? token.value : `[${token.id}]`))
    .join('')
}

const cushion = { id: 'bucket:a', label: 'Подушка', kopecks: 1600000 }
const amounts = new Map([['bucket:a', 1600000]])

describe('pressKey', () => {
  it('builds an expression from digits and operators at the end', () => {
    const state = type(['1', '2', '+', '3', '*', '(', '4', ')'])
    expect(text(state.tokens)).toBe('12+3*(4)')
    expect(state.caret).toBe(8)
  })

  it('replaces a preceding operator and ignores a leading binary operator', () => {
    expect(text(type(['5', '+', '*']).tokens)).toBe('5*')
    expect(text(type(['*']).tokens)).toBe('')
    expect(text(type(['-', '3']).tokens)).toBe('-3')
  })

  it('prefixes a bare decimal separator with zero and allows one per number', () => {
    expect(text(type(['.', '5', '.', '1']).tokens)).toBe('0.51')
  })

  it('inserts at the caret', () => {
    const state = moveCaret(moveCaret(type(['1', '2', '+', '3']), -1), -1)
    expect(text(pressKey(state, '5').tokens)).toBe('125+3')
  })
})

describe('caret', () => {
  it('moves within bounds and can be set by index', () => {
    const state = type(['1', '2'])
    expect(moveCaret(state, 1).caret).toBe(2)
    expect(moveCaret(moveCaret(moveCaret(state, -1), -1), -1).caret).toBe(0)
    expect(setCaret(state, 1).caret).toBe(1)
    expect(setCaret(state, 99).caret).toBe(2)
  })

  it('jumps over a savings value as one element', () => {
    const state = insertSavings(EMPTY_STATE, cushion)
    expect(state.caret).toBe(1)
    expect(moveCaret(state, -1).caret).toBe(0)
  })
})

describe('deleteBackward', () => {
  it('deletes one character before the caret', () => {
    const state = setCaret(type(['1', '2', '+', '3']), 2)
    const next = deleteBackward(state)
    expect(text(next.tokens)).toBe('1+3')
    expect(next.caret).toBe(1)
    expect(deleteBackward(EMPTY_STATE)).toEqual(EMPTY_STATE)
  })

  it('deletes a savings value whole', () => {
    const state = insertSavings(type(['1', '+']), cushion)
    expect(text(deleteBackward(state).tokens)).toBe('1+')
  })
})

describe('insertSavings', () => {
  it('inserts plus after a number or another value', () => {
    const afterNumber = insertSavings(type(['1', '0', '0']), cushion)
    expect(text(afterNumber.tokens)).toBe('100+[bucket:a]')
    expect(text(insertSavings(afterNumber, cushion).tokens)).toBe(
      '100+[bucket:a]+[bucket:a]'
    )
  })

  it('inserts plus before a following number when placed in the middle', () => {
    const state = setCaret(type(['5']), 0)
    const next = insertSavings(state, cushion)
    expect(text(next.tokens)).toBe('[bucket:a]+5')
    expect(next.caret).toBe(1)
  })

  it('does not add plus after an operator or at the start', () => {
    expect(text(insertSavings(type(['2', '*']), cushion).tokens)).toBe(
      '2*[bucket:a]'
    )
  })
})

describe('evaluation', () => {
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

  it('uses the current amount of a savings value', () => {
    const state = insertSavings(type(['1', '0', '0']), cushion)
    expect(evaluateTokens(state.tokens, amounts)).toBe(16100)
    expect(evaluateTokens(state.tokens, new Map([['bucket:a', 2000000]]))).toBe(
      20100
    )
  })

  it('falls back to the last known amount when the value is missing', () => {
    const state = insertSavings(EMPTY_STATE, cushion)
    expect(toEvaluable(state.tokens, new Map())).toBe('16000')
    expect(displayToken(state.tokens[0], new Map())).toEqual({
      text: '16000',
      isValue: false,
      title: 'Подушка',
    })
    expect(displayToken(state.tokens[0], amounts).text).toBe('Под.')
  })

  it('wraps a negative amount in parentheses', () => {
    const state = insertSavings(type(['1', '+']), {
      id: 'operations',
      label: 'Операции (остаток)',
      kopecks: -500000,
    })
    expect(toEvaluable(state.tokens, null)).toBe('1+(-5000)')
  })

  it('refreshes the last known amount from current amounts', () => {
    const state = insertSavings(EMPTY_STATE, cushion)
    const refreshed = refreshAmounts(state, new Map([['bucket:a', 1700000]]))
    expect(refreshed.tokens[0]).toMatchObject({ lastKopecks: 1700000 })
    expect(refreshAmounts(state, amounts)).toBe(state)
    expect(refreshAmounts(state, null)).toBe(state)
  })

  it('replaces the expression with its result on equals', () => {
    const state = applyEquals(type(['1', '0', '/', '4']), amounts)
    expect(text(state.tokens)).toBe('2.5')
    expect(state.caret).toBe(3)
    const invalid = type(['5', '+'])
    expect(applyEquals(invalid, amounts)).toBe(invalid)
  })
})

describe('formatting', () => {
  it('shows calculator symbols and a decimal comma', () => {
    expect(
      charsToTokens('-1.5*2/3')
        .map((token) => displayToken(token, null).text)
        .join('')
    ).toBe('−1,5×2÷3')
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

describe('sanitizeCalculatorState', () => {
  it('accepts a valid state and clamps the caret', () => {
    const state = insertSavings(type(['1', '+']), cushion)
    expect(sanitizeCalculatorState(state)).toEqual(state)
    expect(sanitizeCalculatorState({ ...state, caret: 99 }).caret).toBe(3)
  })

  it('ignores corrupt or unknown data', () => {
    for (const value of [
      null,
      'x',
      42,
      { tokens: 'nope', caret: 0 },
      { tokens: [{ kind: 'char', value: 'x' }], caret: 0 },
      { tokens: [{ kind: 'savings', id: 1, label: 'A', lastKopecks: 1 }] },
      { tokens: [{ kind: 'savings', id: 'a', label: 'A', lastKopecks: 0.5 }] },
    ]) {
      expect(sanitizeCalculatorState(value)).toEqual(EMPTY_STATE)
    }
  })
})
