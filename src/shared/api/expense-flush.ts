import { auth } from '@/shared/auth'

import { deleteExpenseForUser } from './expense-delete'
import { isUnsavedRecordId } from './unsaved-record'

export const MAX_FLUSH_EXPENSE_IDS = 100

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface FlushExpenseDeletesResponse {
  deleted: string[]
  skipped: string[]
}

export interface FlushRequest {
  url: string
  headers: { get(name: string): string | null }
  json(): Promise<unknown>
}

export interface FlushResult {
  status: number
  body: FlushExpenseDeletesResponse | { error: string }
}

function json(body: FlushResult['body'], status = 200): FlushResult {
  return { status, body }
}

function parseIds(body: unknown): string[] | null {
  if (typeof body !== 'object' || body === null) return null
  const ids = (body as { ids?: unknown }).ids
  if (!Array.isArray(ids) || ids.length > MAX_FLUSH_EXPENSE_IDS) return null
  if (!ids.every((id) => typeof id === 'string')) return null
  return ids as string[]
}

/**
 * Deletes the listed expenses of the signed-in user. Temporary, malformed,
 * foreign, and missing ids are skipped without an error, and a repeated
 * request is safe. The same guards as `deleteExpense` apply per id.
 */
export async function flushExpenseDeletes(
  request: FlushRequest
): Promise<FlushResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return json({ error: 'unauthorized' }, 401)

  // A cross-site page cannot send JSON without a preflight, and a browser
  // names the origin of a keepalive POST.
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: 'forbidden' }, 403)
  }
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'unsupported_media_type' }, 415)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }
  const ids = parseIds(body)
  if (!ids) return json({ error: 'invalid_body' }, 400)

  const result: FlushExpenseDeletesResponse = { deleted: [], skipped: [] }
  for (const id of new Set(ids)) {
    if (isUnsavedRecordId(id) || !UUID_PATTERN.test(id)) {
      result.skipped.push(id)
      continue
    }
    try {
      const outcome = await deleteExpenseForUser(id.toLowerCase(), userId)
      if (outcome.status === 'deleted') result.deleted.push(id)
      else result.skipped.push(id)
    } catch {
      // Another user's record or an archived pocket: nothing to delete here.
      result.skipped.push(id)
    }
  }

  return json(result)
}
