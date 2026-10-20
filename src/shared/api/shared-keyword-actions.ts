'use server'

import { and, eq, isNull } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import {
  db,
  sharedBudgetCategories,
  sharedBudgetKeywordMappings,
} from '@/shared/db'
import { normalizeKeywordPhrase } from '@/shared/lib/keyword-phrase'

import { assertCanUseSharedBudget } from './shared-budget-actions'
import { isUnsavedRecordId } from './unsaved-record'

import type { KeywordMatchType, SharedKeywordMapping } from '@/shared/types'

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
  if (isUnsavedRecordId(sharedBudgetId)) return []
  await assertCanUseSharedBudget(sharedBudgetId, userId)

  return db
    .select({
      id: sharedBudgetKeywordMappings.id,
      keyword: sharedBudgetKeywordMappings.keyword,
      matchType: sharedBudgetKeywordMappings.matchType,
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
  sharedBudgetCategoryId: string,
  matchType: KeywordMatchType = 'exact'
): Promise<SharedKeywordMapping> {
  const userId = await getUserId()
  await assertCanUseSharedBudget(sharedBudgetId, userId)

  const normalizedKeyword = normalizeKeywordPhrase(keyword)
  if (!normalizedKeyword) {
    throw new Error('Keyword is required')
  }
  if (matchType !== 'exact' && matchType !== 'fuzzy') {
    throw new Error('Invalid match type')
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
      matchType,
    })
    .onConflictDoUpdate({
      target: [
        sharedBudgetKeywordMappings.sharedBudgetId,
        sharedBudgetKeywordMappings.keyword,
      ],
      set: { sharedBudgetCategoryId, matchType },
    })
    .returning({ id: sharedBudgetKeywordMappings.id })

  const [row] = await db
    .select({
      id: sharedBudgetKeywordMappings.id,
      keyword: sharedBudgetKeywordMappings.keyword,
      matchType: sharedBudgetKeywordMappings.matchType,
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

export async function deleteSharedKeywordMapping(
  sharedBudgetId: string,
  id: string
): Promise<void> {
  const userId = await getUserId()
  if (isUnsavedRecordId(sharedBudgetId) || isUnsavedRecordId(id)) return
  await assertCanUseSharedBudget(sharedBudgetId, userId)

  await db
    .delete(sharedBudgetKeywordMappings)
    .where(
      and(
        eq(sharedBudgetKeywordMappings.id, id),
        eq(sharedBudgetKeywordMappings.sharedBudgetId, sharedBudgetId)
      )
    )
}
