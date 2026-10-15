import { getPaydayInMonth, isValidPaydayDay } from '../payday'

describe('getPaydayInMonth', () => {
  it('keeps a day that exists in the month', () => {
    expect(getPaydayInMonth(10, 2026, 10)).toBe(10)
    expect(getPaydayInMonth(31, 2026, 0)).toBe(31)
  })

  it('moves day 31 to the last day of a 30-day month', () => {
    expect(getPaydayInMonth(31, 2026, 10)).toBe(30)
  })

  it('moves days past February end to Feb 28 or 29', () => {
    expect(getPaydayInMonth(31, 2026, 1)).toBe(28)
    expect(getPaydayInMonth(30, 2026, 1)).toBe(28)
    expect(getPaydayInMonth(31, 2028, 1)).toBe(29)
    expect(getPaydayInMonth(29, 2028, 1)).toBe(29)
  })

  it('handles month overflow from a calendar grid (December -> January)', () => {
    expect(getPaydayInMonth(31, 2026, 12)).toBe(31)
    expect(getPaydayInMonth(31, 2026, -1)).toBe(31)
  })
})

describe('isValidPaydayDay', () => {
  it.each([1, 15, 31])('accepts %p', (value) => {
    expect(isValidPaydayDay(value)).toBe(true)
  })

  it.each([0, 32, 35, -1, 10.5, Number.NaN, '10', undefined])(
    'rejects %p',
    (value) => {
      expect(isValidPaydayDay(value)).toBe(false)
    }
  )
})
