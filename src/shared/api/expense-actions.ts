'use server'

import { and, eq, inArray, isNull, or } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import {
  db,
  expenses,
  sharedBudgetMembers,
  sharedBudgets,
  users,
} from '@/shared/db'

import {
  assertCanManageSharedBudgetExpense,
  assertCanUseSharedBudget,
} from './shared-budget-actions'

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
  const memberships = await db
    .select({ sharedBudgetId: sharedBudgetMembers.sharedBudgetId })
    .from(sharedBudgetMembers)
    .where(eq(sharedBudgetMembers.userId, userId))
  const sharedBudgetIds = memberships.map((item) => item.sharedBudgetId)
  const personalExpenseScope = and(
    eq(expenses.userId, userId),
    isNull(expenses.sharedBudgetId)
  )
  const expenseScope =
    sharedBudgetIds.length > 0
      ? or(
          personalExpenseScope,
          inArray(expenses.sharedBudgetId, sharedBudgetIds)
        )
      : personalExpenseScope

  const rows = await db
    .select({
      id: expenses.id,
      authorUserId: expenses.userId,
      authorName: users.name,
      description: expenses.description,
      amount: expenses.amount,
      date: expenses.date,
      category: expenses.category,
      emoji: expenses.emoji,
      projectId: expenses.projectId,
      sharedBudgetId: expenses.sharedBudgetId,
      sharedBudgetName: sharedBudgets.name,
      operationType: expenses.operationType,
    })
    .from(expenses)
    .leftJoin(users, eq(expenses.userId, users.id))
    .leftJoin(sharedBudgets, eq(expenses.sharedBudgetId, sharedBudgets.id))
    .where(expenseScope)

  return rows.map((row) => ({
    ...row,
    projectId: row.projectId ?? undefined,
    sharedBudgetId: row.sharedBudgetId ?? undefined,
    authorName: row.authorName ?? undefined,
    sharedBudgetName: row.sharedBudgetName ?? undefined,
    operationType: row.operationType as Expense['operationType'],
  }))
}

export async function addExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
  const userId = await getUserId()
  const id = crypto.randomUUID()
  const operationType = data.operationType ?? 'expense'
  const isProjectMovement = operationType !== 'expense'
  const isSharedExpense = Boolean(data.sharedBudgetId)

  if (isProjectMovement && !data.projectId) {
    throw new Error('Project operation requires projectId')
  }

  if (isSharedExpense && (data.projectId || isProjectMovement)) {
    throw new Error('Shared expenses cannot be linked to project operations')
  }

  if (data.sharedBudgetId) {
    await assertCanUseSharedBudget(data.sharedBudgetId, userId)
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
    sharedBudgetId: data.sharedBudgetId ?? null,
    operationType,
  })

  return {
    id,
    ...data,
    category: isProjectMovement ? PROJECT_MONEY_CATEGORY : data.category,
    emoji: isProjectMovement ? PROJECT_MONEY_EMOJI : data.emoji,
    sharedBudgetId: data.sharedBudgetId,
    authorUserId: userId,
    operationType,
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const userId = await getUserId()
  const [expense] = await db
    .select({
      userId: expenses.userId,
      sharedBudgetId: expenses.sharedBudgetId,
    })
    .from(expenses)
    .where(eq(expenses.id, id))

  if (!expense) return

  if (expense.sharedBudgetId) {
    await assertCanManageSharedBudgetExpense(expense.sharedBudgetId, userId)
  } else if (expense.userId !== userId) {
    throw new Error('Expense not found')
  }

  await db.delete(expenses).where(eq(expenses.id, id))
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, 'id'>>
): Promise<void> {
  const userId = await getUserId()
  const [existing] = await db
    .select({
      userId: expenses.userId,
      projectId: expenses.projectId,
      sharedBudgetId: expenses.sharedBudgetId,
      operationType: expenses.operationType,
    })
    .from(expenses)
    .where(eq(expenses.id, id))

  if (!existing) return

  if (existing.sharedBudgetId) {
    await assertCanManageSharedBudgetExpense(existing.sharedBudgetId, userId)
  } else if (existing.userId !== userId) {
    throw new Error('Expense not found')
  }

  if (
    data.sharedBudgetId !== undefined &&
    (data.sharedBudgetId ?? null) !== (existing.sharedBudgetId ?? null)
  ) {
    throw new Error('Expense budget scope cannot be changed')
  }

  const nextOperationType = data.operationType ?? existing.operationType
  const nextProjectId =
    data.projectId !== undefined ? data.projectId : existing.projectId
  const nextSharedBudgetId = existing.sharedBudgetId

  if (
    nextSharedBudgetId &&
    (nextProjectId || nextOperationType !== 'expense')
  ) {
    throw new Error('Shared expenses cannot be linked to project operations')
  }

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
    if (data.operationType !== 'expense' && !nextProjectId) {
      throw new Error('Project operation requires projectId')
    }
    patch.operationType = data.operationType
  }

  if (Object.keys(patch).length === 0) return

  await db.update(expenses).set(patch).where(eq(expenses.id, id))
}
