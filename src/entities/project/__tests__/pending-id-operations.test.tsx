import { showMutationRollbackToast } from '@/shared/lib/mutation-toast'
import {
  expectDroppedWhenCreateFails,
  expectWaitsForStoredId,
  type PendingOperationCase,
} from '@/test/pending-operations'

import { useDeleteProject } from '../model/queries'

const mockApi = {
  addProject: jest.fn(async () => ({ id: 'p' })),
  deleteProject: jest.fn(async () => undefined),
  getProjects: jest.fn(async () => []),
}

jest.mock('@/shared/api', () => {
  const names = ['addProject', 'deleteProject', 'getProjects'] as const
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
    hook: useDeleteProject,
    run: (m, id) => m.mutate(id as never),
    action: mockApi.deleteProject,
    expectedArgs: (id) => [id],
  },
]

describe('project operations on a project that is still being saved', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each(cases)('$name waits for the stored id', expectWaitsForStoredId)

  it.each(cases)('$name is dropped silently when the create fails', (c) =>
    expectDroppedWhenCreateFails(c, toast)
  )
})
