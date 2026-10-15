import { and, eq } from 'drizzle-orm'

import { db, expenses, projects } from '@/shared/db'

import type { MoneyOperationType } from '@/shared/types'

export const PROJECT_RETURN_EXCEEDS_CASH_ERROR =
  'Project return exceeds cash on hand'

type ProjectTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

interface ProjectCashOperation {
  id: string
  amount: number
  operationType: MoneyOperationType | string | null
}

/**
 * Effect of one operation on the project's cash on hand: a withdrawal adds
 * money to the user's hands, a return takes it back to the project.
 */
export function getProjectCashEffect(
  operationType: MoneyOperationType | string | null | undefined,
  amount: number
): number {
  if (operationType === 'project_withdrawal') return amount
  if (operationType === 'project_return') return -amount
  return 0
}

export function isProjectCashOperation(
  operationType: MoneyOperationType | string | null | undefined
): boolean {
  return (
    operationType === 'project_withdrawal' || operationType === 'project_return'
  )
}

export function getProjectCashBalance(
  operations: ProjectCashOperation[],
  excludeExpenseId?: string
): number {
  return operations.reduce(
    (sum, operation) =>
      operation.id === excludeExpenseId
        ? sum
        : sum + getProjectCashEffect(operation.operationType, operation.amount),
    0
  )
}

/**
 * Locks the user's project row and rejects a change that would make the
 * project's cash on hand (withdrawn minus returned) negative.
 */
export async function assertProjectCashCovers(
  transaction: ProjectTransaction,
  {
    userId,
    projectId,
    excludeExpenseId,
    delta,
  }: {
    userId: string
    projectId: string
    excludeExpenseId?: string
    delta: number
  }
): Promise<void> {
  const [project] = await transaction
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .for('update')

  if (!project) {
    throw new Error('Project not found')
  }

  const operations = await transaction
    .select({
      id: expenses.id,
      amount: expenses.amount,
      operationType: expenses.operationType,
    })
    .from(expenses)
    .where(and(eq(expenses.projectId, projectId), eq(expenses.userId, userId)))

  if (getProjectCashBalance(operations, excludeExpenseId) + delta < 0) {
    throw new Error(PROJECT_RETURN_EXCEEDS_CASH_ERROR)
  }
}
