import { processAccountEmailOutbox } from '@/shared/lib/account-email-outbox'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = await processAccountEmailOutbox()

  return new Response(JSON.stringify({ success: true, ...result }), {
    headers: {
      'content-type': 'application/json',
    },
  })
}
