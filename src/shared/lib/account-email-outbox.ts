import 'server-only'

import { and, asc, eq, isNull, lte, or } from 'drizzle-orm'

import { accountEmailMessages, db } from '@/shared/db'

import {
  AccountEmailError,
  sendAccountEmail,
  validateAccountEmailInput,
  type SendAccountEmailInput,
} from './account-email'
import { isAccountEmailSuppressed } from './account-email-suppression'

type AccountEmailMessage = typeof accountEmailMessages.$inferSelect

export type EnqueueAccountEmailInput = SendAccountEmailInput & {
  userId?: string
}

export type ProcessAccountEmailOutboxResult = {
  processed: number
  sent: number
  retried: number
  failed: number
  suppressed: number
  skipped: number
}

const DEFAULT_PROCESS_LIMIT = 10
const MAX_ATTEMPTS = 5
const STALE_SENDING_MINUTES = 10
const RETRY_BACKOFF_MINUTES = [1, 5, 30, 120]

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function getNextRetryAt(now: Date, attemptsCount: number): Date {
  const backoffIndex = Math.max(0, attemptsCount - 1)
  const minutes =
    RETRY_BACKOFF_MINUTES[
      Math.min(backoffIndex, RETRY_BACKOFF_MINUTES.length - 1)
    ]

  return addMinutes(now, minutes)
}

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return 'Account email send failed'
  }

  const { message } = error as { message?: unknown }
  return typeof message === 'string' && message
    ? message
    : 'Account email send failed'
}

function isTerminalAccountEmailError(error: unknown): boolean {
  return (
    error instanceof AccountEmailError &&
    (error.code === 'invalid_input' || error.code === 'configuration_error')
  )
}

async function claimMessage(
  message: AccountEmailMessage,
  now: Date
): Promise<boolean> {
  const staleSendingCutoff = addMinutes(now, -STALE_SENDING_MINUTES)

  const claimed = await db
    .update(accountEmailMessages)
    .set({
      status: 'sending',
      updatedAt: now,
    })
    .where(
      and(
        eq(accountEmailMessages.id, message.id),
        or(
          eq(accountEmailMessages.status, 'pending'),
          and(
            eq(accountEmailMessages.status, 'sending'),
            lte(accountEmailMessages.updatedAt, staleSendingCutoff)
          )
        ),
        or(
          isNull(accountEmailMessages.nextRetryAt),
          lte(accountEmailMessages.nextRetryAt, now)
        )
      )
    )
    .returning({ id: accountEmailMessages.id })

  return claimed.length > 0
}

async function markMessageSent(
  message: AccountEmailMessage,
  now: Date
): Promise<void> {
  const result = await sendAccountEmail({
    type: message.type as SendAccountEmailInput['type'],
    to: message.recipientEmail,
    subject: message.subject,
    text: message.text,
    html: message.html,
    idempotencyKey: message.idempotencyKey,
    ...(message.replyTo ? { replyTo: message.replyTo } : {}),
  })

  await db
    .update(accountEmailMessages)
    .set({
      status: 'sent',
      provider: result.provider,
      providerMessageId:
        result.status === 'sent' ? result.providerMessageId : null,
      lastError: null,
      nextRetryAt: null,
      attemptsCount: message.attemptsCount + 1,
      sentAt: now,
      updatedAt: now,
    })
    .where(eq(accountEmailMessages.id, message.id))
}

async function markMessageSuppressed(
  message: AccountEmailMessage,
  now: Date
): Promise<void> {
  await db
    .update(accountEmailMessages)
    .set({
      status: 'suppressed',
      lastError: 'Account email recipient is suppressed',
      nextRetryAt: null,
      updatedAt: now,
    })
    .where(eq(accountEmailMessages.id, message.id))
}

async function markMessageFailed(
  message: AccountEmailMessage,
  error: unknown,
  now: Date
): Promise<'retried' | 'failed'> {
  const attemptsCount = message.attemptsCount + 1
  const shouldRetry =
    !isTerminalAccountEmailError(error) && attemptsCount < MAX_ATTEMPTS

  await db
    .update(accountEmailMessages)
    .set({
      status: shouldRetry ? 'pending' : 'failed',
      attemptsCount,
      lastError: getErrorMessage(error),
      nextRetryAt: shouldRetry ? getNextRetryAt(now, attemptsCount) : null,
      updatedAt: now,
    })
    .where(eq(accountEmailMessages.id, message.id))

  return shouldRetry ? 'retried' : 'failed'
}

export async function enqueueAccountEmail(
  input: EnqueueAccountEmailInput
): Promise<void> {
  validateAccountEmailInput(input)

  await db
    .insert(accountEmailMessages)
    .values({
      type: input.type,
      recipientEmail: input.to,
      userId: input.userId,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
      idempotencyKey: input.idempotencyKey,
    })
    .onConflictDoNothing({
      target: accountEmailMessages.idempotencyKey,
    })
}

export async function processAccountEmailOutbox(input?: {
  limit?: number
  now?: Date
}): Promise<ProcessAccountEmailOutboxResult> {
  const now = input?.now ?? new Date()
  const limit = input?.limit ?? DEFAULT_PROCESS_LIMIT
  const staleSendingCutoff = addMinutes(now, -STALE_SENDING_MINUTES)

  const messages = await db
    .select()
    .from(accountEmailMessages)
    .where(
      and(
        or(
          eq(accountEmailMessages.status, 'pending'),
          and(
            eq(accountEmailMessages.status, 'sending'),
            lte(accountEmailMessages.updatedAt, staleSendingCutoff)
          )
        ),
        or(
          isNull(accountEmailMessages.nextRetryAt),
          lte(accountEmailMessages.nextRetryAt, now)
        )
      )
    )
    .orderBy(asc(accountEmailMessages.createdAt))
    .limit(limit)

  const result: ProcessAccountEmailOutboxResult = {
    processed: 0,
    sent: 0,
    retried: 0,
    failed: 0,
    suppressed: 0,
    skipped: 0,
  }

  for (const message of messages) {
    const claimed = await claimMessage(message, now)

    if (!claimed) {
      result.skipped += 1
      continue
    }

    result.processed += 1

    try {
      if (await isAccountEmailSuppressed(message.recipientEmail)) {
        await markMessageSuppressed(message, now)
        result.suppressed += 1
        continue
      }

      await markMessageSent(message, now)
      result.sent += 1
    } catch (error) {
      const outcome = await markMessageFailed(message, error, now)
      result[outcome] += 1
    }
  }

  return result
}
