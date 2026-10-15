jest.mock('@/shared/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn((...args: unknown[]) => args),
  eq: jest.fn((...args: unknown[]) => args),
}))

jest.mock('@/shared/db', () => {
  const insertValues = jest.fn()
  return {
    __mocks: { insertValues },
    db: { insert: jest.fn(() => ({ values: insertValues })) },
    expenses: {},
    projects: {},
  }
})

import { auth } from '@/shared/auth'

import { addProject } from '../project-actions'

const dbModule = jest.requireMock('@/shared/db') as {
  __mocks: { insertValues: jest.Mock }
}

describe('addProject budget validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('stores a budget up to 100 000 000', async () => {
    await addProject({ name: 'Ремонт', budget: 100_000_000 })

    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', budget: 100_000_000 })
    )
  })

  it.each([0, -1, 100_000_000.01, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects budget %p before any write',
    async (budget) => {
      await expect(addProject({ name: 'Ремонт', budget })).rejects.toThrow(
        'Project budget must be a positive finite number'
      )
      expect(dbModule.__mocks.insertValues).not.toHaveBeenCalled()
    }
  )
})
