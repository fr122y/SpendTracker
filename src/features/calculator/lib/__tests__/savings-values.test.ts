import { buildSavingsValues, kopecksToPlainRubles } from '../savings-values'

describe('kopecksToPlainRubles', () => {
  it('converts kopecks to a plain ruble number without floating point drift', () => {
    expect(kopecksToPlainRubles(1600000)).toBe('16000')
    expect(kopecksToPlainRubles(33333333)).toBe('333333.33')
    expect(kopecksToPlainRubles(1050)).toBe('10.5')
    expect(kopecksToPlainRubles(7)).toBe('0.07')
    expect(kopecksToPlainRubles(-500000)).toBe('-5000')
  })
})

describe('buildSavingsValues', () => {
  it('lists income, each bucket amount, and the operations remainder', () => {
    const values = buildSavingsValues(80000, [
      { id: 'a', label: 'Подушка', percentage: 20 },
      { id: 'b', label: 'Инвестиции', percentage: 10 },
    ])

    expect(values).toEqual([
      { id: 'income', label: 'Месячный доход', kopecks: 8000000 },
      { id: 'bucket:a', label: 'Подушка', kopecks: 1600000 },
      { id: 'bucket:b', label: 'Инвестиции', kopecks: 800000 },
      { id: 'operations', label: 'Операции (остаток)', kopecks: 5600000 },
    ])
  })

  it('computes percentage buckets from income, including amount-entered ones', () => {
    const values = buildSavingsValues(80000, [
      { id: 'a', label: 'Отпуск', percentage: 18.75 },
    ])

    expect(values[1]).toEqual({
      id: 'bucket:a',
      label: 'Отпуск',
      kopecks: 1500000,
    })
  })

  it('keeps a negative remainder for an over-budget plan', () => {
    const values = buildSavingsValues(100000, [
      { id: 'a', label: 'A', percentage: 95 },
      { id: 'b', label: 'B', percentage: 10 },
    ])

    expect(values.at(-1)).toEqual({
      id: 'operations',
      label: 'Операции (остаток)',
      kopecks: -500000,
    })
  })

  it('returns zero amounts when income is unset', () => {
    const values = buildSavingsValues(0, [
      { id: 'a', label: 'A', percentage: 20 },
    ])

    expect(values.map((value) => value.kopecks)).toEqual([0, 0, 0])
  })

  it('returns no values when income cannot be represented', () => {
    expect(buildSavingsValues(Number.NaN, [])).toEqual([])
  })
})
