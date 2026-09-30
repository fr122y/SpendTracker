jest.mock('@/shared/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn((...args: unknown[]) => args),
  eq: jest.fn((...args: unknown[]) => args),
}))

jest.mock('@/shared/db', () => {
  const mocks = {
    selectWhere: jest.fn(),
    transactionLegacyRows: jest.fn(),
    deleteWhere: jest.fn(),
    insertValues: jest.fn(),
    updateWhere: jest.fn(),
  }
  const tx = {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        leftJoin: jest.fn(() => ({ where: mocks.transactionLegacyRows })),
      })),
    })),
    delete: jest.fn(() => ({ where: mocks.deleteWhere })),
    insert: jest.fn(() => ({ values: mocks.insertValues })),
  }
  const query = {
    from: jest.fn(() => ({
      leftJoin: jest.fn(() => ({ where: mocks.selectWhere })),
      where: mocks.selectWhere,
    })),
  }

  return {
    __mocks: mocks,
    allocationBuckets: {
      id: 'allocation_bucket.id',
      userId: 'allocation_bucket.userId',
      label: 'allocation_bucket.label',
      basis: 'allocation_bucket.basis',
      percentage: 'allocation_bucket.percentage',
      amountKopecks: 'allocation_bucket.amountKopecks',
    },
    userSettings: {
      userId: 'user_settings.userId',
      salary: 'user_settings.salary',
    },
    db: {
      select: jest.fn(() => query),
      transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx)
      ),
      update: jest.fn(() => ({
        set: jest.fn(() => ({ where: mocks.updateWhere })),
      })),
    },
  }
})

import { auth } from '@/shared/auth'

import { getBuckets, updateBuckets } from '../bucket-actions'

import type { AllocationBucket } from '@/shared/types'

describe('bucket-actions', () => {
  const dbModule = jest.requireMock('@/shared/db') as {
    __mocks: {
      selectWhere: jest.Mock
      transactionLegacyRows: jest.Mock
      deleteWhere: jest.Mock
      insertValues: jest.Mock
      updateWhere: jest.Mock
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    dbModule.__mocks.selectWhere.mockResolvedValue([])
    dbModule.__mocks.transactionLegacyRows.mockResolvedValue([])
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns only percentage DTO fields and derives legacy amount rows precisely', async () => {
    const rows = [
      {
        id: 'bucket-1',
        label: 'Накопления',
        basis: 'amount',
        percentage: 0,
        amountKopecks: 33333333,
        salary: 1_000_000,
      },
    ]
    dbModule.__mocks.selectWhere.mockResolvedValueOnce(rows)

    const buckets = await getBuckets()

    expect(buckets).toHaveLength(1)
    expect(buckets[0]).toEqual(
      expect.objectContaining({
        id: 'bucket-1',
        label: 'Накопления',
      })
    )
    expect(buckets[0].percentage).toBeCloseTo(33.333333, 8)
    expect(dbModule.__mocks.selectWhere).toHaveBeenCalled()
  })

  it('rejects reading legacy amount rows when the current income is zero', async () => {
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([
      {
        id: 'bucket-1',
        label: 'Накопления',
        basis: 'amount',
        percentage: 0,
        amountKopecks: 1_500_000,
        salary: 0,
      },
    ])

    await expect(getBuckets()).rejects.toThrow('положительного дохода')
  })

  it('saves only percentage fields scoped to the authenticated user', async () => {
    const buckets = [
      {
        id: 'bucket-1',
        label: 'Накопления',
        percentage: 20,
      },
      {
        id: 'bucket-2',
        label: 'Резерв',
        percentage: 18.75,
      },
    ] as AllocationBucket[]

    await updateBuckets(buckets)

    expect(dbModule.__mocks.deleteWhere).toHaveBeenCalledWith([
      'allocation_bucket.userId',
      'user-1',
    ])
    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith([
      {
        id: 'bucket-1',
        userId: 'user-1',
        label: 'Накопления',
        percentage: 20,
      },
      {
        id: 'bucket-2',
        userId: 'user-1',
        label: 'Резерв',
        percentage: 18.75,
      },
    ])
  })

  it('normalizes legacy client buckets with no basis or amount fields', async () => {
    const legacyBuckets = [
      {
        id: 'bucket-legacy',
        label: 'Накопления',
        percentage: 12.345,
      },
    ] as unknown as AllocationBucket[]

    await updateBuckets(legacyBuckets)

    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith([
      {
        id: 'bucket-legacy',
        userId: 'user-1',
        label: 'Накопления',
        percentage: 12.345,
      },
    ])
  })

  it('allows an empty label while a new bucket is being edited', async () => {
    await updateBuckets([
      {
        id: 'bucket-draft',
        label: '',
        percentage: 0,
      },
    ])

    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith([
      {
        id: 'bucket-draft',
        userId: 'user-1',
        label: '',
        percentage: 0,
      },
    ])
  })

  it('allows an over-budget allocation to be saved', async () => {
    await expect(
      updateBuckets([
        {
          id: 'bucket-1',
          label: 'Накопления',
          percentage: 125,
        },
      ])
    ).resolves.toBeUndefined()
  })

  it('preserves finite legacy percentages with binary and extra precision', async () => {
    const buckets = [
      {
        id: 'bucket-1',
        label: 'Накопления',
        percentage: 0.29,
      },
      {
        id: 'bucket-2',
        label: 'Резерв',
        percentage: 12.345,
      },
    ]

    await updateBuckets(buckets)

    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ percentage: 0.29 }),
        expect.objectContaining({ percentage: 12.345 }),
      ])
    )
  })

  it('rejects percentages outside the safe hundredths range', async () => {
    await expect(
      updateBuckets([
        {
          id: 'bucket-1',
          label: 'Накопления',
          percentage: Math.floor(Number.MAX_SAFE_INTEGER / 100) + 1,
        },
      ])
    ).rejects.toThrow('Invalid bucket percentage')

    expect(dbModule.__mocks.deleteWhere).not.toHaveBeenCalled()
  })

  it('rejects invalid buckets before replacing stored data', async () => {
    await expect(
      updateBuckets([
        {
          id: 'bucket-1',
          label: 'Резерв',
          basis: 'amount',
          percentage: 0,
          amountKopecks: Number.MAX_SAFE_INTEGER + 1,
        },
      ] as unknown as AllocationBucket[])
    ).rejects.toThrow('Invalid legacy bucket amount')

    expect(dbModule.__mocks.deleteWhere).not.toHaveBeenCalled()
  })

  it('converts old amount payloads to percentages at the current income', async () => {
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([{ salary: 80_000 }])

    const oldClientBuckets = [
      {
        id: 'bucket-old-client',
        label: 'Накопления',
        basis: 'amount',
        percentage: 0,
        amountKopecks: 1_500_000,
      },
    ] as unknown as AllocationBucket[]

    await updateBuckets(oldClientBuckets)

    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith([
      {
        id: 'bucket-old-client',
        userId: 'user-1',
        label: 'Накопления',
        percentage: 18.75,
      },
    ])
  })

  it('rejects legacy amount payloads without positive income before replacing data', async () => {
    dbModule.__mocks.selectWhere.mockResolvedValueOnce([{ salary: 0 }])

    const oldClientBuckets = [
      {
        id: 'bucket-old-client',
        label: 'Накопления',
        basis: 'amount',
        percentage: 0,
        amountKopecks: 1_500_000,
      },
    ] as unknown as AllocationBucket[]

    await expect(updateBuckets(oldClientBuckets)).rejects.toThrow(
      'положительного дохода'
    )
    expect(dbModule.__mocks.deleteWhere).not.toHaveBeenCalled()
  })

  it('does not replace hidden legacy amounts when income is zero', async () => {
    dbModule.__mocks.transactionLegacyRows.mockResolvedValueOnce([
      { amountKopecks: 1_500_000, salary: 0 },
    ])

    await expect(
      updateBuckets([{ id: 'new', label: 'Новая категория', percentage: 10 }])
    ).rejects.toThrow('положительного дохода')

    expect(dbModule.__mocks.deleteWhere).not.toHaveBeenCalled()
  })

  it('does not replace hidden legacy amounts with missing stored values', async () => {
    dbModule.__mocks.transactionLegacyRows.mockResolvedValueOnce([
      { amountKopecks: null, salary: 80_000 },
    ])

    await expect(
      updateBuckets([{ id: 'new', label: 'Новая категория', percentage: 10 }])
    ).rejects.toThrow('Legacy amount allocation has no stored amount')

    expect(dbModule.__mocks.deleteWhere).not.toHaveBeenCalled()
  })

  it('rejects explicit amount bases with missing amounts', async () => {
    const malformedBuckets = [
      {
        id: 'bucket-1',
        label: 'Резерв',
        basis: 'amount',
        percentage: 0,
      },
    ] as unknown as AllocationBucket[]

    await expect(updateBuckets(malformedBuckets)).rejects.toThrow(
      'Invalid legacy bucket payload'
    )
    expect(dbModule.__mocks.deleteWhere).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated reads and updates', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce({ user: {} })
    await expect(getBuckets()).rejects.toThrow('Unauthorized')
    ;(auth as jest.Mock).mockResolvedValueOnce({ user: {} })
    await expect(updateBuckets([])).rejects.toThrow('Unauthorized')
  })
})
