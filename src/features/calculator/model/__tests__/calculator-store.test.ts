import { wrap } from '@reatom/core'

import {
  EMPTY_STATE,
  insertSavings,
  pressKey,
  type CalculatorState,
} from '../../lib/expression'
import {
  createCalculatorAtom,
  readCalculatorState,
  updateCalculator,
} from '../calculator-store'

const KEY = 'smartspend-calculator-v1'

let reloads = 0

/** A fresh persisted atom reads storage the way a page reload does. */
function reload(): CalculatorState {
  reloads++
  const fresh = createCalculatorAtom(`calculatorAtomReload${reloads}`)
  return wrap(() => fresh())()
}

function record(data: unknown): string {
  return JSON.stringify({
    data,
    id: 1,
    timestamp: Date.now(),
    version: 0,
    to: Date.now() + 1_000_000,
  })
}

beforeEach(() => {
  localStorage.clear()
})

describe('calculator store persistence', () => {
  it('writes the state under a versioned key and restores it after reload', () => {
    const state = insertSavings(pressKey(pressKey(EMPTY_STATE, '1'), '+'), {
      id: 'bucket:a',
      label: 'Подушка',
      kopecks: 1600000,
    })

    updateCalculator(() => state)
    expect(readCalculatorState()).toEqual(state)
    expect(localStorage.getItem(KEY)).not.toBeNull()

    expect(reload()).toEqual(state)
  })

  it('ignores invalid saved data', () => {
    localStorage.setItem(
      KEY,
      record({ tokens: [{ kind: 'char', value: 'eval' }], caret: 0 })
    )
    expect(reload()).toEqual(EMPTY_STATE)
  })

  it('ignores unparsable saved data', () => {
    localStorage.setItem(KEY, '{not json')
    expect(reload()).toEqual(EMPTY_STATE)
  })
})
