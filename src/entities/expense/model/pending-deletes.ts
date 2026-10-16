'use client'

import { useSyncExternalStore } from 'react'

/**
 * Deletes that wait for the undo window to close. A pending record is hidden
 * from every expense read (see `useExpenses`) but still exists on the server
 * until its commit runs. The id stays pending until the commit settles, so the
 * row does not flash back between the timer and the optimistic cache removal.
 */
interface PendingDelete {
  timer: ReturnType<typeof setTimeout> | null
  commit: () => Promise<unknown>
}

const pending = new Map<string, PendingDelete>()
const listeners = new Set<() => void>()
const EMPTY: ReadonlySet<string> = new Set()
let snapshot: ReadonlySet<string> = EMPTY

function emit() {
  snapshot = pending.size === 0 ? EMPTY : new Set(pending.keys())
  listeners.forEach((listener) => listener())
}

function runCommit(id: string) {
  const entry = pending.get(id)
  if (!entry || entry.timer === null) return
  clearTimeout(entry.timer)
  entry.timer = null
  void entry
    .commit()
    .catch(() => {
      // The delete mutation rolls back and shows its own toast.
    })
    .finally(() => {
      if (pending.get(id) === entry) {
        pending.delete(id)
        emit()
      }
    })
}

/** Hides the record now and commits `commit` after `delayMs` unless undone. */
export function scheduleExpenseDelete(
  id: string,
  commit: () => Promise<unknown>,
  delayMs: number
) {
  if (pending.has(id)) return
  const entry: PendingDelete = { timer: null, commit }
  entry.timer = setTimeout(() => runCommit(id), delayMs)
  pending.set(id, entry)
  emit()
}

/** Cancels a delete that has not been committed yet; true when it was. */
export function undoExpenseDelete(id: string): boolean {
  const entry = pending.get(id)
  if (!entry || entry.timer === null) return false
  clearTimeout(entry.timer)
  pending.delete(id)
  emit()
  return true
}

/** Commits every waiting delete immediately (unmount, page hide). */
export function flushExpenseDeletes() {
  for (const id of [...pending.keys()]) runCommit(id)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => snapshot
const getServerSnapshot = () => EMPTY

export function usePendingExpenseDeleteIds(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
