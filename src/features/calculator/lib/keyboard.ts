import {
  applyEquals,
  deleteBackward,
  EMPTY_STATE,
  moveCaret,
  pressKey,
  type Amounts,
  type CalculatorState,
} from './expression'

/** One calculator action, shared by on-screen buttons and physical keys. */
export type CalculatorCommand =
  | { type: 'char'; value: string }
  | { type: 'equals' }
  | { type: 'backspace' }
  | { type: 'clear' }
  | { type: 'left' }
  | { type: 'right' }

export function applyCommand(
  state: CalculatorState,
  command: CalculatorCommand,
  amounts: Amounts
): CalculatorState {
  switch (command.type) {
    case 'char':
      return pressKey(state, command.value)
    case 'equals':
      return applyEquals(state, amounts)
    case 'backspace':
      return deleteBackward(state)
    case 'clear':
      return EMPTY_STATE
    case 'left':
      return moveCaret(state, -1)
    case 'right':
      return moveCaret(state, 1)
  }
}

const CHAR_KEYS = new Set('0123456789+-*/()')

/** Maps `KeyboardEvent.key`/`code` (main row and numeric keypad) to a command. */
export function keyToCommand(event: {
  key: string
  code?: string
}): CalculatorCommand | null {
  const { key, code } = event
  if (
    code === 'NumpadDecimal' ||
    key === ',' ||
    key === '.' ||
    key === 'Decimal'
  ) {
    return { type: 'char', value: '.' }
  }
  if (key.length === 1 && CHAR_KEYS.has(key))
    return { type: 'char', value: key }

  switch (key) {
    case 'Enter':
    case '=':
      return { type: 'equals' }
    case 'Backspace':
      return { type: 'backspace' }
    case 'Delete':
      return { type: 'clear' }
    case 'ArrowLeft':
      return { type: 'left' }
    case 'ArrowRight':
      return { type: 'right' }
    default:
      return null
  }
}

const EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

/**
 * Whether the calculator should take a key event: not with Ctrl/Meta/Alt or
 * during composition, not from an editable field outside the calculator, and
 * not Enter on a focused calculator button (the browser activates it).
 */
export function shouldHandleKey(
  event: {
    key: string
    ctrlKey: boolean
    metaKey: boolean
    altKey: boolean
    isComposing: boolean
    target: EventTarget | null
  },
  container: Element | null
): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
    return false
  }

  const target = event.target instanceof Element ? event.target : null
  const inside = !!target && !!container && container.contains(target)

  if (target && !inside && target.closest(EDITABLE_SELECTOR)) return false
  if (event.key === 'Enter' && inside && target?.closest('button')) return false

  return true
}
