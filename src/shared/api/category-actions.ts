'use server'

import { and, count, eq, isNull } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { categories, db, expenses } from '@/shared/db'
import {
  normalizeCategoryUpdate,
  type CategoryUpdate,
} from '@/shared/lib/category-update'

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
      color: categories.color,
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

function personalExpensesInCategory(userId: string, categoryName: string) {
  return and(
    eq(expenses.userId, userId),
    isNull(expenses.sharedBudgetId),
    eq(expenses.category, categoryName)
  )
}

export async function countCategoryExpenses(
  categoryId: string
): Promise<number> {
  const userId = await getUserId()

  const [category] = await db
    .select({ name: categories.name })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
  if (!category) {
    throw new Error('Category not found')
  }

  const [row] = await db
    .select({ value: count() })
    .from(expenses)
    .where(personalExpensesInCategory(userId, category.name))

  return Number(row?.value ?? 0)
}

export async function deleteCategoryWithReassign(
  categoryId: string,
  targetCategoryId: string
): Promise<{ moved: number }> {
  const userId = await getUserId()

  if (categoryId === targetCategoryId) {
    throw new Error('Target category must differ from the deleted one')
  }

  return db.transaction(async (tx) => {
    const owned = await tx
      .select({
        id: categories.id,
        name: categories.name,
        emoji: categories.emoji,
      })
      .from(categories)
      .where(eq(categories.userId, userId))

    const category = owned.find((item) => item.id === categoryId)
    const target = owned.find((item) => item.id === targetCategoryId)
    if (!category) {
      throw new Error('Category not found')
    }
    if (!target) {
      throw new Error('Target category not found')
    }
    if (owned.length <= 1) {
      throw new Error('Cannot delete the last category')
    }

    const moved = await tx
      .update(expenses)
      .set({ category: target.name, emoji: target.emoji })
      .where(personalExpensesInCategory(userId, category.name))
      .returning({ id: expenses.id })

    // keyword_mapping rows go by ON DELETE CASCADE on categoryId.
    await tx
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))

    return { moved: moved.length }
  })
}

export async function updateCategory(
  categoryId: string,
  data: CategoryUpdate
): Promise<Category> {
  const userId = await getUserId()
  const update = normalizeCategoryUpdate(data)

  return db.transaction(async (tx) => {
    const owned = await tx
      .select({
        id: categories.id,
        name: categories.name,
        emoji: categories.emoji,
        color: categories.color,
      })
      .from(categories)
      .where(eq(categories.userId, userId))

    const category = owned.find((item) => item.id === categoryId)
    if (!category) {
      throw new Error('Category not found')
    }

    const next: Category = {
      id: category.id,
      name: update.name ?? category.name,
      emoji: update.emoji ?? category.emoji,
      color: update.color !== undefined ? update.color : category.color,
    }

    // The same case-insensitive rule as adding a category.
    const normalizedName = next.name.toLowerCase()
    if (
      owned.some(
        (item) =>
          item.id !== categoryId && item.name.toLowerCase() === normalizedName
      )
    ) {
      throw new Error('Category with this name already exists')
    }

    await tx
      .update(categories)
      .set({ name: next.name, emoji: next.emoji, color: next.color })
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))

    // Expenses keep a text copy of the category name and emoji, so a rename
    // moves the user's personal expenses with it. keyword_mapping rows point
    // at categoryId and stay valid.
    if (next.name !== category.name || next.emoji !== category.emoji) {
      await tx
        .update(expenses)
        .set({ category: next.name, emoji: next.emoji })
        .where(personalExpensesInCategory(userId, category.name))
    }

    return next
  })
}
