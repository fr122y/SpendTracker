'use server'

import { and, eq } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import { db, expenses } from '@/shared/db'

import type { Expense } from '@/shared/types'

const PROJECT_MONEY_CATEGORY = 'Проектные деньги'
const PROJECT_MONEY_EMOJI = '💼'

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
      operationType: expenses.operationType,
    })
    .from(expenses)
    .where(eq(expenses.userId, userId))

  return rows.map((row) => ({
    ...row,
    projectId: row.projectId ?? undefined,
    operationType: row.operationType as Expense['operationType'],
  }))
}

export async function addExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
  const userId = await getUserId()
  const id = crypto.randomUUID()
  const operationType = data.operationType ?? 'expense'
  const isProjectMovement = operationType !== 'expense'

  if (isProjectMovement && !data.projectId) {
    throw new Error('Project operation requires projectId')
  }

  await db.insert(expenses).values({
    id,
    userId,
    description: data.description,
    amount: data.amount,
    date: data.date,
    category: isProjectMovement ? PROJECT_MONEY_CATEGORY : data.category,
    emoji: isProjectMovement ? PROJECT_MONEY_EMOJI : data.emoji,
    projectId: data.projectId ?? null,
    operationType,
  })

  return {
    id,
    ...data,
    category: isProjectMovement ? PROJECT_MONEY_CATEGORY : data.category,
    emoji: isProjectMovement ? PROJECT_MONEY_EMOJI : data.emoji,
    operationType,
  }
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
    operationType: Expense['operationType']
  }> = {}

  if (data.description !== undefined) patch.description = data.description
  if (data.amount !== undefined) patch.amount = data.amount
  if (data.date !== undefined) patch.date = data.date
  if (data.category !== undefined) patch.category = data.category
  if (data.emoji !== undefined) patch.emoji = data.emoji
  if (data.projectId !== undefined) patch.projectId = data.projectId ?? null
  if (data.operationType !== undefined) {
    if (data.operationType !== 'expense' && !data.projectId) {
      throw new Error('Project operation requires projectId')
    }
    patch.operationType = data.operationType
  }

  if (Object.keys(patch).length === 0) return

  await db
    .update(expenses)
    .set(patch)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
}
