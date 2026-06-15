'use server'

import { and, asc, eq, inArray } from 'drizzle-orm'

import { auth } from '@/shared/auth'
import {
  categories,
  db,
  sharedBudgetCategories,
  sharedBudgetMembers,
  sharedBudgets,
  sharedBudgetWeeklyLimits,
  users,
} from '@/shared/db'

import type {
  CreateSharedBudgetInput,
  SharedBudget,
  SharedBudgetMember,
  SharedBudgetRole,
  SharedWeeklyLimitSetting,
} from '@/shared/types'

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

function requireValidBudgetName(name: string): string {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error('Shared budget name is required')
  }
  return trimmedName
}

function requireValidLimit(amount: number): void {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Shared weekly limit must be a non-negative number')
  }
}

function toIsoString(date: Date | null): string | undefined {
  return date ? date.toISOString() : undefined
}

async function getSharedBudgetForUser(
  sharedBudgetId: string,
  userId: string
): Promise<SharedBudget> {
  const budgets = await getSharedBudgetsForUser(userId, [sharedBudgetId])
  const budget = budgets[0]

  if (!budget) {
    throw new Error('Shared budget not found')
  }

  return budget
}

async function getSharedBudgetsForUser(
  userId: string,
  budgetIds?: string[]
): Promise<SharedBudget[]> {
  const whereClause =
    budgetIds && budgetIds.length > 0
      ? and(
          eq(sharedBudgetMembers.userId, userId),
          inArray(sharedBudgetMembers.sharedBudgetId, budgetIds)
        )
      : eq(sharedBudgetMembers.userId, userId)

  const budgetRows = await db
    .select({
      id: sharedBudgets.id,
      name: sharedBudgets.name,
      createdByUserId: sharedBudgets.createdByUserId,
      archivedAt: sharedBudgets.archivedAt,
      createdAt: sharedBudgets.createdAt,
      role: sharedBudgetMembers.role,
      isActive: sharedBudgetMembers.isActive,
    })
    .from(sharedBudgetMembers)
    .innerJoin(
      sharedBudgets,
      eq(sharedBudgetMembers.sharedBudgetId, sharedBudgets.id)
    )
    .where(whereClause)
    .orderBy(asc(sharedBudgets.createdAt))

  if (budgetRows.length === 0) {
    return []
  }

  const ids = budgetRows.map((budget) => budget.id)
  const memberRows = await db
    .select({
      sharedBudgetId: sharedBudgetMembers.sharedBudgetId,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: sharedBudgetMembers.role,
      isActive: sharedBudgetMembers.isActive,
      joinedAt: sharedBudgetMembers.joinedAt,
    })
    .from(sharedBudgetMembers)
    .innerJoin(users, eq(sharedBudgetMembers.userId, users.id))
    .where(inArray(sharedBudgetMembers.sharedBudgetId, ids))

  const limitRows = await db
    .select({
      sharedBudgetId: sharedBudgetWeeklyLimits.sharedBudgetId,
      effectiveWeekStart: sharedBudgetWeeklyLimits.effectiveWeekStart,
      amount: sharedBudgetWeeklyLimits.amount,
    })
    .from(sharedBudgetWeeklyLimits)
    .where(inArray(sharedBudgetWeeklyLimits.sharedBudgetId, ids))
    .orderBy(asc(sharedBudgetWeeklyLimits.effectiveWeekStart))

  const membersByBudgetId = new Map<string, SharedBudgetMember[]>()
  for (const member of memberRows) {
    const members = membersByBudgetId.get(member.sharedBudgetId) ?? []
    members.push({
      userId: member.userId,
      name: member.name ?? undefined,
      email: member.email ?? undefined,
      role: member.role as SharedBudgetRole,
      isActive: member.isActive,
      joinedAt: member.joinedAt.toISOString(),
    })
    membersByBudgetId.set(member.sharedBudgetId, members)
  }

  const limitsByBudgetId = new Map<string, SharedWeeklyLimitSetting[]>()
  for (const limit of limitRows) {
    const limits = limitsByBudgetId.get(limit.sharedBudgetId) ?? []
    limits.push({
      effectiveWeekStart: limit.effectiveWeekStart,
      amount: limit.amount,
    })
    limitsByBudgetId.set(limit.sharedBudgetId, limits)
  }

  return budgetRows.map((budget) => ({
    id: budget.id,
    name: budget.name,
    createdByUserId: budget.createdByUserId,
    archivedAt: toIsoString(budget.archivedAt),
    createdAt: budget.createdAt.toISOString(),
    role: budget.role as SharedBudgetRole,
    isActive: budget.isActive,
    members: membersByBudgetId.get(budget.id) ?? [],
    weeklyLimits: limitsByBudgetId.get(budget.id) ?? [],
  }))
}

async function requireMembership(
  sharedBudgetId: string,
  userId: string
): Promise<{
  role: SharedBudgetRole
  archivedAt: Date | null
}> {
  const [membership] = await db
    .select({
      role: sharedBudgetMembers.role,
      archivedAt: sharedBudgets.archivedAt,
    })
    .from(sharedBudgetMembers)
    .innerJoin(
      sharedBudgets,
      eq(sharedBudgetMembers.sharedBudgetId, sharedBudgets.id)
    )
    .where(
      and(
        eq(sharedBudgetMembers.sharedBudgetId, sharedBudgetId),
        eq(sharedBudgetMembers.userId, userId)
      )
    )

  if (!membership) {
    throw new Error('Shared budget not found')
  }

  return {
    role: membership.role as SharedBudgetRole,
    archivedAt: membership.archivedAt,
  }
}

async function requireActiveMembership(
  sharedBudgetId: string,
  userId: string
): Promise<{ role: SharedBudgetRole }> {
  const membership = await requireMembership(sharedBudgetId, userId)

  if (membership.archivedAt) {
    throw new Error('Shared budget is archived')
  }

  return { role: membership.role }
}

async function requireOwner(sharedBudgetId: string, userId: string) {
  const membership = await requireMembership(sharedBudgetId, userId)

  if (membership.role !== 'owner') {
    throw new Error('Only the shared budget owner can perform this action')
  }

  return membership
}

export async function getSharedBudgets(): Promise<SharedBudget[]> {
  const userId = await getUserId()
  return getSharedBudgetsForUser(userId)
}

export async function createSharedBudget(
  input: CreateSharedBudgetInput
): Promise<SharedBudget> {
  const userId = await getUserId()
  const name = requireValidBudgetName(input.name)
  requireValidLimit(input.initialWeeklyLimit)

  if (!input.effectiveWeekStart) {
    throw new Error('Effective week start is required')
  }

  const sharedBudgetId = crypto.randomUUID()
  const personalCategories = await db
    .select({
      name: categories.name,
      emoji: categories.emoji,
    })
    .from(categories)
    .where(eq(categories.userId, userId))

  await db.transaction(async (tx) => {
    await tx
      .update(sharedBudgetMembers)
      .set({ isActive: false })
      .where(eq(sharedBudgetMembers.userId, userId))

    await tx.insert(sharedBudgets).values({
      id: sharedBudgetId,
      name,
      createdByUserId: userId,
    })

    await tx.insert(sharedBudgetMembers).values({
      sharedBudgetId,
      userId,
      role: 'owner',
      isActive: true,
    })

    await tx.insert(sharedBudgetWeeklyLimits).values({
      id: crypto.randomUUID(),
      sharedBudgetId,
      effectiveWeekStart: input.effectiveWeekStart,
      amount: input.initialWeeklyLimit,
    })

    if (personalCategories.length > 0) {
      await tx.insert(sharedBudgetCategories).values(
        personalCategories.map((category) => ({
          id: crypto.randomUUID(),
          sharedBudgetId,
          name: category.name,
          emoji: category.emoji,
        }))
      )
    }
  })

  return getSharedBudgetForUser(sharedBudgetId, userId)
}

export async function archiveSharedBudget(
  sharedBudgetId: string
): Promise<void> {
  const userId = await getUserId()
  await requireOwner(sharedBudgetId, userId)

  await db.transaction(async (tx) => {
    await tx
      .update(sharedBudgets)
      .set({ archivedAt: new Date() })
      .where(eq(sharedBudgets.id, sharedBudgetId))

    await tx
      .update(sharedBudgetMembers)
      .set({ isActive: false })
      .where(eq(sharedBudgetMembers.sharedBudgetId, sharedBudgetId))
  })
}

export async function setActiveSharedBudget(
  sharedBudgetId: string
): Promise<void> {
  const userId = await getUserId()
  await requireActiveMembership(sharedBudgetId, userId)

  await db.transaction(async (tx) => {
    await tx
      .update(sharedBudgetMembers)
      .set({ isActive: false })
      .where(eq(sharedBudgetMembers.userId, userId))

    await tx
      .update(sharedBudgetMembers)
      .set({ isActive: true })
      .where(
        and(
          eq(sharedBudgetMembers.sharedBudgetId, sharedBudgetId),
          eq(sharedBudgetMembers.userId, userId)
        )
      )
  })
}

export async function setSharedWeeklyLimitForWeek(
  sharedBudgetId: string,
  effectiveWeekStart: string,
  amount: number
): Promise<void> {
  const userId = await getUserId()
  await requireActiveMembership(sharedBudgetId, userId)
  requireValidLimit(amount)

  if (!effectiveWeekStart) {
    throw new Error('Effective week start is required')
  }

  await db
    .insert(sharedBudgetWeeklyLimits)
    .values({
      id: crypto.randomUUID(),
      sharedBudgetId,
      effectiveWeekStart,
      amount,
    })
    .onConflictDoUpdate({
      target: [
        sharedBudgetWeeklyLimits.sharedBudgetId,
        sharedBudgetWeeklyLimits.effectiveWeekStart,
      ],
      set: { amount },
    })
}

export async function assertCanUseSharedBudget(
  sharedBudgetId: string,
  userId: string
): Promise<void> {
  await requireActiveMembership(sharedBudgetId, userId)
}

export async function assertCanManageSharedBudgetExpense(
  sharedBudgetId: string,
  userId: string
): Promise<void> {
  await requireMembership(sharedBudgetId, userId)
}
