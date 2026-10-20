'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { hasUnsavedFormInput, isLeavingForLogin } from '@/shared/lib'

/**
 * Whether leaving the page would lose something: text typed into a form, or
 * a save that is still running or paused offline (paused saves live only in
 * this page's memory). A deferred expense delete does not count: it is sent
 * with `keepalive` while the page unloads (ADR 0003).
 */
export function hasUnsavedChanges(isMutating: number): boolean {
  if (isLeavingForLogin()) return false
  return isMutating > 0 || hasUnsavedFormInput()
}

/** Asks the browser to confirm leaving while {@link hasUnsavedChanges}. */
export function UnsavedChangesGuard() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges(queryClient.isMutating())) return
      event.preventDefault()
      // Older browsers show the prompt only when returnValue is set.
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [queryClient])

  return null
}
