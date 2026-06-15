'use server'

import { and, eq, isNull } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { db, sharedBudgetCategories } from '@/shared/db'

import { assertCanUseSharedBudget } from './shared-budget-actions'

import type { SharedBudgetCategory } from '@/shared/types'

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

function requireValidCategory(data: { name: string; emoji: string }): {
  name: string
  emoji: string
} {
  const name = data.name.trim()
  const emoji = data.emoji.trim()

  if (!name) {
    throw new Error('Shared category name is required')
  }

  if (!emoji) {
    throw new Error('Shared category emoji is required')
  }

  return { name, emoji }
}

function mapSharedCategory(row: {
  id: string
  sharedBudgetId: string
  name: string
  emoji: string
  archivedAt: Date | null
  createdAt: Date
}): SharedBudgetCategory {
  return {
    id: row.id,
    sharedBudgetId: row.sharedBudgetId,
    name: row.name,
    emoji: row.emoji,
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

async function getCategoryForActiveMember(
  id: string,
  userId: string
): Promise<SharedBudgetCategory> {
  const [category] = await db
    .select({
      id: sharedBudgetCategories.id,
      sharedBudgetId: sharedBudgetCategories.sharedBudgetId,
      name: sharedBudgetCategories.name,
      emoji: sharedBudgetCategories.emoji,
      archivedAt: sharedBudgetCategories.archivedAt,
      createdAt: sharedBudgetCategories.createdAt,
    })
    .from(sharedBudgetCategories)
    .where(eq(sharedBudgetCategories.id, id))

  if (!category) {
    throw new Error('Shared category not found')
  }

  await assertCanUseSharedBudget(category.sharedBudgetId, userId)

  return mapSharedCategory(category)
}

export async function getSharedBudgetCategories(
  sharedBudgetId: string
): Promise<SharedBudgetCategory[]> {
  const userId = await getUserId()
  await assertCanUseSharedBudget(sharedBudgetId, userId)

  const rows = await db
    .select({
      id: sharedBudgetCategories.id,
      sharedBudgetId: sharedBudgetCategories.sharedBudgetId,
      name: sharedBudgetCategories.name,
      emoji: sharedBudgetCategories.emoji,
      archivedAt: sharedBudgetCategories.archivedAt,
      createdAt: sharedBudgetCategories.createdAt,
    })
    .from(sharedBudgetCategories)
    .where(
      and(
        eq(sharedBudgetCategories.sharedBudgetId, sharedBudgetId),
        isNull(sharedBudgetCategories.archivedAt)
      )
    )

  return rows.map(mapSharedCategory)
}

export async function addSharedBudgetCategory(
  sharedBudgetId: string,
  data: { name: string; emoji: string }
): Promise<SharedBudgetCategory> {
  const userId = await getUserId()
  await assertCanUseSharedBudget(sharedBudgetId, userId)

  const category = requireValidCategory(data)
  const id = crypto.randomUUID()

  await db.insert(sharedBudgetCategories).values({
    id,
    sharedBudgetId,
    name: category.name,
    emoji: category.emoji,
  })

  const [created] = await db
    .select({
      id: sharedBudgetCategories.id,
      sharedBudgetId: sharedBudgetCategories.sharedBudgetId,
      name: sharedBudgetCategories.name,
      emoji: sharedBudgetCategories.emoji,
      archivedAt: sharedBudgetCategories.archivedAt,
      createdAt: sharedBudgetCategories.createdAt,
    })
    .from(sharedBudgetCategories)
    .where(eq(sharedBudgetCategories.id, id))

  if (!created) {
    throw new Error('Shared category not found')
  }

  return mapSharedCategory(created)
}

export async function updateSharedBudgetCategory(
  id: string,
  data: { name: string; emoji: string }
): Promise<void> {
  const userId = await getUserId()
  const category = await getCategoryForActiveMember(id, userId)

  if (category.archivedAt) {
    throw new Error('Shared category is archived')
  }

  const nextCategory = requireValidCategory(data)

  await db
    .update(sharedBudgetCategories)
    .set({
      name: nextCategory.name,
      emoji: nextCategory.emoji,
    })
    .where(eq(sharedBudgetCategories.id, id))
}

export async function archiveSharedBudgetCategory(id: string): Promise<void> {
  const userId = await getUserId()
  const category = await getCategoryForActiveMember(id, userId)

  if (category.archivedAt) return

  await db
    .update(sharedBudgetCategories)
    .set({ archivedAt: new Date() })
    .where(eq(sharedBudgetCategories.id, id))
}

export async function getSharedCategoryForExpense(
  sharedBudgetId: string,
  categoryId: string,
  userId: string
): Promise<{ name: string; emoji: string }> {
  await assertCanUseSharedBudget(sharedBudgetId, userId)

  const [category] = await db
    .select({
      name: sharedBudgetCategories.name,
      emoji: sharedBudgetCategories.emoji,
    })
    .from(sharedBudgetCategories)
    .where(
      and(
        eq(sharedBudgetCategories.id, categoryId),
        eq(sharedBudgetCategories.sharedBudgetId, sharedBudgetId),
        isNull(sharedBudgetCategories.archivedAt)
      )
    )

  if (!category) {
    throw new Error('Shared category not found')
  }

  return category
}
