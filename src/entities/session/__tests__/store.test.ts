import { wrap } from '@reatom/core'

import {
  isFollowingTodayAtom,
  nextDay,
  selectedDateAtom,
  setDateMonth,
  setSelectedDate,
  setToday,
  shiftDateByDays,
  shiftDateByMonths,
  syncTodayIfFollowing,
} from '../model/store'

function expectSelectedDate(date: Date) {
  expect(selectedDateAtom()).toEqual(date)
}

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

describe('session today following', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 15, 10))
    wrap(setToday)()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('follows today after setToday', () => {
    expectSelectedDate(new Date(2026, 0, 15))
    expect(isFollowingTodayAtom()).toBe(true)
  })

  it('updates selected date on day rollover while following today', () => {
    jest.setSystemTime(new Date(2026, 0, 16, 9))

    wrap(syncTodayIfFollowing)()

    expectSelectedDate(new Date(2026, 0, 16))
    expect(isFollowingTodayAtom()).toBe(true)
  })

  it('does not overwrite a manually selected date', () => {
    wrap(setSelectedDate)(new Date(2026, 0, 10))
    jest.setSystemTime(new Date(2026, 0, 16, 9))

    wrap(syncTodayIfFollowing)()

    expectSelectedDate(new Date(2026, 0, 10))
    expect(isFollowingTodayAtom()).toBe(false)
  })

  it('disables today following after day navigation', () => {
    wrap(nextDay)()
    jest.setSystemTime(new Date(2026, 0, 16, 9))

    wrap(syncTodayIfFollowing)()

    expectSelectedDate(new Date(2026, 0, 16))
    expect(isFollowingTodayAtom()).toBe(false)
  })

  it('restores today following after pressing today', () => {
    wrap(setSelectedDate)(new Date(2026, 0, 10))
    jest.setSystemTime(new Date(2026, 0, 16, 9))

    wrap(setToday)()

    expectSelectedDate(new Date(2026, 0, 16))
    expect(isFollowingTodayAtom()).toBe(true)
  })
})
