import 'server-only'

import { eq } from 'drizzle-orm'
import { Resend, type WebhookEventPayload } from 'resend'

import { accountEmailEvents, accountEmailMessages, db } from '@/shared/db'

import {
  normalizeAccountEmailRecipient,
  suppressAccountEmailRecipient,
  type AccountEmailSuppressionReason,
} from './account-email-suppression'

type ResendAccountEmailEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.failed'
  | 'email.bounced'
  | 'email.complained'
  | 'email.suppressed'

type ResendAccountEmailEvent = Extract<
  WebhookEventPayload,
  { type: ResendAccountEmailEventType }
>

export type ProcessResendAccountEmailWebhookResult = {
  status: 'processed' | 'ignored' | 'duplicate'
  type: string
}

export class AccountEmailWebhookError extends Error {
  constructor(
    public readonly code: 'configuration_error' | 'signature_error',
    message: string
  ) {
    super(message)
    this.name = 'AccountEmailWebhookError'
  }
}

const HANDLED_ACCOUNT_EMAIL_EVENTS = new Set<string>([
  'email.sent',
  'email.delivered',
  'email.delivery_delayed',
  'email.failed',
  'email.bounced',
  'email.complained',
  'email.suppressed',
])

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function getRequiredWebhookSecret(): string {
  if (!isNonEmptyString(process.env.RESEND_WEBHOOK_SECRET)) {
    throw new AccountEmailWebhookError(
      'configuration_error',
      'RESEND_WEBHOOK_SECRET is required to verify Resend webhooks'
    )
  }

  return process.env.RESEND_WEBHOOK_SECRET
}

function getRequiredHeader(headers: Headers, name: string): string {
  const value = headers.get(name)

  if (!isNonEmptyString(value)) {
    throw new AccountEmailWebhookError(
      'signature_error',
      `Missing Resend webhook header: ${name}`
    )
  }

  return value
}

function verifyResendWebhookPayload(
  payload: string,
  headers: Headers
): WebhookEventPayload {
  const webhookSecret = getRequiredWebhookSecret()
  const resend = new Resend()

  try {
    return resend.webhooks.verify({
      payload,
      headers: {
        id: getRequiredHeader(headers, 'svix-id'),
        timestamp: getRequiredHeader(headers, 'svix-timestamp'),
        signature: getRequiredHeader(headers, 'svix-signature'),
      },
      webhookSecret,
    })
  } catch (error) {
    if (error instanceof AccountEmailWebhookError) {
      throw error
    }

    throw new AccountEmailWebhookError(
      'signature_error',
      'Invalid Resend webhook signature'
    )
  }
}

function isHandledAccountEmailEvent(
  event: WebhookEventPayload
): event is ResendAccountEmailEvent {
  return (
    HANDLED_ACCOUNT_EMAIL_EVENTS.has(event.type) &&
    'data' in event &&
    typeof event.data === 'object' &&
    event.data !== null &&
    'email_id' in event.data &&
    typeof event.data.email_id === 'string'
  )
}

function parseEventDate(value: string, fallback: Date): Date {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date
}

function getRecipientEmail(event: ResendAccountEmailEvent): string {
  const [email] = event.data.to
  return normalizeAccountEmailRecipient(email ?? '')
}

function getEventStatus(event: ResendAccountEmailEvent): string {
  switch (event.type) {
    case 'email.sent':
      return 'sent'
    case 'email.delivered':
      return 'delivered'
    case 'email.delivery_delayed':
      return 'delivery_delayed'
    case 'email.failed':
      return 'failed'
    case 'email.bounced':
      return 'bounced'
    case 'email.complained':
      return 'complained'
    case 'email.suppressed':
      return 'suppressed'
  }
}

function getSuppressionReason(
  event: ResendAccountEmailEvent
): AccountEmailSuppressionReason | null {
  switch (event.type) {
    case 'email.bounced':
      return 'bounced'
    case 'email.complained':
      return 'complained'
    case 'email.suppressed':
      return 'suppressed'
    default:
      return null
  }
}

function getEventReason(event: ResendAccountEmailEvent): string | null {
  switch (event.type) {
    case 'email.failed':
      return event.data.failed.reason
    case 'email.bounced':
      return event.data.bounce.message
    case 'email.suppressed':
      return event.data.suppressed.message
    case 'email.complained':
      return 'Recipient marked the email as spam'
    default:
      return null
  }
}

async function findAccountEmailMessageId(
  providerMessageId: string
): Promise<string | null> {
  const [message] = await db
    .select({ id: accountEmailMessages.id })
    .from(accountEmailMessages)
    .where(eq(accountEmailMessages.providerMessageId, providerMessageId))
    .limit(1)

  return message?.id ?? null
}

async function updateAccountEmailMessageDeliveryState(input: {
  messageId: string
  status: string
  reason: string | null
  now: Date
}): Promise<void> {
  await db
    .update(accountEmailMessages)
    .set({
      status: input.status,
      lastError: input.reason,
      updatedAt: input.now,
    })
    .where(eq(accountEmailMessages.id, input.messageId))
}

export async function processResendAccountEmailWebhook(input: {
  payload: string
  headers: Headers
  now?: Date
}): Promise<ProcessResendAccountEmailWebhookResult> {
  const now = input.now ?? new Date()
  const event = verifyResendWebhookPayload(input.payload, input.headers)

  if (!isHandledAccountEmailEvent(event)) {
    return { status: 'ignored', type: event.type }
  }

  const providerEventId = getRequiredHeader(input.headers, 'svix-id')
  const providerMessageId = event.data.email_id
  const recipientEmail = getRecipientEmail(event)
  const reason = getEventReason(event)
  const accountEmailMessageId =
    await findAccountEmailMessageId(providerMessageId)

  const inserted = await db
    .insert(accountEmailEvents)
    .values({
      provider: 'resend',
      providerEventId,
      type: event.type,
      providerMessageId,
      recipientEmail,
      accountEmailMessageId,
      payloadJson: event,
      reason,
      createdAt: parseEventDate(event.created_at, now),
      receivedAt: now,
    })
    .onConflictDoNothing({
      target: accountEmailEvents.providerEventId,
    })
    .returning({ id: accountEmailEvents.id })

  if (inserted.length === 0) {
    return { status: 'duplicate', type: event.type }
  }

  if (accountEmailMessageId) {
    await updateAccountEmailMessageDeliveryState({
      messageId: accountEmailMessageId,
      status: getEventStatus(event),
      reason,
      now,
    })
  }

  const suppressionReason = getSuppressionReason(event)

  if (suppressionReason) {
    await suppressAccountEmailRecipient({
      email: recipientEmail,
      reason: suppressionReason,
      source: 'resend_webhook',
      providerMessageId,
      now,
    })
  }

  return { status: 'processed', type: event.type }
}
