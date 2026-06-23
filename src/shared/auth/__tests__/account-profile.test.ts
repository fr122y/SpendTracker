const mockEq = jest.fn((left: unknown, right: unknown) => {
  void left
  void right
  return 'eq'
})
const mockLimit = jest.fn()
const mockWhere = jest.fn(() => ({ limit: mockLimit }))
const mockLeftJoin = jest.fn(() => ({ where: mockWhere }))
const mockFrom = jest.fn(() => ({ leftJoin: mockLeftJoin }))
const mockSelect = jest.fn(() => ({ from: mockFrom }))

jest.mock('server-only', () => ({}), { virtual: true })

jest.mock('drizzle-orm', () => ({
  eq: (left: unknown, right: unknown) => mockEq(left, right),
}))

jest.mock('@/shared/db', () => ({
  db: {
    select: () => mockSelect(),
  },
  accounts: {
    provider: 'accounts.provider',
    userId: 'accounts.userId',
  },
  users: {
    id: 'users.id',
    name: 'users.name',
    email: 'users.email',
    password: 'users.password',
  },
}))

import { getAccountProfile } from '../account-profile'

describe('getAccountProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLimit.mockResolvedValue([])
  })

  it('returns credentials provider for users with password', async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: 'user-1',
        name: 'Ilya',
        email: 'ilya@example.com',
        password: 'hashed-password',
        provider: null,
      },
    ])

    await expect(getAccountProfile('user-1')).resolves.toEqual({
      id: 'user-1',
      name: 'Ilya',
      email: 'ilya@example.com',
      provider: 'Credentials',
    })
  })

  it('returns Google provider for oauth users', async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: 'user-2',
        name: 'Google User',
        email: 'google@example.com',
        password: null,
        provider: 'google',
      },
    ])

    await expect(getAccountProfile('user-2')).resolves.toMatchObject({
      provider: 'Google',
    })
  })

  it('returns null when the user cannot be found', async () => {
    mockLimit.mockResolvedValueOnce([])

    await expect(getAccountProfile('missing-user')).resolves.toBeNull()
  })
})
