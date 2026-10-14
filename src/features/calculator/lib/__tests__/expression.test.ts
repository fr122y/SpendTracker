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
    const state = insertSavings(type(['(']), cushion)
    expect(text(deleteBackward(state).tokens)).toBe('(')
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
    expect(toEvaluable(state.tokens, new Map())).toBe('(16000)')
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

describe('digits next to a savings value (Preview regression)', () => {
  const flat = { id: 'bucket:kv', label: 'Квартира', kopecks: 3000000 }
  const flatAmounts = new Map([['bucket:kv', 3000000]])

  it('inserts plus before a digit typed right after a value', () => {
    const state = pressKey(insertSavings(type(['5', '+']), flat), '7')
    expect(text(state.tokens)).toBe('5+[bucket:kv]+7')
    expect(evaluateTokens(state.tokens, flatAmounts)).toBe(30012)
  })

  it('inserts plus after a digit typed right before a value', () => {
    const state = setCaret(insertSavings(EMPTY_STATE, flat), 0)
    const typed = pressKey(pressKey(state, '7'), '5')
    expect(text(typed.tokens)).toBe('75+[bucket:kv]')
    expect(typed.caret).toBe(2)
    expect(evaluateTokens(typed.tokens, flatAmounts)).toBe(30075)
  })

  it('never merges a value with a digit when a parenthesis follows', () => {
    const state = setCaret(pressKey(insertSavings(EMPTY_STATE, flat), '('), 1)
    const typed = pressKey(state, '7')
    expect(text(typed.tokens)).toBe('[bucket:kv]+7(')
    expect(evaluateTokens(typed.tokens, flatAmounts)).toBeNull()
  })

  it('starts a decimal number after a value with plus and zero', () => {
    const state = pressKey(insertSavings(EMPTY_STATE, flat), '.')
    expect(text(state.tokens)).toBe('[bucket:kv]+0.')
  })

  it('serialises values in parentheses so adjacent digits stay invalid', () => {
    const tokens: Token[] = [
      { kind: 'char', value: '7' },
      {
        kind: 'savings',
        id: 'bucket:kv',
        label: 'Квартира',
        lastKopecks: 3000000,
      },
      { kind: 'char', value: '7' },
    ]
    expect(toEvaluable(tokens, flatAmounts)).toBe('7(30000)7')
    expect(evaluateTokens(tokens, flatAmounts)).toBeNull()
  })
})

describe('after equals', () => {
  const thirtySix = () => applyEquals(type(['6', '*', '6']), null)

  it('starts a new expression with a digit, decimal separator, or (', () => {
    expect(
      text(type(['(', '2', '+', '3', ')', '/', '4'], thirtySix()).tokens)
    ).toBe('(2+3)/4')
    expect(text(pressKey(thirtySix(), '7').tokens)).toBe('7')
    expect(text(pressKey(thirtySix(), '.').tokens)).toBe('0.')
  })

  it('starts a new expression with a savings value', () => {
    expect(text(insertSavings(thirtySix(), cushion).tokens)).toBe('[bucket:a]')
  })

  it('continues from the result with an operator', () => {
    const state = type(['+', '5'], thirtySix())
    expect(text(state.tokens)).toBe('36+5')
    expect(evaluateTokens(state.tokens, null)).toBe(41)
  })

  it('edits the result as a number after backspace or caret moves', () => {
    expect(text(pressKey(deleteBackward(thirtySix()), '1').tokens)).toBe('31')
    expect(text(pressKey(moveCaret(thirtySix(), -1), '1').tokens)).toBe('316')
    expect(text(pressKey(setCaret(thirtySix(), 2), '1').tokens)).toBe('361')
  })
})

describe('deleting a savings value', () => {
  const flat = { id: 'bucket:kv', label: 'Квартира', kopecks: 3000000 }

  it('removes the right operator when two would meet', () => {
    const state = pressKey(insertSavings(type(['5', '+']), flat), '7')
    const next = deleteBackward(setCaret(state, 3))
    expect(text(next.tokens)).toBe('5+7')
    expect(next.caret).toBe(2)
  })

  it('removes a leading binary operator left at the start', () => {
    const state = pressKey(insertSavings(EMPTY_STATE, flat), '7')
    const next = deleteBackward(setCaret(state, 1))
    expect(text(next.tokens)).toBe('7')
    expect(next.caret).toBe(0)
  })

  it('keeps a leading minus', () => {
    const state = type(
      ['-', '7'],
      setCaret(insertSavings(EMPTY_STATE, flat), 1)
    )
    expect(text(deleteBackward(setCaret(state, 1)).tokens)).toBe('-7')
  })

  it('removes a trailing operator left at the end or before )', () => {
    expect(
      text(deleteBackward(insertSavings(type(['5', '+']), flat)).tokens)
    ).toBe('5')
    const bracketed = setCaret(
      pressKey(insertSavings(type(['(', '5', '+']), flat), ')'),
      4
    )
    const next = deleteBackward(bracketed)
    expect(text(next.tokens)).toBe('(5)')
    expect(next.caret).toBe(2)
  })

  it('leaves empty parentheses and an empty expression as they are', () => {
    const bracketed = setCaret(
      pressKey(insertSavings(type(['(']), flat), ')'),
      2
    )
    expect(text(deleteBackward(bracketed).tokens)).toBe('()')
    expect(deleteBackward(insertSavings(EMPTY_STATE, flat)).tokens).toEqual([])
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
