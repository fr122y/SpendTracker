import { SWIPE_CLOSE_DISTANCE, shouldCloseOnSwipe } from '../swipe'

describe('shouldCloseOnSwipe', () => {
  it('closes only on a downward swipe longer than the threshold', () => {
    expect(SWIPE_CLOSE_DISTANCE).toBe(80)
    expect(shouldCloseOnSwipe(100, 181)).toBe(true)
    expect(shouldCloseOnSwipe(100, 180)).toBe(false)
    expect(shouldCloseOnSwipe(300, 100)).toBe(false)
  })
})
