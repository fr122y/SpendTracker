import type { Category, Expense } from '@/shared/types'

export const SHARED_CATEGORY_LOCKED_HINT =
  'Категорию общего расхода нельзя изменить здесь'
export const TRANSFER_CATEGORY_LOCKED_HINT =
  'У перевода из кармана нет категории'
export const PROJECT_MOVEMENT_LOCKED_HINT =
  'У движения проектных денег меняются только описание и дата'

export interface ExpenseEditRules {
  canEditAmount: boolean
  canEditCategory: boolean
  /** Zero is a valid amount: a pocket transfer reduced to zero is a full return. */
  allowZeroAmount: boolean
  categoryHint: string | null
}

/**
 * Mirrors the guards `updateExpense` enforces on the server, so the editor
 * never offers a change the server rejects:
 * - shared expenses keep their category and emoji;
 * - pocket transfers keep their category; their amount may drop to zero;
 * - project withdrawals and returns keep their amount and category, as the
 *   journal did before (amount changes go through the project section).
 */
export function getExpenseEditRules(expense: Expense): ExpenseEditRules {
  const operationType = expense.operationType ?? 'expense'

  if (operationType === 'pocket_transfer') {
    return {
      canEditAmount: true,
      canEditCategory: false,
      allowZeroAmount: true,
      categoryHint: TRANSFER_CATEGORY_LOCKED_HINT,
    }
  }

  if (operationType !== 'expense') {
    return {
      canEditAmount: false,
      canEditCategory: false,
      allowZeroAmount: false,
      categoryHint: PROJECT_MOVEMENT_LOCKED_HINT,
    }
  }

  if (expense.sharedBudgetId) {
    return {
      canEditAmount: true,
      canEditCategory: false,
      allowZeroAmount: false,
      categoryHint: SHARED_CATEGORY_LOCKED_HINT,
    }
  }

  return {
    canEditAmount: true,
    canEditCategory: true,
    allowZeroAmount: false,
    categoryHint: null,
  }
}

export interface ExpenseEditValues {
  description: string
  amount: number
  date: string
  categoryName: string
}

/**
 * Builds the partial update for one `updateExpense` call: only fields that
 * changed and that the rules allow. Changing the category sends its emoji too;
 * the dialog saves the keyword rule separately.
 */
export function buildExpensePatch(
  expense: Expense,
  values: ExpenseEditValues,
  categories: Category[]
): Partial<Omit<Expense, 'id'>> {
  const rules = getExpenseEditRules(expense)
  const patch: Partial<Omit<Expense, 'id'>> = {}
  const description = values.description.trim()

  if (description && description !== expense.description) {
    patch.description = description
  }
  if (rules.canEditAmount && values.amount !== expense.amount) {
    patch.amount = values.amount
  }
  if (values.date && values.date !== expense.date) {
    patch.date = values.date
  }
  if (rules.canEditCategory && values.categoryName !== expense.category) {
    const category = categories.find(
      (item) => item.name === values.categoryName
    )
    if (category) {
      patch.category = category.name
      patch.emoji = category.emoji
    }
  }

  return patch
}
