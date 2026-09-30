const MAX_ALLOCATION_PERCENTAGE = Math.floor(Number.MAX_SAFE_INTEGER / 100)

export function salaryRublesToKopecks(salaryRubles: number): number {
  if (!Number.isFinite(salaryRubles) || salaryRubles < 0) {
    throw new RangeError(
      'Месячный доход должен быть конечным и неотрицательным'
    )
  }

  const scaled = salaryRubles * 100
  const rounded = Math.round(
    scaled + Number.EPSILON * Math.max(1, Math.abs(scaled))
  )

  if (!Number.isSafeInteger(rounded)) {
    throw new RangeError('Месячный доход превышает поддерживаемый диапазон')
  }

  return rounded
}

export function percentageFromAmountKopecks(
  amountKopecks: number,
  incomeKopecks: number
): number {
  if (!Number.isSafeInteger(amountKopecks) || amountKopecks < 0) {
    throw new RangeError('Сумма превышает поддерживаемый диапазон')
  }
  if (!Number.isSafeInteger(incomeKopecks) || incomeKopecks <= 0) {
    throw new RangeError(
      'Невозможно преобразовать сохранённую сумму без положительного дохода'
    )
  }

  const percentage = (amountKopecks / incomeKopecks) * 100
  if (
    !Number.isFinite(percentage) ||
    percentage < 0 ||
    percentage > MAX_ALLOCATION_PERCENTAGE
  ) {
    throw new RangeError('Процент превышает поддерживаемый диапазон')
  }

  return percentage
}
