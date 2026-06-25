import 'server-only'

import { eq } from 'drizzle-orm'

import { accountEmailSuppressions, db } from '@/shared/db'

export type AccountEmailSuppressionReason =
  | 'bounced'
  | 'complained'
  | 'suppressed'

export type SuppressAccountEmailRecipientInput = {
  email: string
  reason: AccountEmailSuppressionReason
  source: string
  providerMessageId?: string
  now?: Date
}

export function normalizeAccountEmailRecipient(email: string): string {
  return email.trim().toLowerCase()
}

export async function isAccountEmailSuppressed(
  email: string
): Promise<boolean> {
  const normalizedEmail = normalizeAccountEmailRecipient(email)

  if (!normalizedEmail) {
    return false
  }

  const rows = await db
    .select({ email: accountEmailSuppressions.email })
    .from(accountEmailSuppressions)
    .where(eq(accountEmailSuppressions.email, normalizedEmail))
    .limit(1)

  return rows.length > 0
}

export async function suppressAccountEmailRecipient(
  input: SuppressAccountEmailRecipientInput
): Promise<void> {
  const now = input.now ?? new Date()
  const email = normalizeAccountEmailRecipient(input.email)

  if (!email) {
    return
  }

  await db
    .insert(accountEmailSuppressions)
    .values({
      email,
      reason: input.reason,
      source: input.source,
      providerMessageId: input.providerMessageId,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: accountEmailSuppressions.email,
      set: {
        reason: input.reason,
        source: input.source,
        providerMessageId: input.providerMessageId ?? null,
        updatedAt: now,
      },
    })
}
