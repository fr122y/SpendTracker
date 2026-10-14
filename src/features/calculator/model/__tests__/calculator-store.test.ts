import { EMPTY_STATE, insertSavings, pressKey } from '../../lib/expression'

const KEY = 'smartspend-calculator-v1'

type StoreModule = typeof import('../calculator-store')

function loadStore(): StoreModule {
  let store: StoreModule | undefined
  jest.isolateModules(() => {
    store = jest.requireActual<StoreModule>('../calculator-store')
  })
  return store!
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
    const store = loadStore()
    const state = insertSavings(pressKey(pressKey(EMPTY_STATE, '1'), '+'), {
      id: 'bucket:a',
      label: 'Подушка',
      kopecks: 1600000,
    })

    store.updateCalculator(() => state)
    expect(store.readCalculatorState()).toEqual(state)
    expect(localStorage.getItem(KEY)).not.toBeNull()

    const reloaded = loadStore()
    expect(reloaded.readCalculatorState()).toEqual(state)
  })

  it('ignores invalid saved data', () => {
    localStorage.setItem(
      KEY,
      record({ tokens: [{ kind: 'char', value: 'eval' }], caret: 0 })
    )
    expect(loadStore().readCalculatorState()).toEqual(EMPTY_STATE)
  })

  it('ignores unparsable saved data', () => {
    localStorage.setItem(KEY, '{not json')
    expect(loadStore().readCalculatorState()).toEqual(EMPTY_STATE)
  })
})
