export const SWIPE_CLOSE_DISTANCE = 80

/** A bottom sheet closes on a downward swipe longer than the threshold. */
export function shouldCloseOnSwipe(startY: number, endY: number): boolean {
  return endY - startY > SWIPE_CLOSE_DISTANCE
}
