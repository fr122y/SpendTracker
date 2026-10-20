import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'

import {
  NetworkStatus,
  OFFLINE_MESSAGE,
  SAVING_DELAY_MS,
  SAVING_MESSAGE,
} from '../network-status'

function renderStatus(client = new QueryClient()) {
  render(
    <QueryClientProvider client={client}>
      <NetworkStatus />
    </QueryClientProvider>
  )
  return client
}

function startMutation(client: QueryClient) {
  let finish!: () => void
  const saved = new Promise<void>((resolve) => (finish = resolve))
  const mutation = client.getMutationCache().build(client, {
    mutationFn: () => saved,
  })
  let running!: Promise<unknown>
  act(() => {
    running = mutation.execute(undefined)
  })
  // TanStack Query notifies observers on the next tick.
  act(() => jest.advanceTimersByTime(0))
  return async () => {
    await act(async () => {
      finish()
      await running
      jest.advanceTimersByTime(0)
    })
  }
}

describe('NetworkStatus', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => {
    act(() => onlineManager.setOnline(true))
    jest.useRealTimers()
  })

  it('shows nothing online without pending saves', () => {
    renderStatus()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('shows the offline message at once', () => {
    renderStatus()
    act(() => onlineManager.setOnline(false))
    expect(screen.getByRole('status')).toHaveTextContent(OFFLINE_MESSAGE)
    expect(screen.queryByText(SAVING_MESSAGE)).toBeNull()

    act(() => onlineManager.setOnline(true))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('shows a paused offline save at once', () => {
    const client = renderStatus()
    act(() => onlineManager.setOnline(false))
    startMutation(client)
    expect(screen.getByText(SAVING_MESSAGE)).toBeInTheDocument()
  })

  it('shows a slow online save only after a delay', async () => {
    const client = renderStatus()
    const finish = startMutation(client)
    expect(screen.queryByText(SAVING_MESSAGE)).toBeNull()

    act(() => jest.advanceTimersByTime(SAVING_DELAY_MS))
    expect(screen.getByText(SAVING_MESSAGE)).toBeInTheDocument()

    await finish()
    expect(screen.queryByRole('status')).toBeNull()
  })
})
