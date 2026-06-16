'use server'

import { createHash, randomBytes } from 'crypto'

import { and, eq, isNull } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import {
  db,
  sharedBudgetInvites,
  sharedBudgetMembers,
  sharedBudgets,
} from '@/shared/db'

import type {
  SharedBudgetInvitePreview,
  SharedBudgetInviteResult,
} from '@/shared/types'

const INVITE_TTL_DAYS = 7

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function getInviteOrigin(): string {
  const configuredOrigin = process.env.APP_ORIGIN?.trim()

  if (configuredOrigin) {
    return new URL(configuredOrigin).origin
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000'
  }

  throw new Error('APP_ORIGIN is required to generate invite URLs')
}

function createInviteUrl(token: string): string {
  return `${getInviteOrigin()}/invite/${encodeURIComponent(token)}`
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

async function getInviteByToken(token: string): Promise<
  | {
      id: string
      sharedBudgetId: string
      sharedBudgetName: string
      archivedAt: Date | null
      expiresAt: Date
      acceptedAt: Date | null
    }
  | undefined
> {
  const tokenHash = hashInviteToken(token)
  const [invite] = await db
    .select({
      id: sharedBudgetInvites.id,
      sharedBudgetId: sharedBudgetInvites.sharedBudgetId,
      sharedBudgetName: sharedBudgets.name,
      archivedAt: sharedBudgets.archivedAt,
      expiresAt: sharedBudgetInvites.expiresAt,
      acceptedAt: sharedBudgetInvites.acceptedAt,
    })
    .from(sharedBudgetInvites)
    .innerJoin(
      sharedBudgets,
      eq(sharedBudgetInvites.sharedBudgetId, sharedBudgets.id)
    )
    .where(eq(sharedBudgetInvites.tokenHash, tokenHash))
    .limit(1)

  return invite
}

async function isBudgetMember(
  sharedBudgetId: string,
  userId: string
): Promise<boolean> {
  const [membership] = await db
    .select({ sharedBudgetId: sharedBudgetMembers.sharedBudgetId })
    .from(sharedBudgetMembers)
    .where(
      and(
        eq(sharedBudgetMembers.sharedBudgetId, sharedBudgetId),
        eq(sharedBudgetMembers.userId, userId)
      )
    )
    .limit(1)

  return Boolean(membership)
}

export async function createSharedBudgetInvite(
  sharedBudgetId: string
): Promise<SharedBudgetInviteResult> {
  const userId = await getUserId()
  const [membership] = await db
    .select({
      role: sharedBudgetMembers.role,
      archivedAt: sharedBudgets.archivedAt,
    })
    .from(sharedBudgetMembers)
    .innerJoin(
      sharedBudgets,
      eq(sharedBudgetMembers.sharedBudgetId, sharedBudgets.id)
    )
    .where(
      and(
        eq(sharedBudgetMembers.sharedBudgetId, sharedBudgetId),
        eq(sharedBudgetMembers.userId, userId)
      )
    )
    .limit(1)

  if (!membership || membership.role !== 'owner') {
    throw new Error('Only the shared budget owner can create invite links')
  }

  if (membership.archivedAt) {
    throw new Error('Shared budget is archived')
  }

  const token = randomBytes(32).toString('base64url')
  const expiresAt = addDays(new Date(), INVITE_TTL_DAYS)

  await db.insert(sharedBudgetInvites).values({
    id: crypto.randomUUID(),
    sharedBudgetId,
    createdByUserId: userId,
    tokenHash: hashInviteToken(token),
    expiresAt,
  })

  return {
    inviteUrl: createInviteUrl(token),
    expiresAt: expiresAt.toISOString(),
  }
}

export async function getSharedBudgetInvitePreview(
  token: string
): Promise<SharedBudgetInvitePreview> {
  const invite = await getInviteByToken(token)

  if (!invite) {
    return { status: 'invalid' }
  }

  if (invite.acceptedAt) {
    return { status: 'used', sharedBudgetName: invite.sharedBudgetName }
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    return { status: 'expired', sharedBudgetName: invite.sharedBudgetName }
  }

  if (invite.archivedAt) {
    return { status: 'archived', sharedBudgetName: invite.sharedBudgetName }
  }

  const session = await auth()
  const userId = session?.user?.id

  if (userId && (await isBudgetMember(invite.sharedBudgetId, userId))) {
    return {
      status: 'duplicate-member',
      sharedBudgetName: invite.sharedBudgetName,
    }
  }

  return { status: 'valid', sharedBudgetName: invite.sharedBudgetName }
}

export async function acceptSharedBudgetInvite(
  token: string
): Promise<SharedBudgetInvitePreview> {
  const userId = await getUserId()
  const invite = await getInviteByToken(token)

  if (!invite) {
    return { status: 'invalid' }
  }

  if (invite.acceptedAt) {
    return { status: 'used', sharedBudgetName: invite.sharedBudgetName }
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    return { status: 'expired', sharedBudgetName: invite.sharedBudgetName }
  }

  if (invite.archivedAt) {
    return { status: 'archived', sharedBudgetName: invite.sharedBudgetName }
  }

  if (await isBudgetMember(invite.sharedBudgetId, userId)) {
    return {
      status: 'duplicate-member',
      sharedBudgetName: invite.sharedBudgetName,
    }
  }

  const accepted = await db.transaction(async (tx) => {
    const acceptedRows = await tx
      .update(sharedBudgetInvites)
      .set({
        acceptedAt: new Date(),
        acceptedByUserId: userId,
      })
      .where(
        and(
          eq(sharedBudgetInvites.id, invite.id),
          isNull(sharedBudgetInvites.acceptedAt)
        )
      )
      .returning({ id: sharedBudgetInvites.id })

    if (acceptedRows.length === 0) {
      return false
    }

    await tx.insert(sharedBudgetMembers).values({
      sharedBudgetId: invite.sharedBudgetId,
      userId,
      role: 'member',
      isActive: false,
    })

    return true
  })

  if (!accepted) {
    return { status: 'used', sharedBudgetName: invite.sharedBudgetName }
  }

  return { status: 'accepted', sharedBudgetName: invite.sharedBudgetName }
}
