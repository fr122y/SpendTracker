import {
  QueryObserver,
  focusManager,
  onlineManager,
  type QueryClient,
} from '@tanstack/react-query'

import { STALE_TIME_MS, createQueryClient } from '../query-client'

jest.mock('@/shared/lib/session-expiry', () => ({
  handleRequestFailure: jest.fn(),
}))

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function observe(client: QueryClient, queryFn: jest.Mock) {
  const observer = new QueryObserver(client, { queryKey: ['items'], queryFn })
  const unsubscribe = observer.subscribe(() => undefined)
  return unsubscribe
}

function returnToTab() {
  focusManager.setFocused(false)
  focusManager.setFocused(true)
}

describe('createQueryClient', () => {
  let client: QueryClient

  beforeEach(() => {
    jest.useFakeTimers({
      doNotFake: ['setTimeout', 'nextTick', 'setImmediate'],
    })
    client = createQueryClient()
    client.mount()
  })

  afterEach(() => {
    client.unmount()
    client.clear()
    focusManager.setFocused(undefined)
    onlineManager.setOnline(true)
    jest.useRealTimers()
  })

  it('keeps data fresh for 30 seconds', () => {
    expect(STALE_TIME_MS).toBe(30_000)
    expect(client.getDefaultOptions().queries?.staleTime).toBe(30_000)
  })

  it('does not refetch on a quick return to the tab', async () => {
    const queryFn = jest.fn().mockResolvedValue(['a'])
    const unsubscribe = observe(client, queryFn)
    await flush()
    expect(queryFn).toHaveBeenCalledTimes(1)

    returnToTab()
    await flush()

    expect(queryFn).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('refetches stale data when the tab regains focus', async () => {
    const queryFn = jest.fn().mockResolvedValue(['a'])
    const unsubscribe = observe(client, queryFn)
    await flush()
    jest.setSystemTime(Date.now() + STALE_TIME_MS + 1)

    returnToTab()
    await flush()

    expect(queryFn).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('skips the focus refetch while a mutation is pending', async () => {
    const queryFn = jest.fn().mockResolvedValue(['a'])
    const unsubscribe = observe(client, queryFn)
    await flush()
    let finish!: () => void
    const mutation = client.getMutationCache().build(client, {
      mutationFn: () => new Promise<void>((resolve) => (finish = resolve)),
    })
    const running = mutation.execute(undefined)
    jest.setSystemTime(Date.now() + STALE_TIME_MS + 1)

    returnToTab()
    await flush()
    expect(queryFn).toHaveBeenCalledTimes(1)

    finish()
    await running
    returnToTab()
    await flush()
    expect(queryFn).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('refetches stale data on reconnect', async () => {
    const queryFn = jest.fn().mockResolvedValue(['a'])
    const unsubscribe = observe(client, queryFn)
    await flush()
    jest.setSystemTime(Date.now() + STALE_TIME_MS + 1)

    onlineManager.setOnline(false)
    onlineManager.setOnline(true)
    await flush()

    expect(queryFn).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('pauses a mutation offline after its optimistic update', async () => {
    onlineManager.setOnline(false)
    const onMutate = jest.fn()
    const mutationFn = jest.fn().mockResolvedValue('saved')
    const mutation = client
      .getMutationCache()
      .build(client, { mutationFn, onMutate })

    const running = mutation.execute(undefined)
    await flush()
    expect(onMutate).toHaveBeenCalled()
    expect(mutationFn).not.toHaveBeenCalled()
    expect(mutation.state.isPaused).toBe(true)
    expect(client.isMutating()).toBe(1)

    onlineManager.setOnline(true)
    await expect(running).resolves.toBe('saved')
    expect(client.isMutating()).toBe(0)
  })
})
