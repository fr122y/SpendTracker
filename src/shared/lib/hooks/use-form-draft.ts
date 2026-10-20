'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'

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
/** Draft keys that hold text the user typed, not a selection. */
const inputKeys = new Set<string>()
/** Values of a submitted form whose save has not succeeded yet. */
let submitted: Record<string, Record<string, unknown>> = {}

export const PERSISTED_DRAFTS_KEY = 'spendtracker:form-drafts'

function setDraftField(key: string, value: unknown) {
  if (key in drafts && Object.is(drafts[key], value)) return
  drafts = { ...drafts, [key]: value }
  listeners.forEach((listener) => listener())
}

/** Drops all drafts. For tests. */
export function resetFormDrafts() {
  drafts = {}
  submitted = {}
  inputKeys.clear()
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const getDrafts = () => drafts

const isFilled = (value: unknown) =>
  typeof value === 'string' && value.trim() !== ''

/** Whether any form holds text the user typed and has not submitted. */
export function hasUnsavedFormInput(): boolean {
  return [...inputKeys].some((key) => isFilled(drafts[key]))
}

function formFields(formKey: string): Record<string, unknown> {
  const prefix = `${formKey}:`
  return Object.fromEntries(
    Object.entries(drafts).filter(([key]) => key.startsWith(prefix))
  )
}

/**
 * Remembers what a form held when it was submitted, before it clears itself
 * for the next entry. If the session turns out to be expired, these values
 * return to the form after sign-in. Call the returned function once the save
 * succeeded.
 */
export function holdSubmittedDraft(formKey: string): () => void {
  const fields = formFields(formKey)
  submitted = { ...submitted, [formKey]: fields }
  return () => {
    if (submitted[formKey] !== fields) return
    submitted = Object.fromEntries(
      Object.entries(submitted).filter(([key]) => key !== formKey)
    )
  }
}

/**
 * Saves the drafts to `sessionStorage`. A form that was submitted and has no
 * new input since keeps its submitted values, so a save rejected for an
 * expired session is not lost.
 */
export function persistFormDrafts() {
  let snapshot: Record<string, unknown> = { ...drafts }
  for (const [formKey, fields] of Object.entries(submitted)) {
    const prefix = `${formKey}:`
    const hasNewInput = [...inputKeys].some(
      (key) => key.startsWith(prefix) && isFilled(drafts[key])
    )
    if (!hasNewInput) snapshot = { ...snapshot, ...fields }
  }
  if (Object.keys(snapshot).length === 0) return
  try {
    window.sessionStorage.setItem(
      PERSISTED_DRAFTS_KEY,
      JSON.stringify(snapshot)
    )
  } catch {
    // Storage may be unavailable; the drafts are lost as before.
  }
}

/** Moves drafts saved by {@link persistFormDrafts} back into the forms. */
export function restorePersistedFormDrafts() {
  let raw: string | null = null
  try {
    raw = window.sessionStorage.getItem(PERSISTED_DRAFTS_KEY)
    if (raw === null) return
    window.sessionStorage.removeItem(PERSISTED_DRAFTS_KEY)
  } catch {
    return
  }
  try {
    const restored: unknown = JSON.parse(raw)
    if (!restored || typeof restored !== 'object') return
    drafts = { ...drafts, ...(restored as Record<string, unknown>) }
    listeners.forEach((listener) => listener())
  } catch {
    // A malformed entry is dropped.
  }
}

interface FormDraftOptions {
  /**
   * The field holds text the user typed. Such a field, when not empty, counts
   * as unsaved input for the leave-page warning.
   */
  input?: boolean
}

/**
 * `useState` whose value survives the component remounting: the value is
 * stored under `<formKey>:<field>` until it changes or the page reloads. A
 * form clears its draft after a successful submit by resetting its fields.
 */
export function useFormDraft<T>(
  formKey: string,
  field: string,
  initialValue: T,
  options: FormDraftOptions = {}
): [T, Dispatch<SetStateAction<T>>] {
  const key = `${formKey}:${field}`
  if (options.input) inputKeys.add(key)
  const current = useSyncExternalStore(subscribe, getDrafts, getDrafts)
  const value = key in current ? (current[key] as T) : initialValue

  // After sign-in the form gets back what the expired session interrupted.
  useEffect(restorePersistedFormDrafts, [])

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
