import {
  calculateAllocation,
  getBucketAmountKopecks,
  rublesToKopecks,
} from '@/shared/lib'

import type { AllocationBucket } from '@/shared/types'

export interface SavingsValue {
  id: string
  label: string
  kopecks: number
}

export const INCOME_LABEL = 'Месячный доход'
export const OPERATIONS_LABEL = 'Операции (остаток)'

/** Integer-only conversion, so `33333333` becomes `333333.33` exactly. */
export function kopecksToPlainRubles(kopecks: number): string {
  const sign = kopecks < 0 ? '-' : ''
  const absolute = Math.abs(kopecks)
  const rubles = Math.floor(absolute / 100)
  const fraction = absolute % 100
  if (fraction === 0) return `${sign}${rubles}`

  return `${sign}${rubles}.${String(fraction).padStart(2, '0').replace(/0$/, '')}`
}

/** The values the «Накопления» widget shows, in the same order and kopecks. */
export function buildSavingsValues(
  salary: number,
  buckets: AllocationBucket[]
): SavingsValue[] {
  try {
    const incomeKopecks = rublesToKopecks(salary)
    const { operationsKopecks } = calculateAllocation(buckets, incomeKopecks)

    return [
      { id: 'income', label: INCOME_LABEL, kopecks: incomeKopecks },
      ...buckets.map((bucket) => ({
        id: `bucket:${bucket.id}`,
        label: bucket.label,
        kopecks: getBucketAmountKopecks(bucket, incomeKopecks),
      })),
      { id: 'operations', label: OPERATIONS_LABEL, kopecks: operationsKopecks },
    ]
  } catch {
    return []
  }
}
