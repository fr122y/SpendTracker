import '@testing-library/jest-dom'

// Polyfill Request/Response for @reatom/core v1000 web modules
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    url: string
    constructor(input: string) {
      this.url = input
    }
  } as unknown as typeof Request
}

if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {} as unknown as typeof Response
}

if (typeof globalThis.BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = class BroadcastChannel {
    name: string
    constructor(name: string) {
      this.name = name
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    onmessage = null
    onmessageerror = null
  } as unknown as typeof BroadcastChannel
}

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
