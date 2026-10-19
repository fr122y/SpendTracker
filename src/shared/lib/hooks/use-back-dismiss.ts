'use client'

import { useEffect, useRef } from 'react'

/**
 * Open dialogs, topmost last. Browser Back closes only the topmost one, so a
 * dialog opened from another dialog closes first.
 */
const openDialogs: Array<() => void> = []
/** `history.back()` calls made by a normal close, whose popstate is ours. */
let pendingOwnBacks = 0
let nextEntryId = 0
let isListening = false

function handlePopState() {
  if (pendingOwnBacks > 0) {
    pendingOwnBacks -= 1
    return
  }
  openDialogs.pop()?.()
}

/**
 * While `isOpen`, adds one browser history entry for a dialog. Browser Back
 * then calls `onClose` instead of leaving the page; closing the dialog any
 * other way removes the entry again, so no stray entries are left.
 *
 * The entry keeps the current URL and Next.js history state, so the router
 * treats Back as a return to the same page.
 */
export function useBackDismiss(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!isOpen) return

    const entryId = ++nextEntryId
    let closedByBack = false
    const closeFromBack = () => {
      closedByBack = true
      onCloseRef.current()
    }

    window.history.pushState(
      { ...window.history.state, backDismissEntry: entryId },
      ''
    )
    if (!isListening) {
      window.addEventListener('popstate', handlePopState)
      isListening = true
    }
    openDialogs.push(closeFromBack)

    return () => {
      const index = openDialogs.indexOf(closeFromBack)
      if (index !== -1) openDialogs.splice(index, 1)

      // Pop our entry only while it is still the current one: after Back it is
      // already gone, and after a navigation it is not ours to remove.
      if (!closedByBack && window.history.state?.backDismissEntry === entryId) {
        pendingOwnBacks += 1
        window.history.back()
      }
    }
  }, [isOpen])
}
