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

  it('keeps amount-derived percentage precision separate from its display', () => {
    const percentage = amountToPercentage(1_000_000, 7_300_000)

    expect(percentage).toBeCloseTo(13.6986301369863, 12)
    expect(percentage && formatPercentage(percentage)).toBe('13,7')
    expect(percentageToKopecks(7_300_000, percentage ?? 0)).toBe(1_000_000)
    expect(amountToPercentage(1_500_000, 8_000_000)).toBe(18.75)
    expect(formatPercentage(20)).toBe('20')
    expect(formatPercentage(13.7)).toBe('13,7')
    expect(formatPercentage(18.75)).toBe('18,75')
  })

  it('converts a kopeck amount to canonical percentage without display rounding', () => {
    const percentage = amountToPercentage(33_333_333, 100_000_000)

    expect(percentage).toBeCloseTo(33.333333, 12)
    expect(formatPercentage(percentage ?? 0)).toBe('33,33')
    expect(percentageToKopecks(100_000_000, percentage ?? 0)).toBe(33_333_333)
  })

  it('formats exact rubles and kopecks for display and editing', () => {
    expect(formatKopecks(1_500_000)).toBe('15 000')
    expect(formatKopecks(1_000_001)).toBe('10 000,01')
    expect(formatKopecks(-500_000)).toBe('−5 000')
    expect(formatEditableKopecks(1_000_001)).toBe('10000.01')
  })

  it('calculates percentage plans and reports an exact negative remainder', () => {
    const buckets: AllocationBucket[] = [
      {
        id: 'percentage',
        label: 'Процентная категория',
        percentage: 20,
      },
      {
        id: 'over-budget',
        label: 'Превышение',
        percentage: 150,
      },
    ]

    expect(getBucketAmountKopecks(buckets[0], 10_000_000)).toBe(2_000_000)
    expect(calculateAllocation(buckets, 1_000_000)).toEqual({
      totalKopecks: 1_700_000,
      operationsKopecks: -700_000,
    })
  })

  it('calculates zero money from a percentage when income is unset', () => {
    const bucket: AllocationBucket = {
      id: 'percentage',
      label: 'Накопления',
      percentage: 20,
    }

    expect(amountToPercentage(1_500_000, 0)).toBeNull()
    expect(getBucketAmountKopecks(bucket, 0)).toBe(0)
    expect(calculateAllocation([bucket], 0)).toEqual({
      totalKopecks: 0,
      operationsKopecks: 0,
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
