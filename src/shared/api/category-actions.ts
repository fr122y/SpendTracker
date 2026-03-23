'use server'

import { and, eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { categories, db } from '@/shared/db'

import type { Category } from '@/shared/types'

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function getCategories(): Promise<Category[]> {
  const userId = await getUserId()

  return db
    .select({
      id: categories.id,
      name: categories.name,
      emoji: categories.emoji,
    })
    .from(categories)
    .where(eq(categories.userId, userId))
}

export async function addCategory(
  data: Omit<Category, 'id'>
): Promise<Category> {
  const userId = await getUserId()
  const id = crypto.randomUUID()

  await db.insert(categories).values({
    id,
    userId,
    name: data.name,
    emoji: data.emoji,
  })

  return { id, ...data }
}

export async function deleteCategory(id: string): Promise<void> {
  const userId = await getUserId()

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
}
