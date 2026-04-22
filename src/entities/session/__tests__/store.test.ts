import {
  setDateMonth,
  shiftDateByDays,
  shiftDateByMonths,
} from '../model/store'

describe('session date helpers', () => {
  it('shifts date forward by one day across month boundary', () => {
    const result = shiftDateByDays(new Date(2026, 3, 30), 1)

    expect(result).toEqual(new Date(2026, 4, 1))
  })

  it('shifts date backward by one day across year boundary', () => {
    const result = shiftDateByDays(new Date(2026, 0, 1), -1)

    expect(result).toEqual(new Date(2025, 11, 31))
  })

  it('preserves day when moving to a month with enough days', () => {
    const result = shiftDateByMonths(new Date(2026, 0, 22), 1)

    expect(result).toEqual(new Date(2026, 1, 22))
  })

  it('clamps to the nearest valid day when moving to a shorter month', () => {
    const result = shiftDateByMonths(new Date(2026, 2, 31), 1)

    expect(result).toEqual(new Date(2026, 3, 30))
  })

  it('sets selected month while keeping day when possible', () => {
    const result = setDateMonth(new Date(2026, 3, 22), 2026, 4)

    expect(result).toEqual(new Date(2026, 4, 22))
  })

  it('uses the nearest valid date when selected month lacks the current day', () => {
    const result = setDateMonth(new Date(2026, 0, 31), 2026, 1)

    expect(result).toEqual(new Date(2026, 1, 28))
  })
})
