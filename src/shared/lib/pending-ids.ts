/**
 * Ids of records whose create request has not finished yet.
 *
 * An optimistic row is shown at once, but the server does not know it until
 * the create returns. Every operation that targets such a row, or refers to
 * it, awaits {@link resolveId} first and runs with the stored id, so no
 * request ever carries a temporary `temp-` id or overtakes the insert.
 */

export const TEMP_ID_PREFIX = 'temp-'

export function createTempId(): string {
  return `${TEMP_ID_PREFIX}${crypto.randomUUID()}`
}

export function isTempId(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith(TEMP_ID_PREFIX)
}

/** The record an operation waited for was never saved. */
export class PendingIdLostError extends Error {
  constructor(readonly id: string) {
    super('The record was not saved')
    this.name = 'PendingIdLostError'
  }
}

export function isPendingIdLostError(error: unknown): boolean {
  return error instanceof PendingIdLostError
}

type Settled = { realId: string } | { lost: true }

interface Entry {
  promise: Promise<string>
  settled: Settled | null
}

const entries = new Map<string, Entry>()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export interface PendingIdHandle {
  resolve: (realId: string) => void
  reject: () => void
}

/**
 * Marks `id` as waiting for its create request. Call `resolve` with the stored
 * id when the create succeeds and `reject` when it fails.
 */
export function trackPendingId(id: string): PendingIdHandle {
  let resolvePromise!: (realId: string) => void
  let rejectPromise!: (error: Error) => void
  const promise = new Promise<string>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
  // Nobody may wait for it; an unobserved rejection must not be reported.
  promise.catch(() => undefined)
  const entry: Entry = { promise, settled: null }
  entries.set(id, entry)

  return {
    resolve: (realId) => {
      if (entry.settled) return
      entry.settled = { realId }
      resolvePromise(realId)
      // A client id that became the stored id needs no mapping.
      if (realId === id && entries.get(id) === entry) entries.delete(id)
      emit()
    },
    reject: () => {
      if (entry.settled) return
      entry.settled = { lost: true }
      rejectPromise(new PendingIdLostError(id))
      emit()
    },
  }
}

/** Whether `id` names a record that the server has not stored yet. */
export function isPendingId(id: string | null | undefined): boolean {
  if (!id) return false
  const entry = entries.get(id)
  if (entry) return entry.settled === null
  return isTempId(id)
}

/** The stored id for `id` when it is already known. */
export function getKnownId(id: string): string | undefined {
  const entry = entries.get(id)
  if (entry?.settled && 'realId' in entry.settled) return entry.settled.realId
  if (entry || isTempId(id)) return undefined
  return id
}

/**
 * Resolves to the stored id of `id`: at once for a saved record, after the
 * create returns for a pending one. Rejects with {@link PendingIdLostError}
 * when the create failed or a temporary id is unknown.
 */
export function resolveId(id: string): Promise<string> {
  const entry = entries.get(id)
  if (entry) {
    if (entry.settled && 'realId' in entry.settled) {
      return Promise.resolve(entry.settled.realId)
    }
    return entry.promise
  }
  if (isTempId(id)) return Promise.reject(new PendingIdLostError(id))
  return Promise.resolve(id)
}

/** Resolves the listed id fields of `input`; absent fields are kept. */
export async function resolveIdFields<T extends object, K extends keyof T>(
  input: T,
  keys: readonly K[]
): Promise<T> {
  const resolved = { ...input }
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'string' && value) {
      resolved[key] = (await resolveId(value)) as T[K]
    }
  }
  return resolved
}

/** Replaces the id of one row of a cached list, keeping its other fields. */
export function replaceRecordId<T extends { id: string }>(
  list: T[] | undefined,
  fromId: string,
  toId: string
): T[] | undefined {
  if (!list || fromId === toId) return list
  return list.map((item) => (item.id === fromId ? { ...item, id: toId } : item))
}

/** Called whenever a pending id settles. */
export function subscribePendingIds(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Test helper: forget every tracked id. */
export function resetPendingIds() {
  entries.clear()
}
