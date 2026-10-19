import type { WidgetId } from '@/shared/types'

type WidgetRevealListener = (widgetId: WidgetId) => void

const listeners = new Set<WidgetRevealListener>()

/**
 * Asks the mounted dashboard layout to bring a widget into view, for example
 * the journal after a calendar day is tapped. A layout that shows every widget
 * at once does not subscribe, so the request is then a no-op.
 */
export function requestWidgetReveal(widgetId: WidgetId): void {
  for (const listener of listeners) listener(widgetId)
}

/** Subscribes to widget reveal requests; returns the unsubscribe function. */
export function subscribeWidgetReveal(
  listener: WidgetRevealListener
): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
