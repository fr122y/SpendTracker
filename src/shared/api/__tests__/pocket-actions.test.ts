jest.mock('@/shared/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn((...conditions) => ({ conditions })),
  asc: jest.fn((column) => ({ asc: column })),
  desc: jest.fn((column) => ({ desc: column })),
  eq: jest.fn((column, value) => ({ column, value })),
  isNull: jest.fn((column) => ({ isNull: column })),
  lt: jest.fn((column, value) => ({ lt: column, value })),
}))

jest.mock('@/shared/db', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    transaction: jest.fn(),
    update: jest.fn(),
  },
  pockets: {
    id: 'pocket.id',
    userId: 'pocket.userId',
    name: 'pocket.name',
    archivedAt: 'pocket.archivedAt',
    createdAt: 'pocket.createdAt',
  },
  pocketMonthBudgets: {
    pocketId: 'pocketMonthBudget.pocketId',
    period: 'pocketMonthBudget.period',
    budget: 'pocketMonthBudget.budget',
    createdAt: 'pocketMonthBudget.createdAt',
  },
}))

jest.mock('../pocket-helpers', () => ({
  assertValidPocketBudget: jest.fn((amount: number) => {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Pocket budget must be a non-negative finite number')
    }
  }),
  assertValidPocketPeriod: jest.fn((period: string) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      throw new Error('Pocket period must use YYYY-MM format')
    }
  }),
  getPocketForUser: jest.fn(),
  normalizePocketName: jest.fn((name: string) => name.trim()),
}))

import { lt } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { db, pocketMonthBudgets, pockets } from '@/shared/db'

import {
  createPocket,
  getPockets,
  initializePocketMonthBudget,
  setPocketMonthBudget,
} from '../pocket-actions'
import { getPocketForUser } from '../pocket-helpers'

const mockDb = db as unknown as {
  insert: jest.Mock
  select: jest.Mock
  transaction: jest.Mock
  update: jest.Mock
}

function setMockPocketInitialization({
  pocket,
  existing,
  previous,
  inserted,
  concurrentResult,
}: {
  pocket: { id: string; archivedAt: Date | null } | undefined
  existing: Array<{ pocketId: string; period: string; budget: number }>
  previous?: Array<{ budget: number }>
  inserted?: Array<{ pocketId: string; period: string; budget: number }>
  concurrentResult?: Array<{ pocketId: string; period: string; budget: number }>
}) {
  const lockForUpdate = jest.fn().mockResolvedValue(pocket ? [pocket] : [])
  const returning = jest.fn().mockResolvedValue(inserted ?? [])
  const onConflictDoNothing = jest.fn(() => ({ returning }))
  const insertValues = jest.fn(() => ({ onConflictDoNothing }))
  const tx = {
    select: jest
      .fn()
      .mockImplementationOnce(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            for: lockForUpdate,
          })),
        })),
      }))
      .mockImplementationOnce(() => ({
        from: jest.fn(() => ({ where: jest.fn().mockResolvedValue(existing) })),
      }))
      .mockImplementationOnce(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue(previous ?? []),
            })),
          })),
        })),
      }))
      .mockImplementationOnce(() => ({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue(concurrentResult ?? []),
        })),
      })),
    insert: jest.fn(() => ({ values: insertValues })),
    lockForUpdate,
    onConflictDoNothing,
    insertValues,
  }

  mockDb.transaction.mockImplementation(
    (callback: (transaction: typeof tx) => unknown) => callback(tx)
  )
  return tx
}

function setMockExistingBudgetRead(
  rows: Array<{ pocketId: string; period: string; budget: number }>
) {
  const limit = jest.fn().mockResolvedValue(rows)
  const where = jest.fn(() => ({ limit }))
  const innerJoin = jest.fn(() => ({ where }))
  const from = jest.fn(() => ({ innerJoin }))
  mockDb.select.mockReturnValueOnce({ from })

  return { from, innerJoin, where, limit }
}

describe('pocket-actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('requires authentication before reading pockets', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce(null)

    await expect(getPockets()).rejects.toThrow('Unauthorized')
    expect(mockDb.select).not.toHaveBeenCalled()
  })

  it('requires authentication before reading an existing monthly budget', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce(null)

    await expect(
      initializePocketMonthBudget('pocket-1', '2026-05')
    ).rejects.toThrow('Unauthorized')
    expect(mockDb.select).not.toHaveBeenCalled()
    expect(mockDb.transaction).not.toHaveBeenCalled()
  })

  it('creates a trimmed pocket for the current user', async () => {
    const createdAt = new Date('2026-10-01T10:00:00.000Z')
    const values = jest.fn(() => ({
      returning: jest
        .fn()
        .mockResolvedValueOnce([
          { id: 'pocket-1', name: 'Квартира', archivedAt: null, createdAt },
        ]),
    }))
    mockDb.insert.mockReturnValueOnce({
      values,
    })

    await expect(createPocket(' Квартира ')).resolves.toEqual({
      id: 'pocket-1',
      name: 'Квартира',
      archivedAt: undefined,
      createdAt: createdAt.toISOString(),
    })
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', name: 'Квартира' })
    )
  })

  it('copies the latest earlier saved budget, not a later period', async () => {
    setMockExistingBudgetRead([])
    const tx = setMockPocketInitialization({
      pocket: { id: 'pocket-1', archivedAt: null },
      existing: [],
      previous: [{ budget: 20_000 }],
      inserted: [{ pocketId: 'pocket-1', period: '2026-05', budget: 20_000 }],
    })

    await expect(
      initializePocketMonthBudget('pocket-1', '2026-05')
    ).resolves.toEqual({
      pocketId: 'pocket-1',
      period: '2026-05',
      budget: 20_000,
    })

    expect(tx.select).toHaveBeenCalledTimes(3)
    expect(tx.insert).toHaveBeenCalledTimes(1)
    expect(lt).toHaveBeenCalledWith(pocketMonthBudgets.period, '2026-05')
    expect(tx.lockForUpdate).toHaveBeenCalledWith('update')
  })

  it('uses zero when no earlier budget exists and returns the conflict winner', async () => {
    setMockExistingBudgetRead([])
    const tx = setMockPocketInitialization({
      pocket: { id: 'pocket-1', archivedAt: null },
      existing: [],
      previous: [],
      inserted: [],
      concurrentResult: [
        { pocketId: 'pocket-1', period: '2026-05', budget: 0 },
      ],
    })

    await expect(
      initializePocketMonthBudget('pocket-1', '2026-05')
    ).resolves.toEqual({ pocketId: 'pocket-1', period: '2026-05', budget: 0 })
    expect(tx.insert).toHaveBeenCalledTimes(1)
    expect(tx.insertValues).toHaveBeenCalledWith({
      pocketId: 'pocket-1',
      period: '2026-05',
      budget: 0,
    })
    expect(tx.onConflictDoNothing).toHaveBeenCalledWith({
      target: [pocketMonthBudgets.pocketId, pocketMonthBudgets.period],
    })
  })

  it('does not initialize a missing month for an archived pocket', async () => {
    setMockExistingBudgetRead([])
    const tx = setMockPocketInitialization({
      pocket: { id: 'pocket-1', archivedAt: new Date() },
      existing: [],
    })

    await expect(
      initializePocketMonthBudget('pocket-1', '2026-05')
    ).resolves.toBeNull()
    expect(tx.insert).not.toHaveBeenCalled()
  })

  it('returns an owner-scoped existing snapshot without starting a transaction', async () => {
    const budget = { pocketId: 'pocket-1', period: '2026-05', budget: 20_000 }
    const read = setMockExistingBudgetRead([budget])

    await expect(
      initializePocketMonthBudget('pocket-1', '2026-05')
    ).resolves.toEqual(budget)

    expect(read.innerJoin).toHaveBeenCalledWith(
      pockets,
      expect.objectContaining({
        column: pockets.id,
        value: pocketMonthBudgets.pocketId,
      })
    )
    expect(read.where).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: expect.arrayContaining([
          { column: pockets.id, value: 'pocket-1' },
          { column: pockets.userId, value: 'user-1' },
          { column: pocketMonthBudgets.pocketId, value: 'pocket-1' },
          { column: pocketMonthBudgets.period, value: '2026-05' },
        ]),
      })
    )
    expect(read.limit).toHaveBeenCalledWith(1)
    expect(mockDb.transaction).not.toHaveBeenCalled()
  })

  it('rechecks after the lock when another initializer creates the month', async () => {
    const budget = { pocketId: 'pocket-1', period: '2026-05', budget: 20_000 }
    setMockExistingBudgetRead([])
    const tx = setMockPocketInitialization({
      pocket: { id: 'pocket-1', archivedAt: null },
      existing: [budget],
    })

    await expect(
      initializePocketMonthBudget('pocket-1', '2026-05')
    ).resolves.toEqual(budget)

    expect(tx.lockForUpdate).toHaveBeenCalledWith('update')
    expect(tx.select).toHaveBeenCalledTimes(2)
    expect(tx.insert).not.toHaveBeenCalled()
  })

  it('does not reveal a snapshot for a pocket owned by another user', async () => {
    setMockExistingBudgetRead([])
    setMockPocketInitialization({
      pocket: undefined,
      existing: [],
    })

    await expect(
      initializePocketMonthBudget('pocket-other', '2026-05')
    ).rejects.toThrow('Pocket not found')
    expect(mockDb.transaction).toHaveBeenCalledTimes(1)
  })

  it('rejects negative budgets and updates only an existing period', async () => {
    ;(getPocketForUser as jest.Mock).mockResolvedValueOnce({
      id: 'pocket-1',
      userId: 'user-1',
      archivedAt: new Date(),
    })

    await expect(
      setPocketMonthBudget('pocket-1', '2026-05', -1)
    ).rejects.toThrow('Pocket budget must be a non-negative finite number')
    expect(mockDb.update).not.toHaveBeenCalled()
    ;(getPocketForUser as jest.Mock).mockResolvedValueOnce({
      id: 'pocket-1',
      userId: 'user-1',
      archivedAt: new Date(),
    })
    const where = jest.fn(() => ({
      returning: jest
        .fn()
        .mockResolvedValueOnce([
          { pocketId: 'pocket-1', period: '2026-05', budget: 12_000 },
        ]),
    }))
    const set = jest.fn(() => ({ where }))
    mockDb.update.mockReturnValueOnce({
      set,
    })

    await expect(
      setPocketMonthBudget('pocket-1', '2026-05', 12_000)
    ).resolves.toEqual({
      pocketId: 'pocket-1',
      period: '2026-05',
      budget: 12_000,
    })
    expect(set).toHaveBeenCalledWith({ budget: 12_000 })
    expect(where).toHaveBeenCalledWith({
      conditions: [
        { column: 'pocketMonthBudget.pocketId', value: 'pocket-1' },
        { column: 'pocketMonthBudget.period', value: '2026-05' },
      ],
    })
  })
})
