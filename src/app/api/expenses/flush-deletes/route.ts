import { flushExpenseDeletes } from '@/shared/api/expense-flush'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Commits deferred expense deletes that a page sends while it unloads, with
 * `fetch(..., { keepalive: true })`. A Server Action started from `pagehide`
 * does not complete, so this is the one write path that survives a reload or
 * a closed tab. See ADR 0003.
 */
export async function POST(request: Request) {
  const { status, body } = await flushExpenseDeletes(request)
  return Response.json(body, { status })
}
