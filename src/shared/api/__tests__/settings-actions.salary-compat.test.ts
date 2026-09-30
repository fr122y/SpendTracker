jest.mock('@/shared/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn((...args: unknown[]) => args),
  asc: jest.fn((value: unknown) => value),
  eq: jest.fn((...args: unknown[]) => args),
}))

jest.mock('@/shared/db', () => {
  const mocks = {
    currentSettings: jest.fn(),
    legacyBuckets: jest.fn(),
    txUpdateSet: jest.fn(() => ({ where: jest.fn() })),
    directUpdateSet: jest.fn(() => ({ where: jest.fn() })),
  }
  let transactionSelectCount = 0
  const allocationBuckets = {
    id: 'allocation_bucket.id',
    userId: 'allocation_bucket.userId',
    basis: 'allocation_bucket.basis',
    percentage: 'allocation_bucket.percentage',
    amountKopecks: 'allocation_bucket.amountKopecks',
  }
  const userSettings = {
    userId: 'user_settings.userId',
    salary: 'user_settings.salary',
  }
  const tx = {
    select: jest.fn(() => {
      transactionSelectCount += 1
      const isCurrentSettingsQuery = transactionSelectCount === 1
      return {
        from: jest.fn(() => ({
          where: jest.fn(() =>
            isCurrentSettingsQuery
              ? { for: mocks.currentSettings }
              : mocks.legacyBuckets()
          ),
        })),
      }
    }),
    update: jest.fn(() => ({ set: mocks.txUpdateSet })),
  }

  return {
    __mocks: mocks,
    allocationBuckets,
    userSettings,
    weeklyBudgetLimits: {
      userId: 'weeklyBudgetLimit.userId',
      effectiveWeekStart: 'weeklyBudgetLimit.effectiveWeekStart',
    },
    db: {
      select: jest.fn(),
      update: jest.fn(() => ({ set: mocks.directUpdateSet })),
      transaction: jest.fn(
        async (callback: (transaction: typeof tx) => unknown) => {
          transactionSelectCount = 0
          return callback(tx)
        }
      ),
      insert: jest.fn(),
    },
  }
})

import { auth } from '@/shared/auth'

import { updateSettings } from '../settings-actions'

describe('updateSettings legacy allocation compatibility', () => {
  const dbModule = jest.requireMock('@/shared/db') as {
    __mocks: {
      currentSettings: jest.Mock
      legacyBuckets: jest.Mock
      txUpdateSet: jest.Mock
      directUpdateSet: jest.Mock
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    dbModule.__mocks.currentSettings.mockResolvedValue([{ salary: 80_000 }])
    dbModule.__mocks.legacyBuckets.mockResolvedValue([])
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('converts legacy amounts at the old salary before changing income', async () => {
    dbModule.__mocks.legacyBuckets.mockResolvedValueOnce([
      { id: 'bucket-1', amountKopecks: 1_500_000 },
    ])

    await updateSettings({ salary: 100_000 })

    expect(dbModule.__mocks.txUpdateSet).toHaveBeenNthCalledWith(1, {
      percentage: 18.75,
      basis: 'percentage',
      amountKopecks: null,
    })
    expect(dbModule.__mocks.txUpdateSet).toHaveBeenNthCalledWith(2, {
      salary: 100_000,
    })
  })

  it('uses the first positive salary to convert legacy amounts saved before income', async () => {
    dbModule.__mocks.currentSettings.mockResolvedValueOnce([{ salary: 0 }])
    dbModule.__mocks.legacyBuckets.mockResolvedValueOnce([
      { id: 'bucket-1', amountKopecks: 1_500_000 },
    ])

    await updateSettings({ salary: 80_000 })

    expect(dbModule.__mocks.txUpdateSet).toHaveBeenNthCalledWith(1, {
      percentage: 18.75,
      basis: 'percentage',
      amountKopecks: null,
    })
    expect(dbModule.__mocks.txUpdateSet).toHaveBeenNthCalledWith(2, {
      salary: 80_000,
    })
  })

  it('keeps legacy amount rows intact if neither salary is positive', async () => {
    dbModule.__mocks.currentSettings.mockResolvedValueOnce([{ salary: 0 }])
    dbModule.__mocks.legacyBuckets.mockResolvedValueOnce([
      { id: 'bucket-1', amountKopecks: 1_500_000 },
    ])

    await expect(updateSettings({ salary: 0 })).rejects.toThrow(
      'положительного дохода'
    )
    expect(dbModule.__mocks.txUpdateSet).not.toHaveBeenCalled()
  })

  it('continues to update non-salary settings without the compatibility transaction', async () => {
    await updateSettings({ salaryDay: 15 })

    expect(dbModule.__mocks.directUpdateSet).toHaveBeenCalledWith({
      salaryDay: 15,
    })
    expect(dbModule.__mocks.txUpdateSet).not.toHaveBeenCalled()
  })
})
