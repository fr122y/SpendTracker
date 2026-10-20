import 'server-only'

import { eq, lt, sql } from 'drizzle-orm'

import { db, revokedSessions, users } from '@/shared/db'

export interface StoredSessionState {
  sessionVersion: number
  revoked: boolean
}

/**
 * One query: the user's session version and whether this session id was
 * revoked. `null` when the user no longer exists.
 */
export async function readSessionState(
  userId: string,
  sid: string
): Promise<StoredSessionState | null> {
  const [row] = await db
    .select({
      sessionVersion: users.sessionVersion,
      revoked: sql<boolean>`exists (select 1 from ${revokedSessions} where ${revokedSessions.sid} = ${sid})`,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return row ?? null
}

export async function readSessionVersion(
  userId: string
): Promise<number | null> {
  const [row] = await db
    .select({ sessionVersion: users.sessionVersion })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return row?.sessionVersion ?? null
}

/**
 * Records a signed-out session id until its token expires, and drops rows
 * whose tokens have expired anyway.
 */
export async function insertRevokedSession(
  sid: string,
  userId: string,
  expiresAt: Date
): Promise<void> {
  await db
    .insert(revokedSessions)
    .values({ sid, userId, expiresAt })
    .onConflictDoNothing()
  await db
    .delete(revokedSessions)
    .where(lt(revokedSessions.expiresAt, sql`now()`))
}

/** Every token of the user issued before this call stops working. */
export function nextSessionVersion() {
  return sql<number>`${users.sessionVersion} + 1`
}
