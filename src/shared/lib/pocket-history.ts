import type { Expense, PocketMonthBudget } from '@/shared/types'

export interface PocketHistoryMonth {
  /** Calendar month as `YYYY-MM`. */
  period: string
  budget: number
  /** True when the budget is the saved row of this month, not carried forward. */
  isBudgetSaved: boolean
  purchaseTotal: number
  transferTotal: number
  spent: number
  /** Budget minus spent; negative means overspend. */
  remaining: number
}

function toPeriod(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function nextPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, '0')}`
}

/**
 * Derives the per-month history of one pocket from saved month budgets and
 * operations, newest month first. Months run from the pocket's creation month
 * (or its earliest budget or operation, if earlier) to `selectedPeriod`. A
 * month without a saved budget uses the latest earlier saved budget, or zero,
 * as month initialization would. Purchases and transfers both reduce the
 * remainder; nothing carries over between months. Reads only, never writes.
 */
export function getPocketMonthHistory({
  pocketId,
  pocketCreatedAt,
  budgets,
  expenses,
  selectedPeriod,
}: {
  pocketId: string
  pocketCreatedAt: string
  budgets: PocketMonthBudget[]
  expenses: Expense[]
  selectedPeriod: string
}): PocketHistoryMonth[] {
  const savedBudgets = new Map<string, number>()
  for (const budget of budgets) {
    if (budget.pocketId === pocketId) {
      savedBudgets.set(budget.period, budget.budget)
    }
  }

  const totals = new Map<string, { purchase: number; transfer: number }>()
  for (const expense of expenses) {
    if (expense.pocketId !== pocketId) continue
    const operationType = expense.operationType ?? 'expense'
    if (operationType !== 'expense' && operationType !== 'pocket_transfer') {
      continue
    }
    const period = expense.date.slice(0, 7)
    const total = totals.get(period) ?? { purchase: 0, transfer: 0 }
    if (operationType === 'expense') total.purchase += expense.amount
    else total.transfer += expense.amount
    totals.set(period, total)
  }

  const createdAt = new Date(pocketCreatedAt)
  const candidates = [...savedBudgets.keys(), ...totals.keys()]
  if (!Number.isNaN(createdAt.getTime())) candidates.push(toPeriod(createdAt))
  if (candidates.length === 0) return []
  const firstPeriod = candidates.reduce((min, period) =>
    period < min ? period : min
  )

  const months: PocketHistoryMonth[] = []
  let carriedBudget = 0
  for (
    let period = firstPeriod;
    period <= selectedPeriod;
    period = nextPeriod(period)
  ) {
    const saved = savedBudgets.get(period)
    const budget = saved ?? carriedBudget
    carriedBudget = budget
    const total = totals.get(period) ?? { purchase: 0, transfer: 0 }
    const spent = total.purchase + total.transfer
    months.push({
      period,
      budget,
      isBudgetSaved: saved !== undefined,
      purchaseTotal: total.purchase,
      transferTotal: total.transfer,
      spent,
      remaining: budget - spent,
    })
  }

  return months.reverse()
}
