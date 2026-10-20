import { eq } from 'drizzle-orm'

import { db, expenses } from '@/shared/db'

import { assertCanUsePocket } from './pocket-helpers'
import {
  assertProjectCashCovers,
  isProjectCashOperation,
  PROJECT_RETURN_EXCEEDS_CASH_ERROR,
} from './project-helpers'
import { assertCanManageSharedBudgetExpense } from './shared-budget-actions'

/**
 * `project_cash_negative` is returned instead of thrown so the client can show
 * a specific message: production builds hide thrown Server Action messages.
 */
export type DeleteExpenseResult =
  | { status: 'deleted' }
  | { status: 'project_cash_negative' }

/**
 * Deletes one expense on behalf of `userId`. A missing id counts as deleted, so
 * a repeated delete is safe. Shared by the `deleteExpense` server action and the
 * `/api/expenses/flush-deletes` route.
 */
export async function deleteExpenseForUser(
  id: string,
  userId: string
): Promise<DeleteExpenseResult> {
  const [expense] = await db
    .select({
      userId: expenses.userId,
      sharedBudgetId: expenses.sharedBudgetId,
      pocketId: expenses.pocketId,
      projectId: expenses.projectId,
      operationType: expenses.operationType,
    })
    .from(expenses)
    .where(eq(expenses.id, id))

  if (!expense) return { status: 'deleted' }

  if (expense.sharedBudgetId) {
    await assertCanManageSharedBudgetExpense(expense.sharedBudgetId, userId)
  } else if (expense.userId !== userId) {
    throw new Error('Expense not found')
  }

  if (expense.pocketId) {
    await assertCanUsePocket(expense.pocketId, userId)
  }

  const projectId = expense.projectId
  if (projectId && isProjectCashOperation(expense.operationType)) {
    return db.transaction(async (transaction) => {
      try {
        await assertProjectCashCovers(transaction, {
          userId,
          projectId,
          excludeExpenseId: id,
          delta: 0,
        })
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === PROJECT_RETURN_EXCEEDS_CASH_ERROR
        ) {
          return { status: 'project_cash_negative' as const }
        }
        throw error
      }
      await transaction.delete(expenses).where(eq(expenses.id, id))
      return { status: 'deleted' as const }
    })
  }

  await db.delete(expenses).where(eq(expenses.id, id))
  return { status: 'deleted' }
}
