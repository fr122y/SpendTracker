import {
  amountToPercentage,
  calculateAllocation,
  formatEditableKopecks,
  formatKopecks,
  formatPercentage,
  getBucketAmountKopecks,
  percentageToKopecks,
  rublesToKopecks,
} from '../allocation'

import type { AllocationBucket } from '@/shared/types'

describe('income allocation calculations', () => {
  it('converts decimal ruble values to kopecks with half-up rounding', () => {
    expect(rublesToKopecks(1.005)).toBe(101)
    expect(rublesToKopecks(0.29)).toBe(29)
  })

  it('rounds percentage-derived amounts once to kopecks', () => {
    expect(percentageToKopecks(100, 12.345)).toBe(12)
    expect(percentageToKopecks(10_000_000, 12.345)).toBe(1_234_500)
    expect(percentageToKopecks(100, 12.5)).toBe(13)
  })

  it('derives percentage without changing the amount and omits trailing zeros', () => {
    expect(amountToPercentage(1_000_000, 7_300_000)).toBe(13.7)
    expect(amountToPercentage(1_500_000, 8_000_000)).toBe(18.75)
    expect(formatPercentage(20)).toBe('20')
    expect(formatPercentage(13.7)).toBe('13,7')
    expect(formatPercentage(18.75)).toBe('18,75')
  })

  it('formats exact rubles and kopecks for display and editing', () => {
    expect(formatKopecks(1_500_000)).toBe('15 000')
    expect(formatKopecks(1_000_001)).toBe('10 000,01')
    expect(formatKopecks(-500_000)).toBe('−5 000')
    expect(formatEditableKopecks(1_000_001)).toBe('10000.01')
  })

  it('supports a mixed plan and reports an exact negative remainder', () => {
    const buckets: AllocationBucket[] = [
      {
        id: 'percentage',
        label: 'Процентная категория',
        basis: 'percentage',
        percentage: 20,
        amountKopecks: null,
      },
      {
        id: 'amount',
        label: 'Денежная категория',
        basis: 'amount',
        percentage: 0,
        amountKopecks: 1_500_001,
      },
    ]

    expect(getBucketAmountKopecks(buckets[0], 10_000_000)).toBe(2_000_000)
    expect(calculateAllocation(buckets, 1_000_000)).toEqual({
      totalKopecks: 1_700_001,
      operationsKopecks: -700_001,
    })
  })

  it('keeps amount categories available without income', () => {
    const bucket: AllocationBucket = {
      id: 'amount',
      label: 'Накопления',
      basis: 'amount',
      percentage: 0,
      amountKopecks: 1_500_000,
    }

    expect(amountToPercentage(1_500_000, 0)).toBeNull()
    expect(getBucketAmountKopecks(bucket, 0)).toBe(1_500_000)
    expect(calculateAllocation([bucket], 0)).toEqual({
      totalKopecks: 1_500_000,
      operationsKopecks: -1_500_000,
    })
  })

  it('rejects values outside the safe kopeck range', () => {
    expect(() => rublesToKopecks(Number.MAX_SAFE_INTEGER)).toThrow(
      'поддерживаемый диапазон'
    )
    expect(() => percentageToKopecks(Number.MAX_SAFE_INTEGER, 200)).toThrow(
      'поддерживаемый диапазон'
    )
  })
})
