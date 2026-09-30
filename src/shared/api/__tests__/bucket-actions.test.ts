jest.mock('@/shared/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((...args: unknown[]) => args),
}))

jest.mock('@/shared/db', () => {
  const mocks = {
    selectWhere: jest.fn(),
    deleteWhere: jest.fn(),
    insertValues: jest.fn(),
  }
  const tx = {
    delete: jest.fn(() => ({ where: mocks.deleteWhere })),
    insert: jest.fn(() => ({ values: mocks.insertValues })),
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
    db: {
      select: jest.fn(() => ({
        from: jest.fn(() => ({ where: mocks.selectWhere })),
      })),
      transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx)
      ),
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
      deleteWhere: jest.Mock
      insertValues: jest.Mock
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns allocation basis and exact amount for the current user', async () => {
    const rows = [
      {
        id: 'bucket-1',
        label: 'Накопления',
        basis: 'amount',
        percentage: 0,
        amountKopecks: 1234567,
      },
    ]
    dbModule.__mocks.selectWhere.mockResolvedValueOnce(rows)

    await expect(getBuckets()).resolves.toEqual(rows)
    expect(dbModule.__mocks.selectWhere).toHaveBeenCalled()
  })

  it('saves both allocation bases scoped to the authenticated user', async () => {
    const buckets = [
      {
        id: 'bucket-1',
        label: 'Накопления',
        basis: 'percentage' as const,
        percentage: 20,
        amountKopecks: null,
      },
      {
        id: 'bucket-2',
        label: 'Резерв',
        basis: 'amount' as const,
        percentage: 0,
        amountKopecks: 1234567,
      },
    ]

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
        basis: 'percentage',
        percentage: 20,
        amountKopecks: null,
      },
      {
        id: 'bucket-2',
        userId: 'user-1',
        label: 'Резерв',
        basis: 'amount',
        percentage: 0,
        amountKopecks: 1234567,
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
        basis: 'percentage',
        percentage: 12.345,
        amountKopecks: null,
      },
    ])
  })

  it('allows an empty label while a new bucket is being edited', async () => {
    await updateBuckets([
      {
        id: 'bucket-draft',
        label: '',
        basis: 'percentage',
        percentage: 0,
        amountKopecks: null,
      },
    ])

    expect(dbModule.__mocks.insertValues).toHaveBeenCalledWith([
      {
        id: 'bucket-draft',
        userId: 'user-1',
        label: '',
        basis: 'percentage',
        percentage: 0,
        amountKopecks: null,
      },
    ])
  })

  it('allows an over-budget allocation to be saved', async () => {
    await expect(
      updateBuckets([
        {
          id: 'bucket-1',
          label: 'Накопления',
          basis: 'percentage',
          percentage: 125,
          amountKopecks: null,
        },
      ])
    ).resolves.toBeUndefined()
  })

  it('preserves finite legacy percentages with binary and extra precision', async () => {
    const buckets = [
      {
        id: 'bucket-1',
        label: 'Накопления',
        basis: 'percentage' as const,
        percentage: 0.29,
        amountKopecks: null,
      },
      {
        id: 'bucket-2',
        label: 'Резерв',
        basis: 'percentage' as const,
        percentage: 12.345,
        amountKopecks: null,
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
          basis: 'percentage',
          percentage: Math.floor(Number.MAX_SAFE_INTEGER / 100) + 1,
          amountKopecks: null,
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
      ])
    ).rejects.toThrow('Invalid bucket amount')

    expect(dbModule.__mocks.deleteWhere).not.toHaveBeenCalled()
  })

  it('does not repair an explicit amount basis with a missing amount', async () => {
    const malformedBuckets = [
      {
        id: 'bucket-1',
        label: 'Резерв',
        basis: 'amount',
        percentage: 0,
      },
    ] as unknown as AllocationBucket[]

    await expect(updateBuckets(malformedBuckets)).rejects.toThrow(
      'Invalid bucket amount'
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
