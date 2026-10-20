import { showMutationRollbackToast } from '@/shared/lib/mutation-toast'
import {
  expectDroppedWhenCreateFails,
  expectWaitsForStoredId,
  type PendingOperationCase,
} from '@/test/pending-operations'

import {
  useArchiveSharedBudgetCategory,
  useDeleteCategory,
  useUpdateCategory,
  useUpdateSharedBudgetCategory,
} from '../model/queries'

const mockApi = {
  addCategory: jest.fn(async () => ({ id: 'c', name: 'n', emoji: 'e' })),
  updateCategory: jest.fn(async () => null),
  deleteCategoryWithReassign: jest.fn(async () => ({ moved: 0 })),
  countCategoryExpenses: jest.fn(async () => 0),
  getCategories: jest.fn(async () => []),
  getSharedBudgetCategories: jest.fn(async () => []),
  addSharedBudgetCategory: jest.fn(async () => ({ id: 'sc' })),
  updateSharedBudgetCategory: jest.fn(async () => undefined),
  archiveSharedBudgetCategory: jest.fn(async () => undefined),
}

jest.mock('@/shared/api', () => {
  const names = [
    'addCategory',
    'updateCategory',
    'deleteCategoryWithReassign',
    'countCategoryExpenses',
    'getCategories',
    'getSharedBudgetCategories',
    'addSharedBudgetCategory',
    'updateSharedBudgetCategory',
    'archiveSharedBudgetCategory',
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

const useBudget1UpdateSharedBudgetCategory = () =>
  useUpdateSharedBudgetCategory('budget-1')
const useBudget1ArchiveSharedBudgetCategory = () =>
  useArchiveSharedBudgetCategory('budget-1')

type AnyMutation = { mutate: (variables: never) => void }
const cases: PendingOperationCase<AnyMutation>[] = [
  {
    name: 'rename',
    hook: useUpdateCategory,
    run: (m, id) => m.mutate({ id, name: 'Кафе' } as never),
    action: mockApi.updateCategory,
    expectedArgs: (id) => [id, { name: 'Кафе' }],
  },
  {
    name: 'color',
    hook: useUpdateCategory,
    run: (m, id) => m.mutate({ id, color: '#fff' } as never),
    action: mockApi.updateCategory,
    expectedArgs: (id) => [id, { color: '#fff' }],
  },
  {
    name: 'delete',
    hook: useDeleteCategory,
    run: (m, id) => m.mutate({ id, targetCategoryId: 'other' } as never),
    action: mockApi.deleteCategoryWithReassign,
    expectedArgs: (id) => [id, 'other'],
  },
  {
    name: 'delete into a new category',
    hook: useDeleteCategory,
    run: (m, id) => m.mutate({ id: 'old', targetCategoryId: id } as never),
    action: mockApi.deleteCategoryWithReassign,
    expectedArgs: (id) => ['old', id],
  },
  {
    name: 'shared rename',
    hook: useBudget1UpdateSharedBudgetCategory,
    run: (m, id) => m.mutate({ id, name: 'Кафе', emoji: '☕' } as never),
    action: mockApi.updateSharedBudgetCategory,
    expectedArgs: (id) => [id, { name: 'Кафе', emoji: '☕', color: undefined }],
  },
  {
    name: 'shared archive',
    hook: useBudget1ArchiveSharedBudgetCategory,
    run: (m, id) => m.mutate(id as never),
    action: mockApi.archiveSharedBudgetCategory,
    expectedArgs: (id) => [id],
  },
]

describe('category operations on a category that is still being saved', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each(cases)('$name waits for the stored id', expectWaitsForStoredId)

  it.each(cases)('$name is dropped silently when the create fails', (c) =>
    expectDroppedWhenCreateFails(c, toast)
  )
})
