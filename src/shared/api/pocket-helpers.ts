import { and, eq } from 'drizzle-orm'

import { db, pockets } from '@/shared/db'

export const POCKET_TRANSFER_CATEGORY = 'Перевод из кармана'
export const POCKET_TRANSFER_EMOJI = '↗️'

export function assertValidPocketPeriod(period: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new Error('Pocket period must use YYYY-MM format')
  }
}

export function assertValidOperationDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Operation date must use YYYY-MM-DD format')
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`)
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new Error('Operation date is invalid')
  }
}

export function assertValidOperationAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Operation amount must be a positive finite number')
  }
}

export function assertValidPocketBudget(amount: number): void {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Pocket budget must be a non-negative finite number')
  }
}

export function normalizePocketName(name: string): string {
  const normalizedName = name.trim()
  if (normalizedName.length === 0 || normalizedName.length > 80) {
    throw new Error('Pocket name must contain 1 to 80 characters')
  }
  return normalizedName
}

export async function getPocketForUser(pocketId: string, userId: string) {
  const [pocket] = await db
    .select({
      id: pockets.id,
      userId: pockets.userId,
      name: pockets.name,
      archivedAt: pockets.archivedAt,
      createdAt: pockets.createdAt,
    })
    .from(pockets)
    .where(and(eq(pockets.id, pocketId), eq(pockets.userId, userId)))

  if (!pocket) {
    throw new Error('Pocket not found')
  }

  return pocket
}

export async function assertCanUsePocket(
  pocketId: string,
  userId: string
): Promise<void> {
  const pocket = await getPocketForUser(pocketId, userId)
  if (pocket.archivedAt) {
    throw new Error('Pocket is archived')
  }
}
