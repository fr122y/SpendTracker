import { showMutationRollbackToast } from '@/shared/lib/mutation-toast'
import {
  expectDroppedWhenCreateFails,
  expectWaitsForStoredId,
  type PendingOperationCase,
} from '@/test/pending-operations'

import {
  useDeleteKeywordMapping,
  useDeleteSharedKeywordMapping,
  useSaveKeywordMapping,
  useSaveSharedKeywordMapping,
} from '../model/queries'

const mockApi = {
  saveKeywordMapping: jest.fn(async () => ({ id: 'k' })),
  deleteKeywordMapping: jest.fn(async () => undefined),
  saveSharedKeywordMapping: jest.fn(async () => ({ id: 'sk' })),
  deleteSharedKeywordMapping: jest.fn(async () => undefined),
  getKeywordMappings: jest.fn(async () => []),
  getSharedKeywordMappings: jest.fn(async () => []),
}

jest.mock('@/shared/api', () => {
  const names = [
    'saveKeywordMapping',
    'deleteKeywordMapping',
    'saveSharedKeywordMapping',
    'deleteSharedKeywordMapping',
    'getKeywordMappings',
    'getSharedKeywordMappings',
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

const useBudget1SaveSharedKeywordMapping = () =>
  useSaveSharedKeywordMapping('budget-1')
const useBudget1DeleteSharedKeywordMapping = () =>
  useDeleteSharedKeywordMapping('budget-1')

type AnyMutation = { mutate: (variables: never) => void }
const cases: PendingOperationCase<AnyMutation>[] = [
  {
    name: 'rule for a new category',
    hook: useSaveKeywordMapping,
    run: (m, id) => m.mutate({ keyword: 'кофе', categoryId: id } as never),
    action: mockApi.saveKeywordMapping,
    expectedArgs: (id) => ['кофе', id],
  },
  {
    name: 'delete rule',
    hook: useDeleteKeywordMapping,
    run: (m, id) => m.mutate(id as never),
    action: mockApi.deleteKeywordMapping,
    expectedArgs: (id) => [id],
  },
  {
    name: 'shared rule for a new category',
    hook: useBudget1SaveSharedKeywordMapping,
    run: (m, id) => m.mutate({ keyword: 'кофе', categoryId: id } as never),
    action: mockApi.saveSharedKeywordMapping,
    expectedArgs: (id) => ['budget-1', 'кофе', id],
  },
  {
    name: 'delete shared rule',
    hook: useBudget1DeleteSharedKeywordMapping,
    run: (m, id) => m.mutate(id as never),
    action: mockApi.deleteSharedKeywordMapping,
    expectedArgs: (id) => ['budget-1', id],
  },
]

describe('keyword rule operations on a record that is still being saved', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each(cases)('$name waits for the stored id', expectWaitsForStoredId)

  it.each(cases)('$name is dropped silently when the create fails', (c) =>
    expectDroppedWhenCreateFails(c, toast)
  )
})
