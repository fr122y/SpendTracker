import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'

import { trackPendingId } from '@/shared/lib/pending-ids'

import type { ReactNode } from 'react'

/**
 * Shared checks for mutations that target a record which may still be
 * saving: they must wait for its stored id, and drop silently when the
 * create fails.
 */
export interface PendingOperationCase<TMutation> {
  name: string
  hook: () => TMutation
  run: (mutation: TMutation, id: string) => void
  action: jest.Mock
  expectedArgs: (storedId: string) => unknown[]
  seed?: (queryClient: QueryClient, id: string) => void
}

function setup<TMutation>(testCase: PendingOperationCase<TMutation>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const tempId = `temp-${testCase.name.replace(/\W+/g, '-')}-${Math.random()}`
  testCase.seed?.(queryClient, tempId)
  const pending = trackPendingId(tempId)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const rendered = renderHook(testCase.hook, { wrapper })
  act(() => testCase.run(rendered.result.current, tempId))
  return { queryClient, tempId, pending, rendered }
}

export async function expectWaitsForStoredId<TMutation>(
  testCase: PendingOperationCase<TMutation>
) {
  const { pending } = setup(testCase)
  await act(() => new Promise((resolve) => setTimeout(resolve, 10)))
  expect(testCase.action).not.toHaveBeenCalled()

  pending.resolve('stored-id')

  await waitFor(() =>
    expect(testCase.action).toHaveBeenCalledWith(
      ...testCase.expectedArgs('stored-id')
    )
  )
}

export async function expectDroppedWhenCreateFails<TMutation>(
  testCase: PendingOperationCase<TMutation>,
  toast: jest.Mock
) {
  const { pending, rendered } = setup(testCase)
  pending.reject()

  await waitFor(() =>
    expect((rendered.result.current as { isError?: boolean }).isError).toBe(
      true
    )
  )
  expect(testCase.action).not.toHaveBeenCalled()
  expect(toast).not.toHaveBeenCalled()
}
