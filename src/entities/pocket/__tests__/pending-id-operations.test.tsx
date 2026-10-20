import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'

import { showMutationRollbackToast } from '@/shared/lib/mutation-toast'
import { isPendingId, resolveId } from '@/shared/lib/pending-ids'
import {
  expectDroppedWhenCreateFails,
  expectWaitsForStoredId,
  type PendingOperationCase,
} from '@/test/pending-operations'

import {
  useArchivePocket,
  useCreatePocket,
  usePocketMonthBudget,
  usePocketMonthBudgets,
  useRenamePocket,
  useRestorePocket,
  useSetPocketMonthBudget,
} from '../model/queries'

import type { ReactNode } from 'react'

const mockPocket = { id: 'stored-id', name: 'Отпуск', createdAt: '2026-10-01' }
const mockApi = {
  createPocket: jest.fn(),
  renamePocket: jest.fn(async () => ({
    status: 'renamed',
    pocket: mockPocket,
  })),
  archivePocket: jest.fn(async () => undefined),
  restorePocket: jest.fn(async () => ({
    status: 'restored',
    pocket: mockPocket,
  })),
  setPocketMonthBudget: jest.fn(async () => null),
  getPocketMonthBudgets: jest.fn(async () => []),
  initializePocketMonthBudget: jest.fn(async () => null),
  getPockets: jest.fn(async () => []),
}

jest.mock('@/shared/api', () => {
  const names = [
    'createPocket',
    'renamePocket',
    'archivePocket',
    'restorePocket',
    'setPocketMonthBudget',
    'getPocketMonthBudgets',
    'initializePocketMonthBudget',
    'getPockets',
  ] as const
  return {
    ...jest.requireActual('@/shared/api/query-keys'),
    ...Object.fromEntries(
      names.map((name) => [
        name,
        (...args: unknown[]) =>
          (mockApi[name] as (...a: unknown[]) => unknown)(...args),
      ])
    ),
  }
})
jest.mock('@/shared/lib/mutation-toast', () => ({
  showMutationRollbackToast: jest.fn(),
}))

const toast = showMutationRollbackToast as jest.Mock

type AnyMutation = { mutate: (variables: never) => void }
const cases: PendingOperationCase<AnyMutation>[] = [
  {
    name: 'rename',
    hook: useRenamePocket,
    run: (m, id) => m.mutate({ id, name: 'Море' } as never),
    action: mockApi.renamePocket,
    expectedArgs: (id) => [id, 'Море'],
  },
  {
    name: 'archive',
    hook: useArchivePocket,
    run: (m, id) => m.mutate({ id } as never),
    action: mockApi.archivePocket,
    expectedArgs: (id) => [id],
  },
  {
    name: 'restore',
    hook: useRestorePocket,
    run: (m, id) => m.mutate({ id } as never),
    action: mockApi.restorePocket,
    expectedArgs: (id) => [id],
  },
  {
    name: 'month budget',
    hook: useSetPocketMonthBudget,
    run: (m, id) =>
      m.mutate({ pocketId: id, period: '2026-10', budget: 100 } as never),
    action: mockApi.setPocketMonthBudget,
    expectedArgs: (id) => [id, '2026-10', 100],
  },
]

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('pocket operations on a pocket that is still being created', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each(cases)('$name waits for the stored id', expectWaitsForStoredId)

  it.each(cases)('$name is dropped silently when the create fails', (c) =>
    expectDroppedWhenCreateFails(c, toast)
  )

  it('does not read budgets of a temporary pocket', async () => {
    const queryClient = new QueryClient()
    renderHook(
      () => {
        usePocketMonthBudget('temp-1', '2026-10')
        usePocketMonthBudgets('temp-1')
      },
      { wrapper: wrapperFor(queryClient) }
    )
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)))
    expect(mockApi.initializePocketMonthBudget).not.toHaveBeenCalled()
    expect(mockApi.getPocketMonthBudgets).not.toHaveBeenCalled()
  })

  it('create swaps the temporary id and releases waiting operations', async () => {
    let finishCreate!: (value: unknown) => void
    mockApi.createPocket.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishCreate = resolve
        })
    )
    const queryClient = new QueryClient()
    queryClient.setQueryData(['pockets'], [])
    const { result } = renderHook(() => useCreatePocket(), {
      wrapper: wrapperFor(queryClient),
    })
    act(() => {
      result.current.mutate({ name: 'Отпуск' })
    })
    let tempId = ''
    await waitFor(() => {
      const rows = queryClient.getQueryData<{ id: string }[]>(['pockets'])
      tempId = rows?.[0]?.id ?? ''
      expect(tempId).toMatch(/^temp-/)
    })
    expect(isPendingId(tempId)).toBe(true)

    finishCreate({ status: 'created', pocket: mockPocket })

    await expect(resolveId(tempId)).resolves.toBe('stored-id')
    await waitFor(() =>
      expect(queryClient.getQueryData(['pockets'])).toEqual([
        expect.objectContaining({ id: 'stored-id', name: 'Отпуск' }),
      ])
    )
  })

  it('a failed create drops its waiting operations with one toast', async () => {
    let failCreate!: (error: Error) => void
    mockApi.createPocket.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          failCreate = reject
        })
    )
    const queryClient = new QueryClient()
    queryClient.setQueryData(['pockets'], [])
    const create = renderHook(() => useCreatePocket(), {
      wrapper: wrapperFor(queryClient),
    })
    const archive = renderHook(() => useArchivePocket(), {
      wrapper: wrapperFor(queryClient),
    })
    act(() => {
      create.result.current.mutate({ name: 'Отпуск' })
    })
    let tempId = ''
    await waitFor(() => {
      tempId =
        queryClient.getQueryData<{ id: string }[]>(['pockets'])?.[0]?.id ?? ''
      expect(tempId).toMatch(/^temp-/)
    })
    act(() => {
      archive.result.current.mutate({ id: tempId })
    })
    failCreate(new Error('network'))

    await waitFor(() => expect(archive.result.current.isError).toBe(true))
    expect(mockApi.archivePocket).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryData(['pockets'])).toEqual([])
  })
})
