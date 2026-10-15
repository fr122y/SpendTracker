'use client'

import { useCallback, useRef } from 'react'

/**
 * Serializes a form submit: while a run is in flight, further calls return
 * `false` without starting the task. The lock lives in a ref, so a second
 * click that arrives before React re-renders sees it immediately, unlike a
 * pending flag read from state.
 */
export function useSubmitLock(): (
  task: () => unknown | Promise<unknown>
) => Promise<boolean> {
  const lockedRef = useRef(false)

  return useCallback(async (task) => {
    if (lockedRef.current) return false
    lockedRef.current = true
    try {
      await task()
      return true
    } finally {
      lockedRef.current = false
    }
  }, [])
}
