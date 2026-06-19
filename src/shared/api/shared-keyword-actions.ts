'use server'

import { and, eq, isNull } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import {
  db,
  sharedBudgetCategories,
  sharedBudgetKeywordMappings,
} from '@/shared/db'

import { assertCanUseSharedBudget } from './shared-budget-actions'

import type { SharedKeywordMapping } from '@/shared/types'

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase()
}

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function getSharedKeywordMappings(
  sharedBudgetId: string
): Promise<SharedKeywordMapping[]> {
  const userId = await getUserId()
  await assertCanUseSharedBudget(sharedBudgetId, userId)

  return db
    .select({
      id: sharedBudgetKeywordMappings.id,
      keyword: sharedBudgetKeywordMappings.keyword,
      categoryId: sharedBudgetCategories.id,
      categoryName: sharedBudgetCategories.name,
      categoryEmoji: sharedBudgetCategories.emoji,
    })
    .from(sharedBudgetKeywordMappings)
    .innerJoin(
      sharedBudgetCategories,
      eq(
        sharedBudgetKeywordMappings.sharedBudgetCategoryId,
        sharedBudgetCategories.id
      )
    )
    .where(
      and(
        eq(sharedBudgetKeywordMappings.sharedBudgetId, sharedBudgetId),
        eq(sharedBudgetCategories.sharedBudgetId, sharedBudgetId),
        isNull(sharedBudgetCategories.archivedAt)
      )
    )
}

export async function saveSharedKeywordMapping(
  sharedBudgetId: string,
  keyword: string,
  sharedBudgetCategoryId: string
): Promise<SharedKeywordMapping> {
  const userId = await getUserId()
  await assertCanUseSharedBudget(sharedBudgetId, userId)

  const normalizedKeyword = normalizeKeyword(keyword)
  if (!normalizedKeyword) {
    throw new Error('Keyword is required')
  }

  const [category] = await db
    .select({
      id: sharedBudgetCategories.id,
      name: sharedBudgetCategories.name,
      emoji: sharedBudgetCategories.emoji,
    })
    .from(sharedBudgetCategories)
    .where(
      and(
        eq(sharedBudgetCategories.id, sharedBudgetCategoryId),
        eq(sharedBudgetCategories.sharedBudgetId, sharedBudgetId),
        isNull(sharedBudgetCategories.archivedAt)
      )
    )

  if (!category) {
    throw new Error('Shared category not found')
  }

  const inserted = await db
    .insert(sharedBudgetKeywordMappings)
    .values({
      id: crypto.randomUUID(),
      sharedBudgetId,
      keyword: normalizedKeyword,
      sharedBudgetCategoryId,
    })
    .onConflictDoUpdate({
      target: [
        sharedBudgetKeywordMappings.sharedBudgetId,
        sharedBudgetKeywordMappings.keyword,
      ],
      set: { sharedBudgetCategoryId },
    })
    .returning({ id: sharedBudgetKeywordMappings.id })

  const [row] = await db
    .select({
      id: sharedBudgetKeywordMappings.id,
      keyword: sharedBudgetKeywordMappings.keyword,
      categoryId: sharedBudgetCategories.id,
      categoryName: sharedBudgetCategories.name,
      categoryEmoji: sharedBudgetCategories.emoji,
    })
    .from(sharedBudgetKeywordMappings)
    .innerJoin(
      sharedBudgetCategories,
      eq(
        sharedBudgetKeywordMappings.sharedBudgetCategoryId,
        sharedBudgetCategories.id
      )
    )
    .where(
      and(
        eq(sharedBudgetKeywordMappings.id, inserted[0].id),
        eq(sharedBudgetKeywordMappings.sharedBudgetId, sharedBudgetId)
      )
    )

  if (!row) {
    throw new Error('Failed to save shared keyword mapping')
  }

  return row
}
