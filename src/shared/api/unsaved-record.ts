/**
 * Optimistic rows carry a `temp-` id until their create returns. The client
 * waits for the stored id (`@/shared/lib/pending-ids`), so such an id reaching
 * the server is a client bug. Server actions answer it without an error — a
 * thrown error is an HTTP 500 — and change nothing: no stored record has it.
 */
export function isUnsavedRecordId(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith('temp-')
}

/** Returned by actions whose result names a status, for a `temp-` id. */
export interface UnsavedRecordResult {
  status: 'unsaved_record'
}
