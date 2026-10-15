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
    insertValues: jest.fn(() => ({ onConflictDoUpdate: jest.fn() })),
    directUpdateSet: jest.fn(() => ({ where: jest.fn() })),
  }

  return {
    __mocks: mocks,
    allocationBuckets: {},
    userSettings: { userId: 'user_settings.userId' },
    weeklyBudgetLimits: {
      userId: 'weeklyBudgetLimit.userId',
      effectiveWeekStart: 'weeklyBudgetLimit.effectiveWeekStart',
    },
    db: {
      select: jest.fn(),
      update: jest.fn(() => ({ set: mocks.directUpdateSet })),
      transaction: jest.fn(),
      insert: jest.fn(() => ({ values: mocks.insertValues })),
    },
  }
})

import { auth } from '@/shared/auth'

import { setWeeklyLimitForWeek, updateSettings } from '../settings-actions'

describe('weekly limit server validation', () => {
  const dbModule = jest.requireMock('@/shared/db') as {
    __mocks: { insertValues: jest.Mock; directUpdateSet: jest.Mock }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('stores a positive limit for the client-provided Monday', async () => {
    await setWeeklyLimitForWeek('2026-10-12', 8000)

    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        effectiveWeekStart: '2026-10-12',
        amount: 8000,
      })
    )
  })

  it.each([0, -100, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects limit %p with a Russian error and stores nothing',
    async (amount) => {
      await expect(setWeeklyLimitForWeek('2026-10-12', amount)).rejects.toThrow(
        'Лимит должен быть больше 0'
      )
      expect(dbModule.__mocks.insertValues).not.toHaveBeenCalled()
    }
  )

  it.each([
    '2026-10-13',
    '2026-10-18',
    '12.10.2026',
    '2026-1-12',
    '2026-02-30',
  ])(
    'rejects week start %p that is not a Monday in YYYY-MM-DD',
    async (weekStart) => {
      await expect(setWeeklyLimitForWeek(weekStart, 8000)).rejects.toThrow(
        'понедельником'
      )
      expect(dbModule.__mocks.insertValues).not.toHaveBeenCalled()
    }
  )

  it('uses the client Monday instead of the server clock in updateSettings', async () => {
    // A user in UTC+10 on Monday morning is still on Sunday in UTC.
    jest.useFakeTimers().setSystemTime(new Date('2026-10-11T22:30:00Z'))
    try {
      await updateSettings({
        weeklyLimit: 5000,
        weeklyLimitWeekStart: '2026-10-12',
      })
    } finally {
      jest.useRealTimers()
    }

    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveWeekStart: '2026-10-12',
        amount: 5000,
      })
    )
  })

  it('rejects a weekly limit in updateSettings without a client week start', async () => {
    await expect(
      updateSettings({ weeklyLimit: 5000, salaryDay: 15 })
    ).rejects.toThrow('понедельником')
    expect(dbModule.__mocks.insertValues).not.toHaveBeenCalled()
    expect(dbModule.__mocks.directUpdateSet).not.toHaveBeenCalled()
  })

  it('rejects a zero weekly limit in updateSettings before any write', async () => {
    await expect(
      updateSettings({ weeklyLimit: 0, weeklyLimitWeekStart: '2026-10-12' })
    ).rejects.toThrow('Лимит должен быть больше 0')
    expect(dbModule.__mocks.insertValues).not.toHaveBeenCalled()
  })
})
