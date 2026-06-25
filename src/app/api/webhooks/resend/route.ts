import {
  AccountEmailWebhookError,
  processResendAccountEmailWebhook,
} from '@/shared/lib/account-email-webhooks'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const payload = await request.text()

  try {
    const result = await processResendAccountEmailWebhook({
      payload,
      headers: request.headers,
    })

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: {
        'content-type': 'application/json',
      },
    })
  } catch (error) {
    if (error instanceof AccountEmailWebhookError) {
      return new Response('Invalid webhook', { status: 400 })
    }

    console.error('Resend account email webhook failed', error)

    return new Response('Internal Server Error', { status: 500 })
  }
}
