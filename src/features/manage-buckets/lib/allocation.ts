import type { AllocationBucket } from '@/shared/types'

const KOPECKS_PER_RUBLE = 100
const BASIS_POINTS_PER_PERCENT = 100

function assertSafeInteger(value: number, message: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(message)
  }

  return value
}

export function rublesToKopecks(rubles: number): number {
  if (!Number.isFinite(rubles) || rubles < 0) {
    throw new RangeError('Сумма должна быть конечным неотрицательным числом')
  }

  const scaled = rubles * KOPECKS_PER_RUBLE
  const rounded = Math.round(
    scaled + Number.EPSILON * Math.max(1, Math.abs(scaled))
  )

  return assertSafeInteger(rounded, 'Сумма превышает поддерживаемый диапазон')
}

export function percentageToHundredths(percentage: number): number {
  if (!Number.isFinite(percentage)) {
    throw new RangeError('Процент должен быть конечным числом')
  }

  const scaled = Math.abs(percentage) * BASIS_POINTS_PER_PERCENT
  const rounded = Math.round(
    scaled + Number.EPSILON * Math.max(1, Math.abs(scaled))
  )

  return assertSafeInteger(rounded, 'Процент превышает поддерживаемый диапазон')
}

export function percentageToKopecks(
  incomeKopecks: number,
  percentage: number
): number {
  assertSafeInteger(incomeKopecks, 'Доход превышает поддерживаемый диапазон')
  if (incomeKopecks < 0) {
    throw new RangeError('Доход не может быть отрицательным')
  }

  if (!Number.isFinite(percentage) || percentage < 0) {
    throw new RangeError('Процент должен быть конечным неотрицательным числом')
  }

  const scaled = (incomeKopecks * percentage) / 100
  const rounded = Math.round(
    scaled + Number.EPSILON * Math.max(1, Math.abs(scaled))
  )

  return assertSafeInteger(
    rounded,
    'Рассчитанная сумма превышает поддерживаемый диапазон'
  )
}

export function amountToPercentage(
  amountKopecks: number,
  incomeKopecks: number
): number | null {
  assertSafeInteger(amountKopecks, 'Сумма превышает поддерживаемый диапазон')
  assertSafeInteger(incomeKopecks, 'Доход превышает поддерживаемый диапазон')

  if (amountKopecks < 0 || incomeKopecks < 0) {
    throw new RangeError('Сумма и доход не могут быть отрицательными')
  }
  if (incomeKopecks === 0) return null

  const scaled = (amountKopecks / incomeKopecks) * 100 * 100
  const rounded = Math.round(
    scaled + Number.EPSILON * Math.max(1, Math.abs(scaled))
  )
  const hundredths = assertSafeInteger(
    rounded,
    'Рассчитанный процент превышает поддерживаемый диапазон'
  )

  return hundredths / BASIS_POINTS_PER_PERCENT
}

export function formatPercentage(percentage: number): string {
  const hundredths = percentageToHundredths(percentage)
  const whole = Math.floor(hundredths / BASIS_POINTS_PER_PERCENT)
  const fraction = hundredths % BASIS_POINTS_PER_PERCENT

  const sign = percentage < 0 ? '−' : ''
  if (fraction === 0) return `${sign}${whole}`
  if (fraction % 10 === 0) return `${sign}${whole},${fraction / 10}`
  return `${sign}${whole},${String(fraction).padStart(2, '0')}`
}

export function formatKopecks(kopecks: number): string {
  assertSafeInteger(kopecks, 'Сумма превышает поддерживаемый диапазон')

  const isNegative = kopecks < 0
  const absoluteKopecks = Math.abs(kopecks)
  const rubles = Math.floor(absoluteKopecks / KOPECKS_PER_RUBLE)
  const fraction = absoluteKopecks % KOPECKS_PER_RUBLE
  const formattedRubles = new Intl.NumberFormat('ru-RU').format(rubles)

  if (fraction === 0) {
    return `${isNegative ? '−' : ''}${formattedRubles}`
  }

  return `${isNegative ? '−' : ''}${formattedRubles},${String(fraction)
    .padStart(2, '0')
    .replace(/0$/, '')}`
}

export function formatEditableKopecks(kopecks: number): string {
  assertSafeInteger(kopecks, 'Сумма превышает поддерживаемый диапазон')

  const rubles = Math.floor(kopecks / KOPECKS_PER_RUBLE)
  const fraction = kopecks % KOPECKS_PER_RUBLE
  if (fraction === 0) return String(rubles)

  return `${rubles}.${String(fraction).padStart(2, '0').replace(/0$/, '')}`
}

export function getBucketAmountKopecks(
  bucket: AllocationBucket,
  incomeKopecks: number
): number {
  if (bucket.basis === 'amount') {
    if (bucket.amountKopecks === null) {
      throw new RangeError('Для денежной основы не задана сумма')
    }
    return assertSafeInteger(
      bucket.amountKopecks,
      'Сумма превышает поддерживаемый диапазон'
    )
  }

  return percentageToKopecks(incomeKopecks, bucket.percentage)
}

export function calculateAllocation(
  buckets: AllocationBucket[],
  incomeKopecks: number
): { totalKopecks: number; operationsKopecks: number } {
  const totalKopecks = buckets.reduce((total, bucket) => {
    return assertSafeInteger(
      total + getBucketAmountKopecks(bucket, incomeKopecks),
      'Общая сумма распределения превышает поддерживаемый диапазон'
    )
  }, 0)

  return {
    totalKopecks,
    operationsKopecks: assertSafeInteger(
      incomeKopecks - totalKopecks,
      'Остаток превышает поддерживаемый диапазон'
    ),
  }
}

export function assertAllocationRepresentable(
  buckets: AllocationBucket[],
  incomeKopecks: number
): void {
  calculateAllocation(buckets, incomeKopecks)
  for (const bucket of buckets) {
    if (bucket.basis === 'amount') {
      amountToPercentage(bucket.amountKopecks ?? 0, incomeKopecks)
    } else {
      formatPercentage(bucket.percentage)
    }
  }
}
