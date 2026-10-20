import { showMutationRollbackToast } from '@/shared/lib/mutation-toast'
import {
  expectDroppedWhenCreateFails,
  expectWaitsForStoredId,
  type PendingOperationCase,
} from '@/test/pending-operations'

import {
  useAddExpense,
  useDeleteExpense,
  useUpdateExpense,
} from '../model/queries'

const mockApi = {
  addExpense: jest.fn(async () => ({ id: 'expense-1' })),
  deleteExpense: jest.fn(async () => ({ status: 'deleted' })),
  updateExpense: jest.fn(async () => undefined),
  getExpenses: jest.fn(async () => []),
}

jest.mock('@/shared/api', () => {
  const names = [
    'addExpense',
    'deleteExpense',
    'updateExpense',
    'getExpenses',
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
    name: 'delete',
    hook: useDeleteExpense,
    run: (m, id) => m.mutate(id as never),
    action: mockApi.deleteExpense,
    expectedArgs: (id) => [id],
  },
  {
    name: 'edit',
    hook: useUpdateExpense,
    run: (m, id) => m.mutate({ id, data: { amount: 5 } } as never),
    action: mockApi.updateExpense,
    expectedArgs: (id) => [id, { amount: 5 }],
  },
  {
    name: 'pocket purchase',
    hook: useAddExpense,
    run: (m, id) =>
      m.mutate({
        id: 'expense-1',
        description: 'Билеты',
        amount: 5,
        date: '2026-10-20',
        category: 'Еда',
        emoji: '🍔',
        pocketId: id,
      } as never),
    action: mockApi.addExpense,
    expectedArgs: (id) => [expect.objectContaining({ pocketId: id })],
  },
  {
    name: 'project expense',
    hook: useAddExpense,
    run: (m, id) =>
      m.mutate({
        id: 'expense-2',
        description: 'Краска',
        amount: 5,
        date: '2026-10-20',
        category: 'Еда',
        emoji: '🍔',
        projectId: id,
      } as never),
    action: mockApi.addExpense,
    expectedArgs: (id) => [expect.objectContaining({ projectId: id })],
  },
]

describe('expense operations on a record that is still being saved', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each(cases)('$name waits for the stored id', expectWaitsForStoredId)

  it.each(cases)('$name is dropped silently when the create fails', (c) =>
    expectDroppedWhenCreateFails(c, toast)
  )
})
