'use server'

import { and, eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { categories, db, keywordMappings } from '@/shared/db'
import { normalizeKeywordPhrase } from '@/shared/lib/keyword-phrase'

import { isUnsavedRecordId } from './unsaved-record'

import type { KeywordMapping, KeywordMatchType } from '@/shared/types'

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function getKeywordMappings(): Promise<KeywordMapping[]> {
  const userId = await getUserId()

  return db
    .select({
      id: keywordMappings.id,
      keyword: keywordMappings.keyword,
      matchType: keywordMappings.matchType,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
    })
    .from(keywordMappings)
    .innerJoin(categories, eq(keywordMappings.categoryId, categories.id))
    .where(eq(keywordMappings.userId, userId))
}

/**
 * Upserts the user's rule for a phrase. A manual category choice saves an
 * `exact` rule, which replaces any earlier rule with the same phrase.
 */
export async function saveKeywordMapping(
  keyword: string,
  categoryId: string,
  matchType: KeywordMatchType = 'exact'
): Promise<KeywordMapping> {
  const userId = await getUserId()
  const normalizedKeyword = normalizeKeywordPhrase(keyword)

  if (!normalizedKeyword) {
    throw new Error('Keyword is required')
  }
  if (matchType !== 'exact' && matchType !== 'fuzzy') {
    throw new Error('Invalid match type')
  }

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))

  if (!category) {
    throw new Error('Category not found')
  }

  const inserted = await db
    .insert(keywordMappings)
    .values({
      id: crypto.randomUUID(),
      userId,
      keyword: normalizedKeyword,
      categoryId,
      matchType,
    })
    .onConflictDoUpdate({
      target: [keywordMappings.userId, keywordMappings.keyword],
      set: { categoryId, matchType },
    })
    .returning({ id: keywordMappings.id })

  const [row] = await db
    .select({
      id: keywordMappings.id,
      keyword: keywordMappings.keyword,
      matchType: keywordMappings.matchType,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
    })
    .from(keywordMappings)
    .innerJoin(categories, eq(keywordMappings.categoryId, categories.id))
    .where(
      and(
        eq(keywordMappings.id, inserted[0].id),
        eq(keywordMappings.userId, userId)
      )
    )

  if (!row) {
    throw new Error('Failed to save keyword mapping')
  }

  return row
}

export async function deleteKeywordMapping(id: string): Promise<void> {
  const userId = await getUserId()
  if (isUnsavedRecordId(id)) return

  await db
    .delete(keywordMappings)
    .where(and(eq(keywordMappings.id, id), eq(keywordMappings.userId, userId)))
}
