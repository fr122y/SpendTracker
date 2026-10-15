'use server'

import { and, asc, desc, eq, isNull, lt } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { db, pocketMonthBudgets, pockets, users } from '@/shared/db'
import { findPocketNameConflict } from '@/shared/lib/pocket-name'

import {
  assertCanUsePocket,
  assertValidPocketBudget,
  assertValidPocketPeriod,
  getPocketForUser,
  normalizePocketName,
} from './pocket-helpers'

import type { Pocket, PocketMonthBudget } from '@/shared/types'

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

function mapPocket(row: {
  id: string
  name: string
  archivedAt: Date | null
  createdAt: Date
}): Pocket {
  return {
    id: row.id,
    name: row.name,
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

function mapPocketMonthBudget(row: PocketMonthBudget): PocketMonthBudget {
  return {
    pocketId: row.pocketId,
    period: row.period,
    budget: row.budget,
  }
}

export async function getPockets(): Promise<Pocket[]> {
  const userId = await getUserId()
  const rows = await db
    .select({
      id: pockets.id,
      name: pockets.name,
      archivedAt: pockets.archivedAt,
      createdAt: pockets.createdAt,
    })
    .from(pockets)
    .where(eq(pockets.userId, userId))
    .orderBy(asc(pockets.createdAt), asc(pockets.name))

  return rows.map(mapPocket)
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** A rejected name: an active pocket of the user already uses it. */
export type PocketNameConflict = {
  status: 'name_conflict'
  conflictingName: string
}

export type CreatePocketResult =
  | { status: 'created'; pocket: Pocket }
  | PocketNameConflict

export type RenamePocketResult =
  | { status: 'renamed'; pocket: Pocket }
  | PocketNameConflict

/**
 * Runs a pocket name change under a per-user lock. Locking the user row
 * serializes concurrent create, rename, and restore calls of one user, so the
 * second call sees the first one's committed name. The database itself does
 * not enforce the rule yet (T-058): a write that bypasses these actions can
 * still create a duplicate active name.
 */
function withPocketNameLock<T>(
  userId: string,
  callback: (transaction: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (transaction) => {
    await transaction
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .for('update')
    return callback(transaction)
  })
}

async function findActivePocketNameConflict(
  transaction: Transaction,
  userId: string,
  name: string,
  excludePocketId?: string
): Promise<PocketNameConflict | null> {
  const activePockets = await transaction
    .select({ id: pockets.id, name: pockets.name })
    .from(pockets)
    .where(and(eq(pockets.userId, userId), isNull(pockets.archivedAt)))
  const conflict = findPocketNameConflict(activePockets, name, excludePocketId)

  return conflict
    ? { status: 'name_conflict', conflictingName: conflict.name }
    : null
}

/**
 * Creates an active pocket. A name already used by another active pocket
 * (trimmed, case-insensitive) is returned as `name_conflict` rather than
 * thrown, because production builds hide server action error messages.
 */
export async function createPocket(name: string): Promise<CreatePocketResult> {
  const userId = await getUserId()
  const normalizedName = normalizePocketName(name)

  return withPocketNameLock(userId, async (transaction) => {
    const conflict = await findActivePocketNameConflict(
      transaction,
      userId,
      normalizedName
    )
    if (conflict) return conflict

    const [row] = await transaction
      .insert(pockets)
      .values({ id: crypto.randomUUID(), userId, name: normalizedName })
      .returning({
        id: pockets.id,
        name: pockets.name,
        archivedAt: pockets.archivedAt,
        createdAt: pockets.createdAt,
      })

    if (!row) {
      throw new Error('Pocket could not be created')
    }

    return { status: 'created', pocket: mapPocket(row) }
  })
}

/** Renames an active pocket; a name conflict is returned like in `createPocket`. */
export async function renamePocket(
  pocketId: string,
  name: string
): Promise<RenamePocketResult> {
  const userId = await getUserId()
  const normalizedName = normalizePocketName(name)

  return withPocketNameLock(userId, async (transaction) => {
    const conflict = await findActivePocketNameConflict(
      transaction,
      userId,
      normalizedName,
      pocketId
    )
    if (conflict) return conflict

    const [row] = await transaction
      .update(pockets)
      .set({ name: normalizedName })
      .where(
        and(
          eq(pockets.id, pocketId),
          eq(pockets.userId, userId),
          isNull(pockets.archivedAt)
        )
      )
      .returning({
        id: pockets.id,
        name: pockets.name,
        archivedAt: pockets.archivedAt,
        createdAt: pockets.createdAt,
      })

    if (!row) {
      throw new Error('Active pocket not found')
    }

    return { status: 'renamed', pocket: mapPocket(row) }
  })
}

export async function archivePocket(pocketId: string): Promise<void> {
  const userId = await getUserId()
  const [row] = await db
    .update(pockets)
    .set({ archivedAt: new Date() })
    .where(
      and(
        eq(pockets.id, pocketId),
        eq(pockets.userId, userId),
        isNull(pockets.archivedAt)
      )
    )
    .returning({ id: pockets.id })

  if (row) return

  const pocket = await getPocketForUser(pocketId, userId)
  if (!pocket.archivedAt) {
    throw new Error('Pocket could not be archived')
  }
}

export type RestorePocketResult =
  | { status: 'restored'; pocket: Pocket }
  | PocketNameConflict

/**
 * Returns an archived pocket to the active list. A conflict with an active
 * pocket of the same name (trimmed, case-insensitive) is returned as a result
 * rather than thrown, because production builds hide server action error
 * messages from the client.
 */
export async function restorePocket(
  pocketId: string
): Promise<RestorePocketResult> {
  const userId = await getUserId()
  const pocket = await getPocketForUser(pocketId, userId)

  if (!pocket.archivedAt) {
    return { status: 'restored', pocket: mapPocket(pocket) }
  }

  return withPocketNameLock(userId, async (transaction) => {
    const conflict = await findActivePocketNameConflict(
      transaction,
      userId,
      pocket.name,
      pocketId
    )
    if (conflict) return conflict

    const [row] = await transaction
      .update(pockets)
      .set({ archivedAt: null })
      .where(and(eq(pockets.id, pocketId), eq(pockets.userId, userId)))
      .returning({
        id: pockets.id,
        name: pockets.name,
        archivedAt: pockets.archivedAt,
        createdAt: pockets.createdAt,
      })

    if (!row) {
      throw new Error('Pocket could not be restored')
    }

    return { status: 'restored', pocket: mapPocket(row) }
  })
}

export async function getPocketMonthBudgets(
  pocketId: string
): Promise<PocketMonthBudget[]> {
  const userId = await getUserId()
  await getPocketForUser(pocketId, userId)
  const rows = await db
    .select()
    .from(pocketMonthBudgets)
    .where(eq(pocketMonthBudgets.pocketId, pocketId))
    .orderBy(asc(pocketMonthBudgets.period))

  return rows.map(mapPocketMonthBudget)
}

export async function initializePocketMonthBudget(
  pocketId: string,
  period: string
): Promise<PocketMonthBudget | null> {
  const userId = await getUserId()
  assertValidPocketPeriod(period)

  const [existingBudget] = await db
    .select({
      pocketId: pocketMonthBudgets.pocketId,
      period: pocketMonthBudgets.period,
      budget: pocketMonthBudgets.budget,
    })
    .from(pocketMonthBudgets)
    .innerJoin(pockets, eq(pockets.id, pocketMonthBudgets.pocketId))
    .where(
      and(
        eq(pockets.id, pocketId),
        eq(pockets.userId, userId),
        eq(pocketMonthBudgets.pocketId, pocketId),
        eq(pocketMonthBudgets.period, period)
      )
    )
    .limit(1)

  if (existingBudget) {
    return mapPocketMonthBudget(existingBudget)
  }

  return db.transaction(async (transaction) => {
    const [pocket] = await transaction
      .select({ id: pockets.id, archivedAt: pockets.archivedAt })
      .from(pockets)
      .where(and(eq(pockets.id, pocketId), eq(pockets.userId, userId)))
      .for('update')

    if (!pocket) {
      throw new Error('Pocket not found')
    }

    const [existing] = await transaction
      .select()
      .from(pocketMonthBudgets)
      .where(
        and(
          eq(pocketMonthBudgets.pocketId, pocketId),
          eq(pocketMonthBudgets.period, period)
        )
      )

    if (existing) {
      return mapPocketMonthBudget(existing)
    }

    if (pocket.archivedAt) {
      return null
    }

    const [previous] = await transaction
      .select({ budget: pocketMonthBudgets.budget })
      .from(pocketMonthBudgets)
      .where(
        and(
          eq(pocketMonthBudgets.pocketId, pocketId),
          lt(pocketMonthBudgets.period, period)
        )
      )
      .orderBy(desc(pocketMonthBudgets.period))
      .limit(1)

    const [created] = await transaction
      .insert(pocketMonthBudgets)
      .values({
        pocketId,
        period,
        budget: previous?.budget ?? 0,
      })
      .onConflictDoNothing({
        target: [pocketMonthBudgets.pocketId, pocketMonthBudgets.period],
      })
      .returning()

    if (created) {
      return mapPocketMonthBudget(created)
    }

    const [concurrentResult] = await transaction
      .select()
      .from(pocketMonthBudgets)
      .where(
        and(
          eq(pocketMonthBudgets.pocketId, pocketId),
          eq(pocketMonthBudgets.period, period)
        )
      )

    if (!concurrentResult) {
      throw new Error('Pocket month budget could not be initialized')
    }

    return mapPocketMonthBudget(concurrentResult)
  })
}

export async function setPocketMonthBudget(
  pocketId: string,
  period: string,
  budget: number
): Promise<PocketMonthBudget> {
  const userId = await getUserId()
  assertValidPocketPeriod(period)
  assertValidPocketBudget(budget)
  await assertCanUsePocket(pocketId, userId)

  const [row] = await db
    .update(pocketMonthBudgets)
    .set({ budget })
    .where(
      and(
        eq(pocketMonthBudgets.pocketId, pocketId),
        eq(pocketMonthBudgets.period, period)
      )
    )
    .returning()

  if (!row) {
    throw new Error('Pocket month budget not found')
  }

  return mapPocketMonthBudget(row)
}
