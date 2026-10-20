'use client'

import { useSyncExternalStore } from 'react'

import {
  getKnownId,
  isPendingId,
  isTempId,
  resolveId,
  subscribePendingIds,
} from '@/shared/lib/pending-ids'

/**
 * Deletes that wait for the undo window to close. A pending record is hidden
 * from every expense read (see `useExpenses`) but still exists on the server
 * until its commit runs. The id stays pending until the commit settles, so the
 * row does not flash back between the timer and the optimistic cache removal.
 *
 * Every waiting delete is also written to `localStorage` until the server
 * confirms it. A page that unloads sends them with a keepalive request, and
 * the next app load sends again any that are past due and unconfirmed: a
 * delete is never lost to a reload or a closed tab. Hiding the page closes
 * the undo window, so its deletes count as past due from then on.
 */
interface PendingDelete {
  timer: ReturnType<typeof setTimeout> | null
  commit: () => Promise<unknown>
}

export const EXPENSE_FLUSH_DELETES_URL = '/api/expenses/flush-deletes'
export const PENDING_EXPENSE_DELETES_STORAGE_KEY =
  'spendtracker:pending-expense-deletes'

interface StoredDelete {
  id: string
  dueAt: number
}

const pending = new Map<string, PendingDelete>()
/** Ids from an earlier page load, hidden until the server confirms them. */
const recovering = new Set<string>()
const listeners = new Set<() => void>()
const EMPTY: ReadonlySet<string> = new Set()
let snapshot: ReadonlySet<string> = EMPTY

function emit() {
  if (pending.size === 0 && recovering.size === 0) {
    snapshot = EMPTY
  } else {
    const ids = new Set<string>(recovering)
    for (const id of pending.keys()) {
      ids.add(id)
      const knownId = getKnownId(id)
      if (knownId) ids.add(knownId)
    }
    snapshot = ids
  }
  listeners.forEach((listener) => listener())
}

function readStored(): StoredDelete[] {
  try {
    const raw = window.localStorage.getItem(PENDING_EXPENSE_DELETES_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is StoredDelete =>
        typeof item?.id === 'string' && typeof item?.dueAt === 'number'
    )
  } catch {
    return []
  }
}

function writeStored(items: StoredDelete[]) {
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(PENDING_EXPENSE_DELETES_STORAGE_KEY)
    } else {
      window.localStorage.setItem(
        PENDING_EXPENSE_DELETES_STORAGE_KEY,
        JSON.stringify(items)
      )
    }
  } catch {
    // Storage may be unavailable; the keepalive request still runs.
  }
}

function storeDelete(id: string, dueAt: number) {
  writeStored([...readStored().filter((item) => item.id !== id), { id, dueAt }])
}

function forgetStored(ids: readonly string[]) {
  const forget = new Set(ids)
  const items = readStored()
  const kept = items.filter((item) => !forget.has(item.id))
  if (kept.length !== items.length) writeStored(kept)
}

/**
 * Moves the due time of stored deletes to `now`. A page that hides commits its
 * waiting deletes at once, so their undo window has closed: the next load must
 * resend them and keep them hidden, not leave them to another tab.
 */
function markStoredDue(ids: readonly string[], now: number) {
  const due = new Set(ids)
  const items = readStored()
  if (!items.some((item) => due.has(item.id) && item.dueAt > now)) return
  writeStored(
    items.map((item) =>
      due.has(item.id) && item.dueAt > now ? { ...item, dueAt: now } : item
    )
  )
}

/** The id the server knows for a waiting delete, when it is known. */
function serverId(id: string): string | undefined {
  const knownId = getKnownId(id)
  return knownId && !isTempId(knownId) ? knownId : undefined
}

function finish(id: string, entry: PendingDelete) {
  if (pending.get(id) === entry) {
    pending.delete(id)
    emit()
  }
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
      // Confirmed or rolled back with a toast: nothing is left to resend.
      forgetStored([id, serverId(id) ?? id])
      finish(id, entry)
    })
}

/** POSTs ids to the flush route with a request that survives page unload. */
export async function sendExpenseDeletes(ids: string[]): Promise<boolean> {
  try {
    const response = await fetch(EXPENSE_FLUSH_DELETES_URL, {
      method: 'POST',
      keepalive: true,
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    return response.ok
  } catch {
    return false
  }
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
  storeDelete(id, Date.now() + delayMs)
  emit()
}

/** Cancels a delete that has not been committed yet; true when it was. */
export function undoExpenseDelete(id: string): boolean {
  const entry = pending.get(id)
  if (!entry || entry.timer === null) return false
  clearTimeout(entry.timer)
  pending.delete(id)
  forgetStored([id])
  emit()
  return true
}

/** Commits every waiting delete immediately (unmount). */
export function flushExpenseDeletes() {
  for (const id of [...pending.keys()]) runCommit(id)
}

/**
 * Commits every waiting delete with one keepalive request (page hide or
 * unload). `onConfirmed` receives the ids the server confirmed; a failed
 * request falls back to the regular commit, and the stored entries stay for
 * the next app load.
 */
export function flushExpenseDeletesOnHide(
  onConfirmed: (ids: string[]) => void
) {
  const waiting = [...pending.entries()].filter(
    ([, entry]) => entry.timer !== null
  )
  if (waiting.length === 0) return
  const targets = waiting.map(([id, entry]) => ({
    id,
    entry,
    // A client id is the server id even before its insert returns.
    sendId: isTempId(id) ? serverId(id) : id,
    isSaved: !isPendingId(id),
  }))
  for (const { entry } of targets) {
    clearTimeout(entry.timer!)
    entry.timer = null
  }
  // The keepalive request may land after the next load has read the list,
  // or not at all; that load resends these deletes and hides them meanwhile.
  markStoredDue(
    targets.map((item) => item.id),
    Date.now()
  )
  // A temporary id has nothing to send yet: its regular commit waits for the
  // create to return.
  for (const { id, entry, sendId } of targets) {
    if (!sendId) entry.timer = setTimeout(() => runCommit(id), 0)
  }
  const sendable = targets.filter(
    (item): item is typeof item & { sendId: string } => Boolean(item.sendId)
  )
  if (sendable.length === 0) return

  void sendExpenseDeletes(sendable.map((item) => item.sendId)).then((ok) => {
    if (!ok) {
      for (const { id, entry } of sendable) {
        entry.timer = setTimeout(() => runCommit(id), 0)
      }
      return
    }
    // An insert still running may land after the delete. Its stored entry
    // stays, the delete is sent again once the insert returns, and a page
    // that unloads first resends it on the next load.
    const saved = sendable.filter((item) => item.isSaved)
    forgetStored(saved.flatMap((item) => [item.id, item.sendId]))
    for (const { id, sendId, isSaved } of sendable) {
      if (isSaved) continue
      void resolveId(id)
        .then(() => sendExpenseDeletes([sendId]))
        .then((resent) => {
          if (resent) forgetStored([id, sendId])
        })
        .catch(() => forgetStored([id, sendId]))
    }
    onConfirmed(sendable.map((item) => item.sendId))
    for (const { id, entry } of sendable) finish(id, entry)
  })
}

let recoveryStarted = false

/**
 * Sends again the stored deletes of an earlier page load that are past due,
 * once per page. They stay hidden until the server confirms them. Entries of
 * another tab that are still inside their undo window are left alone.
 */
export function recoverExpenseDeletes(
  onConfirmed: (ids: string[]) => void,
  now: number = Date.now()
) {
  if (recoveryStarted) return
  recoveryStarted = true
  const due = readStored()
    .filter((item) => item.dueAt <= now && !pending.has(item.id))
    .map((item) => item.id)
    .filter((id) => !isTempId(id))
  if (due.length === 0) return
  due.forEach((id) => recovering.add(id))
  emit()
  void sendExpenseDeletes(due).then((ok) => {
    if (ok) {
      forgetStored(due)
      onConfirmed(due)
    }
    due.forEach((id) => recovering.delete(id))
    emit()
  })
}

/** Test helper: forget waiting deletes and allow another recovery. */
export function resetPendingExpenseDeletes() {
  for (const entry of pending.values()) {
    if (entry.timer !== null) clearTimeout(entry.timer)
  }
  pending.clear()
  recovering.clear()
  recoveryStarted = false
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// A temporary id that gets its stored id must hide the stored row too.
subscribePendingIds(() => {
  if (pending.size > 0) emit()
})

const getSnapshot = () => snapshot
const getServerSnapshot = () => EMPTY

export function usePendingExpenseDeleteIds(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
