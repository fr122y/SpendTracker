import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock crypto.randomUUID
Object.defineProperty(globalThis.crypto, 'randomUUID', {
  value: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9),
})

// Reset mocks between tests
beforeEach(() => {
  localStorageMock.clear()
})
