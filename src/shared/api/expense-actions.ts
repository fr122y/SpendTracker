'use server'

import { and, eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { db, expenses } from '@/shared/db'

import type { Expense } from '@/shared/types'

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function getExpenses(): Promise<Expense[]> {
  const userId = await getUserId()

  const rows = await db
    .select({
      id: expenses.id,
      description: expenses.description,
      amount: expenses.amount,
      date: expenses.date,
      category: expenses.category,
      emoji: expenses.emoji,
      projectId: expenses.projectId,
    })
    .from(expenses)
    .where(eq(expenses.userId, userId))

  return rows.map((row) => ({
    ...row,
    projectId: row.projectId ?? undefined,
  }))
}

export async function addExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
  const userId = await getUserId()
  const id = crypto.randomUUID()

  await db.insert(expenses).values({
    id,
    userId,
    description: data.description,
    amount: data.amount,
    date: data.date,
    category: data.category,
    emoji: data.emoji,
    projectId: data.projectId ?? null,
  })

  return { id, ...data }
}

export async function deleteExpense(id: string): Promise<void> {
  const userId = await getUserId()

  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, 'id'>>
): Promise<void> {
  const userId = await getUserId()

  const patch: Partial<{
    description: string
    amount: number
    date: string
    category: string
    emoji: string
    projectId: string | null
  }> = {}

  if (data.description !== undefined) patch.description = data.description
  if (data.amount !== undefined) patch.amount = data.amount
  if (data.date !== undefined) patch.date = data.date
  if (data.category !== undefined) patch.category = data.category
  if (data.emoji !== undefined) patch.emoji = data.emoji
  if (data.projectId !== undefined) patch.projectId = data.projectId ?? null

  if (Object.keys(patch).length === 0) return

  await db
    .update(expenses)
    .set(patch)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
}
