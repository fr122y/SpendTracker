'use client'

import { onlineManager, useIsMutating } from '@tanstack/react-query'
import { useEffect, useState, useSyncExternalStore } from 'react'

export const OFFLINE_MESSAGE =
  'Нет сети — изменения сохранятся, когда связь вернётся'
export const SAVING_MESSAGE = 'Сохраняется…'
/** A save shorter than this shows no indicator, so quick saves do not blink. */
export const SAVING_DELAY_MS = 1000

const subscribe = (listener: () => void) => onlineManager.subscribe(listener)
const getOnline = () => onlineManager.isOnline()
const getServerOnline = () => true

/**
 * A small status line for the network and pending saves. Offline it says so
 * at once; a save that is paused offline or still running after
 * {@link SAVING_DELAY_MS} shows «Сохраняется…». Hidden otherwise.
 */
export function NetworkStatus() {
  const online = useSyncExternalStore(subscribe, getOnline, getServerOnline)
  const pending = useIsMutating() > 0
  const [slowSave, setSlowSave] = useState(false)

  useEffect(() => {
    if (!pending) {
      setSlowSave(false)
      return
    }
    const timer = setTimeout(() => setSlowSave(true), SAVING_DELAY_MS)
    return () => clearTimeout(timer)
  }, [pending])

  const showSaving = pending && (slowSave || !online)
  if (online && !showSaving) return null

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-3 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col items-center gap-0.5 rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-1.5 text-center text-xs text-zinc-200 shadow-lg"
    >
      {online ? null : <span>{OFFLINE_MESSAGE}</span>}
      {showSaving ? (
        <span className="text-zinc-400">{SAVING_MESSAGE}</span>
      ) : null}
    </div>
  )
}
