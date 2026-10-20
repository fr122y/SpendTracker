import { showMutationRollbackToast } from '@/shared/lib/mutation-toast'
import {
  expectDroppedWhenCreateFails,
  expectWaitsForStoredId,
  type PendingOperationCase,
} from '@/test/pending-operations'

import {
  useArchiveSharedBudget,
  useCreateSharedBudgetInvite,
  useSetActiveSharedBudget,
  useSetSharedWeeklyLimitForWeek,
} from '../model/queries'

const mockApi = {
  createSharedBudget: jest.fn(async () => ({ id: 'b' })),
  setActiveSharedBudget: jest.fn(async () => undefined),
  setSharedWeeklyLimitForWeek: jest.fn(async () => undefined),
  archiveSharedBudget: jest.fn(async () => undefined),
  createSharedBudgetInvite: jest.fn(async () => ({ status: 'created' })),
  getSharedBudgets: jest.fn(async () => []),
}

jest.mock('@/shared/api', () => {
  const names = [
    'createSharedBudget',
    'setActiveSharedBudget',
    'setSharedWeeklyLimitForWeek',
    'archiveSharedBudget',
    'createSharedBudgetInvite',
    'getSharedBudgets',
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
    name: 'select',
    hook: useSetActiveSharedBudget,
    run: (m, id) => m.mutate(id as never),
    action: mockApi.setActiveSharedBudget,
    expectedArgs: (id) => [id],
  },
  {
    name: 'weekly limit',
    hook: useSetSharedWeeklyLimitForWeek,
    run: (m, id) =>
      m.mutate({
        sharedBudgetId: id,
        effectiveWeekStart: '2026-10-19',
        amount: 100,
      } as never),
    action: mockApi.setSharedWeeklyLimitForWeek,
    expectedArgs: (id) => [id, '2026-10-19', 100],
  },
  {
    name: 'archive',
    hook: useArchiveSharedBudget,
    run: (m, id) => m.mutate(id as never),
    action: mockApi.archiveSharedBudget,
    expectedArgs: (id) => [id],
  },
  {
    name: 'invite',
    hook: useCreateSharedBudgetInvite,
    run: (m, id) => m.mutate(id as never),
    action: mockApi.createSharedBudgetInvite,
    expectedArgs: (id) => [id],
  },
]

describe('shared budget operations on a budget that is still being saved', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each(cases)('$name waits for the stored id', expectWaitsForStoredId)

  it.each(cases)('$name is dropped silently when the create fails', (c) =>
    expectDroppedWhenCreateFails(c, toast)
  )
})
