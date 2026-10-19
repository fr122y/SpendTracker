'use client'

import { useCallback, useSyncExternalStore } from 'react'

import type { Dispatch, SetStateAction } from 'react'

/**
 * In-memory drafts of form fields, keyed by `<form key>:<field>`. They live
 * above the dashboard layout branch, so a form that remounts on rotation or a
 * layout switch keeps what the user typed. Never persisted to browser storage.
 *
 * A plain synchronous store rather than a Reatom atom: Reatom notifies
 * subscribers asynchronously, and a controlled input must re-render in the same
 * event, or the caret jumps and fast typing is lost.
 */
let drafts: Readonly<Record<string, unknown>> = {}
const listeners = new Set<() => void>()

function setDraftField(key: string, value: unknown) {
  if (key in drafts && Object.is(drafts[key], value)) return
  drafts = { ...drafts, [key]: value }
  listeners.forEach((listener) => listener())
}

/** Drops all drafts. For tests. */
export function resetFormDrafts() {
  drafts = {}
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const getDrafts = () => drafts

/**
 * `useState` whose value survives the component remounting: the value is
 * stored under `<formKey>:<field>` until it changes or the page reloads. A
 * form clears its draft after a successful submit by resetting its fields.
 */
export function useFormDraft<T>(
  formKey: string,
  field: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const key = `${formKey}:${field}`
  const current = useSyncExternalStore(subscribe, getDrafts, getDrafts)
  const value = key in current ? (current[key] as T) : initialValue

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      const previous = key in drafts ? (drafts[key] as T) : initialValue
      setDraftField(
        key,
        typeof next === 'function'
          ? (next as (previous: T) => T)(previous)
          : next
      )
    },
    // `initialValue` is only the fallback; a new literal each render is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  )

  return [value, setValue]
}
