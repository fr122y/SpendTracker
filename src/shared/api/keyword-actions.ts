'use server'

import { and, eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { categories, db, keywordMappings } from '@/shared/db'

import type { KeywordMapping } from '@/shared/types'

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

export async function getKeywordMappings(): Promise<KeywordMapping[]> {
  const userId = await getUserId()

  return db
    .select({
      id: keywordMappings.id,
      keyword: keywordMappings.keyword,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
    })
    .from(keywordMappings)
    .innerJoin(categories, eq(keywordMappings.categoryId, categories.id))
    .where(eq(keywordMappings.userId, userId))
}

export async function saveKeywordMapping(
  keyword: string,
  categoryId: string
): Promise<KeywordMapping> {
  const userId = await getUserId()
  const normalizedKeyword = normalizeKeyword(keyword)

  if (!normalizedKeyword) {
    throw new Error('Keyword is required')
  }

  const inserted = await db
    .insert(keywordMappings)
    .values({
      id: crypto.randomUUID(),
      userId,
      keyword: normalizedKeyword,
      categoryId,
    })
    .onConflictDoUpdate({
      target: [keywordMappings.userId, keywordMappings.keyword],
      set: { categoryId },
    })
    .returning({ id: keywordMappings.id })

  const [row] = await db
    .select({
      id: keywordMappings.id,
      keyword: keywordMappings.keyword,
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

  await db
    .delete(keywordMappings)
    .where(and(eq(keywordMappings.id, id), eq(keywordMappings.userId, userId)))
}
