'use server'

import { and, eq, inArray, isNull, or } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import {
  db,
  categories,
  expenses,
  sharedBudgetMembers,
  sharedBudgets,
  users,
} from '@/shared/db'

import {
  assertCanUsePocket,
  assertValidOperationAmount,
  assertValidOperationDate,
  POCKET_TRANSFER_CATEGORY,
  POCKET_TRANSFER_EMOJI,
  getPocketForUser,
} from './pocket-helpers'
import {
  assertCanManageSharedBudgetExpense,
  assertCanUseSharedBudget,
} from './shared-budget-actions'
import { getSharedCategoryForExpense } from './shared-category-actions'

import type { AddExpenseInput, Expense } from '@/shared/types'

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
      pocketId: expenses.pocketId,
      sharedBudgetId: expenses.sharedBudgetId,
      sharedBudgetCategoryId: expenses.sharedBudgetCategoryId,
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
    pocketId: row.pocketId ?? undefined,
    sharedBudgetId: row.sharedBudgetId ?? undefined,
    sharedBudgetCategoryId: row.sharedBudgetCategoryId ?? undefined,
    authorName: row.authorName ?? undefined,
    sharedBudgetName: row.sharedBudgetName ?? undefined,
    operationType: row.operationType as Expense['operationType'],
  }))
}

export async function addExpense(data: AddExpenseInput): Promise<Expense> {
  const userId = await getUserId()
  assertValidOperationAmount(data.amount)
  assertValidOperationDate(data.date)
  if (!data.description.trim()) {
    throw new Error('Operation comment is required')
  }
  const id = crypto.randomUUID()
  const operationType = data.operationType ?? 'expense'
  const isProjectMovement =
    operationType === 'project_withdrawal' || operationType === 'project_return'
  const isPocketTransfer = operationType === 'pocket_transfer'
  const isSharedExpense = Boolean(data.sharedBudgetId)

  if (isProjectMovement && !data.projectId) {
    throw new Error('Project operation requires projectId')
  }

  if (isPocketTransfer && !data.pocketId) {
    throw new Error('Pocket transfer requires pocketId')
  }

  if (
    data.pocketId &&
    (data.projectId || data.sharedBudgetId || isProjectMovement)
  ) {
    throw new Error(
      'Pocket operations cannot be linked to projects or shared budgets'
    )
  }

  if (isSharedExpense && (data.projectId || isProjectMovement)) {
    throw new Error('Shared expenses cannot be linked to project operations')
  }

  if (data.sharedBudgetId) {
    await assertCanUseSharedBudget(data.sharedBudgetId, userId)
  }

  if (data.pocketId) {
    await assertCanUsePocket(data.pocketId, userId)
  }

  if (isSharedExpense && !data.sharedBudgetCategoryId) {
    throw new Error('Shared expenses require a shared category')
  }

  const sharedCategory =
    isSharedExpense && data.sharedBudgetId && data.sharedBudgetCategoryId
      ? await getSharedCategoryForExpense(
          data.sharedBudgetId,
          data.sharedBudgetCategoryId,
          userId
        )
      : undefined

  let pocketCategory: { name: string; emoji: string } | undefined
  if (data.pocketId && !isPocketTransfer) {
    if (!data.category?.trim()) {
      throw new Error('Pocket purchases require a category')
    }
    const [category] = await db
      .select({ name: categories.name, emoji: categories.emoji })
      .from(categories)
      .where(
        and(eq(categories.userId, userId), eq(categories.name, data.category))
      )
    if (!category) {
      throw new Error('Pocket purchase category not found')
    }
    pocketCategory = category
  }

  if (
    !isProjectMovement &&
    !isPocketTransfer &&
    (!data.category?.trim() || !data.emoji?.trim())
  ) {
    throw new Error('Expense category and emoji are required')
  }

  const category = isPocketTransfer
    ? POCKET_TRANSFER_CATEGORY
    : (sharedCategory?.name ?? pocketCategory?.name ?? data.category!)
  const emoji = isPocketTransfer
    ? POCKET_TRANSFER_EMOJI
    : (sharedCategory?.emoji ?? pocketCategory?.emoji ?? data.emoji!)

  await db.insert(expenses).values({
    id,
    userId,
    description: data.description,
    amount: data.amount,
    date: data.date,
    category: isProjectMovement ? PROJECT_MONEY_CATEGORY : category,
    emoji: isProjectMovement ? PROJECT_MONEY_EMOJI : emoji,
    projectId: data.projectId ?? null,
    pocketId: data.pocketId ?? null,
    sharedBudgetId: data.sharedBudgetId ?? null,
    sharedBudgetCategoryId: data.sharedBudgetCategoryId ?? null,
    operationType,
  })

  return {
    id,
    ...data,
    category: isProjectMovement ? PROJECT_MONEY_CATEGORY : category,
    emoji: isProjectMovement ? PROJECT_MONEY_EMOJI : emoji,
    sharedBudgetId: data.sharedBudgetId,
    sharedBudgetCategoryId: data.sharedBudgetCategoryId,
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
      pocketId: expenses.pocketId,
      sharedBudgetId: expenses.sharedBudgetId,
      sharedBudgetCategoryId: expenses.sharedBudgetCategoryId,
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

  if (existing.pocketId) {
    await getPocketForUser(existing.pocketId, userId)
  }

  if (
    data.sharedBudgetId !== undefined &&
    (data.sharedBudgetId ?? null) !== (existing.sharedBudgetId ?? null)
  ) {
    throw new Error('Expense budget scope cannot be changed')
  }

  if (
    data.sharedBudgetCategoryId !== undefined &&
    (data.sharedBudgetCategoryId ?? null) !==
      (existing.sharedBudgetCategoryId ?? null)
  ) {
    throw new Error('Expense shared category cannot be changed')
  }

  if (
    existing.sharedBudgetId &&
    (data.category !== undefined || data.emoji !== undefined)
  ) {
    throw new Error('Shared expense category metadata cannot be changed')
  }

  const nextOperationType = data.operationType ?? existing.operationType
  const nextProjectId =
    data.projectId !== undefined ? data.projectId : existing.projectId
  const nextSharedBudgetId = existing.sharedBudgetId

  if (
    existing.pocketId &&
    (data.pocketId !== undefined ||
      data.operationType !== undefined ||
      data.projectId !== undefined)
  ) {
    throw new Error('Pocket operation type and link cannot be changed')
  }

  if (
    data.pocketId !== undefined &&
    (data.pocketId ?? null) !== (existing.pocketId ?? null)
  ) {
    throw new Error('Expense pocket scope cannot be changed')
  }

  if (
    existing.pocketId &&
    (nextOperationType === 'pocket_transfer' ||
      existing.operationType === 'pocket_transfer')
  ) {
    if (data.category !== undefined || data.emoji !== undefined) {
      throw new Error('Pocket transfer category metadata cannot be changed')
    }
  }

  if (data.amount !== undefined) {
    if (
      existing.pocketId &&
      existing.operationType === 'pocket_transfer' &&
      Number.isFinite(data.amount) &&
      data.amount >= 0
    ) {
      // A reduced transfer is the return event; zero represents a full return.
    } else {
      assertValidOperationAmount(data.amount)
    }
  }
  if (data.date !== undefined) assertValidOperationDate(data.date)
  if (data.description !== undefined && !data.description.trim()) {
    throw new Error('Operation comment is required')
  }

  if (
    nextSharedBudgetId &&
    (nextProjectId || nextOperationType !== 'expense')
  ) {
    throw new Error('Shared expenses cannot be linked to project operations')
  }

  if (data.operationType === 'pocket_transfer' && !existing.pocketId) {
    throw new Error('Pocket transfer requires an existing pocket link')
  }

  if (existing.pocketId && data.category !== undefined) {
    const [category] = await db
      .select({ name: categories.name, emoji: categories.emoji })
      .from(categories)
      .where(
        and(eq(categories.userId, userId), eq(categories.name, data.category))
      )
    if (!category) {
      throw new Error('Pocket purchase category not found')
    }
    data = { ...data, category: category.name, emoji: category.emoji }
  }

  const patch: Partial<{
    description: string
    amount: number
    date: string
    category: string
    emoji: string
    projectId: string | null
    sharedBudgetCategoryId: string | null
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
