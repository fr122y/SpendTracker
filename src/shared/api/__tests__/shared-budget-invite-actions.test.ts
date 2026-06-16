jest.mock('@/shared/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn(() => ({})),
  eq: jest.fn(() => ({})),
  isNull: jest.fn(() => ({})),
}))

jest.mock('@/shared/db', () => {
  const mocks = {
    insertValues: jest.fn(),
    selectLimit: jest.fn(),
    txInsertValues: jest.fn(),
    txUpdateReturning: jest.fn(),
    txUpdateSet: jest.fn(),
    txUpdateWhere: jest.fn(),
  }

  const makeSelect = () => ({
    from: jest.fn(() => ({
      innerJoin: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: mocks.selectLimit,
        })),
      })),
      where: jest.fn(() => ({
        limit: mocks.selectLimit,
      })),
    })),
  })

  const db = {
    select: jest.fn(makeSelect),
    insert: jest.fn(() => ({
      values: mocks.insertValues,
    })),
    transaction: jest.fn(async (callback) =>
      callback({
        insert: jest.fn(() => ({
          values: mocks.txInsertValues,
        })),
        update: jest.fn(() => ({
          set: mocks.txUpdateSet,
        })),
      })
    ),
  }

  mocks.txUpdateWhere.mockReturnValue({
    returning: mocks.txUpdateReturning,
  })
  mocks.txUpdateSet.mockReturnValue({ where: mocks.txUpdateWhere })

  return {
    __mocks: mocks,
    db,
    sharedBudgetInvites: {
      id: 'invite.id',
      sharedBudgetId: 'invite.sharedBudgetId',
      createdByUserId: 'invite.createdByUserId',
      tokenHash: 'invite.tokenHash',
      expiresAt: 'invite.expiresAt',
      acceptedAt: 'invite.acceptedAt',
      acceptedByUserId: 'invite.acceptedByUserId',
    },
    sharedBudgetMembers: {
      sharedBudgetId: 'member.sharedBudgetId',
      userId: 'member.userId',
      role: 'member.role',
      isActive: 'member.isActive',
    },
    sharedBudgets: {
      id: 'sharedBudget.id',
      name: 'sharedBudget.name',
      archivedAt: 'sharedBudget.archivedAt',
    },
  }
})

import { auth } from '@/shared/auth'

import {
  acceptSharedBudgetInvite,
  createSharedBudgetInvite,
  getSharedBudgetInvitePreview,
} from '../shared-budget-invite-actions'

describe('shared-budget-invite-actions', () => {
  const originalEnv = process.env
  const dbModule = jest.requireMock('@/shared/db') as {
    __mocks: {
      insertValues: jest.Mock
      selectLimit: jest.Mock
      txInsertValues: jest.Mock
      txUpdateReturning: jest.Mock
      txUpdateSet: jest.Mock
      txUpdateWhere: jest.Mock
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    process.env = { ...originalEnv, APP_ORIGIN: 'https://app.example.com' }
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
    dbModule.__mocks.txUpdateReturning.mockResolvedValue([{ id: 'invite-1' }])
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('lets an owner create an invite URL and stores only a token hash', async () => {
    dbModule.__mocks.selectLimit.mockResolvedValueOnce([
      { role: 'owner', archivedAt: null },
    ])

    const result = await createSharedBudgetInvite('shared-1')
    const token = result.inviteUrl.split('/invite/')[1]

    expect(result.inviteUrl).toMatch(/^https:\/\/app\.example\.com\/invite\/.+/)
    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        sharedBudgetId: 'shared-1',
        createdByUserId: 'user-1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      })
    )
    expect(dbModule.__mocks.insertValues.mock.calls[0][0].tokenHash).not.toBe(
      token
    )
    expect(
      dbModule.__mocks.insertValues.mock.calls[0][0].tokenHash
    ).toHaveLength(64)
  })

  it('rejects invite generation for non-owners', async () => {
    dbModule.__mocks.selectLimit.mockResolvedValueOnce([
      { role: 'member', archivedAt: null },
    ])

    await expect(createSharedBudgetInvite('shared-1')).rejects.toThrow(
      'Only the shared budget owner can create invite links'
    )
  })

  it('accepts a valid invite and creates member membership once', async () => {
    dbModule.__mocks.selectLimit
      .mockResolvedValueOnce([
        {
          id: 'invite-1',
          sharedBudgetId: 'shared-1',
          sharedBudgetName: 'Общий бюджет',
          archivedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          acceptedAt: null,
        },
      ])
      .mockResolvedValueOnce([])

    const result = await acceptSharedBudgetInvite('raw-token')

    expect(result).toEqual({
      status: 'accepted',
      sharedBudgetName: 'Общий бюджет',
    })
    expect(dbModule.__mocks.txInsertValues).toHaveBeenCalledWith({
      sharedBudgetId: 'shared-1',
      userId: 'user-1',
      role: 'member',
      isActive: false,
    })
    expect(dbModule.__mocks.txUpdateSet).toHaveBeenCalledWith({
      acceptedAt: expect.any(Date),
      acceptedByUserId: 'user-1',
    })
  })

  it('does not accept used invites', async () => {
    dbModule.__mocks.selectLimit.mockResolvedValueOnce([
      {
        id: 'invite-1',
        sharedBudgetId: 'shared-1',
        sharedBudgetName: 'Общий бюджет',
        archivedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        acceptedAt: new Date(),
      },
    ])

    await expect(acceptSharedBudgetInvite('raw-token')).resolves.toEqual({
      status: 'used',
      sharedBudgetName: 'Общий бюджет',
    })
    expect(dbModule.__mocks.txInsertValues).not.toHaveBeenCalled()
  })

  it('does not accept expired invites', async () => {
    dbModule.__mocks.selectLimit.mockResolvedValueOnce([
      {
        id: 'invite-1',
        sharedBudgetId: 'shared-1',
        sharedBudgetName: 'Общий бюджет',
        archivedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
        acceptedAt: null,
      },
    ])

    await expect(acceptSharedBudgetInvite('raw-token')).resolves.toEqual({
      status: 'expired',
      sharedBudgetName: 'Общий бюджет',
    })
    expect(dbModule.__mocks.txInsertValues).not.toHaveBeenCalled()
  })

  it('reports duplicate membership without inserting a member', async () => {
    dbModule.__mocks.selectLimit
      .mockResolvedValueOnce([
        {
          id: 'invite-1',
          sharedBudgetId: 'shared-1',
          sharedBudgetName: 'Общий бюджет',
          archivedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          acceptedAt: null,
        },
      ])
      .mockResolvedValueOnce([{ sharedBudgetId: 'shared-1' }])

    await expect(acceptSharedBudgetInvite('raw-token')).resolves.toEqual({
      status: 'duplicate-member',
      sharedBudgetName: 'Общий бюджет',
    })
    expect(dbModule.__mocks.txInsertValues).not.toHaveBeenCalled()
  })

  it('shows duplicate preview only for an authenticated existing member', async () => {
    dbModule.__mocks.selectLimit
      .mockResolvedValueOnce([
        {
          id: 'invite-1',
          sharedBudgetId: 'shared-1',
          sharedBudgetName: 'Общий бюджет',
          archivedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          acceptedAt: null,
        },
      ])
      .mockResolvedValueOnce([{ sharedBudgetId: 'shared-1' }])

    await expect(getSharedBudgetInvitePreview('raw-token')).resolves.toEqual({
      status: 'duplicate-member',
      sharedBudgetName: 'Общий бюджет',
    })
  })
})
