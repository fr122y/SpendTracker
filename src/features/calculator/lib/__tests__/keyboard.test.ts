import { charsToTokens, EMPTY_STATE, insertSavings } from '../expression'
import { applyCommand, keyToCommand, shouldHandleKey } from '../keyboard'

const key = (k: string, code = '') => keyToCommand({ key: k, code })

describe('keyToCommand', () => {
  it('maps digits from the main row and the numeric keypad', () => {
    expect(key('7', 'Digit7')).toEqual({ type: 'char', value: '7' })
    expect(key('0', 'Numpad0')).toEqual({ type: 'char', value: '0' })
  })

  it('maps operators including the keypad', () => {
    expect(key('+', 'NumpadAdd')).toEqual({ type: 'char', value: '+' })
    expect(key('-', 'Minus')).toEqual({ type: 'char', value: '-' })
    expect(key('*', 'NumpadMultiply')).toEqual({ type: 'char', value: '*' })
    expect(key('/', 'Slash')).toEqual({ type: 'char', value: '/' })
  })

  it('maps comma, dot, and the keypad decimal key to the decimal separator', () => {
    expect(key(',', 'Comma')).toEqual({ type: 'char', value: '.' })
    expect(key('.', 'Period')).toEqual({ type: 'char', value: '.' })
    expect(key('Decimal', 'NumpadDecimal')).toEqual({
      type: 'char',
      value: '.',
    })
  })

  it('maps parentheses, result, editing, and caret keys', () => {
    expect(key('(')).toEqual({ type: 'char', value: '(' })
    expect(key(')')).toEqual({ type: 'char', value: ')' })
    expect(key('Enter', 'NumpadEnter')).toEqual({ type: 'equals' })
    expect(key('=', 'Equal')).toEqual({ type: 'equals' })
    expect(key('Backspace')).toEqual({ type: 'backspace' })
    expect(key('Delete')).toEqual({ type: 'clear' })
    expect(key('ArrowLeft')).toEqual({ type: 'left' })
    expect(key('ArrowRight')).toEqual({ type: 'right' })
  })

  it('ignores other keys', () => {
    expect(key('a', 'KeyA')).toBeNull()
    expect(key(' ', 'Space')).toBeNull()
    expect(key('Escape')).toBeNull()
    expect(key('ArrowUp')).toBeNull()
  })
})

describe('applyCommand', () => {
  it('runs the same transitions as the on-screen buttons', () => {
    const cushion = { id: 'bucket:a', label: 'Подушка', kopecks: 1600000 }
    const state = insertSavings(EMPTY_STATE, cushion)
    const typed = applyCommand(state, { type: 'char', value: '7' }, null)
    expect(typed.tokens).toHaveLength(3)
    expect(applyCommand(typed, { type: 'left' }, null).caret).toBe(2)
    expect(
      applyCommand(typed, { type: 'backspace' }, null).tokens
    ).toHaveLength(2)
    expect(applyCommand(typed, { type: 'clear' }, null)).toEqual(EMPTY_STATE)
    expect(
      applyCommand(
        { tokens: charsToTokens('6*7'), caret: 3 },
        { type: 'equals' },
        null
      ).tokens
    ).toEqual(charsToTokens('42'))
  })
})

describe('shouldHandleKey', () => {
  const container = document.createElement('div')
  const insideButton = document.createElement('button')
  container.appendChild(insideButton)
  const outsideInput = document.createElement('input')
  const base = {
    key: '5',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    isComposing: false,
  }

  it('handles keys on the page body and inside the calculator', () => {
    expect(shouldHandleKey({ ...base, target: document.body }, container)).toBe(
      true
    )
    expect(shouldHandleKey({ ...base, target: insideButton }, container)).toBe(
      true
    )
  })

  it('leaves editable fields outside the calculator alone', () => {
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    for (const target of [
      outsideInput,
      document.createElement('textarea'),
      document.createElement('select'),
      editable,
    ]) {
      expect(shouldHandleKey({ ...base, target }, container)).toBe(false)
    }
  })

  it('ignores modifier shortcuts and text composition', () => {
    const target = document.body
    expect(shouldHandleKey({ ...base, target, ctrlKey: true }, container)).toBe(
      false
    )
    expect(shouldHandleKey({ ...base, target, metaKey: true }, container)).toBe(
      false
    )
    expect(shouldHandleKey({ ...base, target, altKey: true }, container)).toBe(
      false
    )
    expect(
      shouldHandleKey({ ...base, target, isComposing: true }, container)
    ).toBe(false)
  })

  it('lets a focused calculator button handle its own Enter', () => {
    expect(
      shouldHandleKey(
        { ...base, key: 'Enter', target: insideButton },
        container
      )
    ).toBe(false)
    expect(
      shouldHandleKey(
        { ...base, key: 'Enter', target: document.body },
        container
      )
    ).toBe(true)
  })
})
