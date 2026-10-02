import type { Expense } from '@/shared/types'

export interface CategoryStat {
  name: string
  value: number
  personalValue: number
  sharedValue: number
  projectValue: number
  emoji: string
  percent: number
}

export type ExpenseScope = 'all' | 'personal' | 'shared'

export interface WeeklyStat {
  spent: number
  limit: number
  start: string
  end: string
}

export interface WeeklyLimitSetting {
  effectiveWeekStart: string
  amount: number
}

export interface WeeklyProjectTopUpSegment {
  projectId: string
  available: number
  covered: number
  withdrawn: number
  returned: number
}

export interface WeeklyPocketTopUpSegment {
  pocketId: string
  available: number
  covered: number
  transferred: number
}

export interface WeeklyBudgetCoverage {
  personalSpent: number
  weeklyLimit: number
  projectTopUp: number
  pocketTopUp: number
  personalCovered: number
  projectCovered: number
  pocketCovered: number
  uncovered: number
  totalAvailable: number
  start: string
  end: string
  projectSegments: WeeklyProjectTopUpSegment[]
  pocketSegments: WeeklyPocketTopUpSegment[]
}

export interface PocketMonthSummary {
  purchases: Expense[]
  transfers: Expense[]
  used: number
  remaining: number
  purchaseTotal: number
  transferTotal: number
}

function isExpense(expense: Expense): boolean {
  return (expense.operationType ?? 'expense') === 'expense'
}

function isProjectWithdrawal(expense: Expense): boolean {
  return expense.operationType === 'project_withdrawal'
}

function isProjectReturn(expense: Expense): boolean {
  return expense.operationType === 'project_return'
}

function matchesExpenseScope(expense: Expense, scope: ExpenseScope): boolean {
  if (scope === 'personal') {
    return !expense.sharedBudgetId
  }

  if (scope === 'shared') {
    return Boolean(expense.sharedBudgetId)
  }

  return true
}

export function getScopedOperations(
  expenses: Expense[],
  scope: ExpenseScope = 'all'
): Expense[] {
  return expenses.filter((expense) => matchesExpenseScope(expense, scope))
}

export function getScopedExpenses(
  expenses: Expense[],
  scope: ExpenseScope = 'all'
): Expense[] {
  return expenses.filter(
    (expense) => isExpense(expense) && matchesExpenseScope(expense, scope)
  )
}

/**
 * Returns personal operating expenses without a linked project or pocket
 */
export function getPersonalExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter(
    (expense) =>
      isExpense(expense) &&
      !expense.projectId &&
      !expense.sharedBudgetId &&
      !expense.pocketId
  )
}

/**
 * Returns expenses linked to a specific project
 */
export function getProjectExpenses(
  expenses: Expense[],
  projectId: string
): Expense[] {
  return expenses.filter(
    (expense) => isExpense(expense) && expense.projectId === projectId
  )
}

export function getProjectOperations(
  expenses: Expense[],
  projectId: string
): Expense[] {
  return expenses.filter((expense) => expense.projectId === projectId)
}

export function getProjectSpent(
  expenses: Expense[],
  projectId: string
): number {
  return getProjectExpenses(expenses, projectId).reduce(
    (sum, expense) => sum + expense.amount,
    0
  )
}

export function getProjectCashOnHand(
  expenses: Expense[],
  projectId: string
): number {
  const projectOperations = getProjectOperations(expenses, projectId)

  return projectOperations.reduce((sum, expense) => {
    if (isProjectWithdrawal(expense)) return sum + expense.amount
    if (isProjectReturn(expense)) return sum - expense.amount
    return sum
  }, 0)
}

/**
 * Returns expenses for the specified month
 */
export function getMonthlyExpenses(
  expenses: Expense[],
  date: Date,
  scope: ExpenseScope = 'all'
): Expense[] {
  const year = date.getFullYear()
  const month = date.getMonth()

  return getScopedExpenses(expenses, scope).filter((expense) => {
    const expenseDate = new Date(expense.date)
    return (
      expenseDate.getFullYear() === year && expenseDate.getMonth() === month
    )
  })
}

/**
 * Returns a pocket's selected-month purchases and transfers and their totals.
 */
export function getPocketMonthSummary(
  expenses: Expense[],
  pocketId: string,
  date: Date,
  budget: number
): PocketMonthSummary {
  const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const operations = expenses.filter(
    (expense) =>
      expense.pocketId === pocketId && expense.date.slice(0, 7) === period
  )
  const purchases = operations.filter(isExpense)
  const transfers = operations.filter(
    (expense) => expense.operationType === 'pocket_transfer'
  )
  const purchaseTotal = purchases.reduce(
    (sum, expense) => sum + expense.amount,
    0
  )
  const transferTotal = transfers.reduce(
    (sum, expense) => sum + expense.amount,
    0
  )
  const used = purchaseTotal + transferTotal

  return {
    purchases,
    transfers,
    used,
    remaining: budget - used,
    purchaseTotal,
    transferTotal,
  }
}

/**
 * Returns expenses for the specified date
 */
export function getDailyExpenses(
  expenses: Expense[],
  date: Date,
  scope: ExpenseScope = 'all'
): Expense[] {
  const dateStr = formatDate(date)
  return getScopedExpenses(expenses, scope).filter(
    (expense) => expense.date === dateStr
  )
}

export function getDailyOperations(
  expenses: Expense[],
  date: Date,
  scope: ExpenseScope = 'all'
): Expense[] {
  const dateStr = formatDate(date)
  return getScopedOperations(expenses, scope).filter(
    (expense) => expense.date === dateStr
  )
}

export function getDailyExpenseTotal(
  expenses: Expense[],
  date: Date,
  scope: ExpenseScope = 'all'
): number {
  return getDailyExpenses(expenses, date, scope).reduce(
    (sum, expense) => sum + expense.amount,
    0
  )
}

/**
 * Returns category statistics for the month sorted by value
 */
export function getCategoryStats(
  expenses: Expense[],
  date: Date,
  scope: ExpenseScope = 'all'
): CategoryStat[] {
  const monthlyExpenses = getMonthlyExpenses(expenses, date, scope)

  // Group by category
  const categoryMap = new Map<
    string,
    {
      value: number
      personalValue: number
      sharedValue: number
      projectValue: number
      emoji: string
    }
  >()

  for (const expense of monthlyExpenses) {
    const existing = categoryMap.get(expense.category)
    const sharedValue = expense.sharedBudgetId ? expense.amount : 0
    const projectValue =
      !expense.sharedBudgetId && expense.projectId ? expense.amount : 0
    const personalValue =
      !expense.sharedBudgetId && !expense.projectId ? expense.amount : 0

    if (existing) {
      existing.value += expense.amount
      existing.personalValue += personalValue
      existing.sharedValue += sharedValue
      existing.projectValue += projectValue
    } else {
      categoryMap.set(expense.category, {
        value: expense.amount,
        personalValue,
        sharedValue,
        projectValue,
        emoji: expense.emoji,
      })
    }
  }

  // Calculate total
  const total = Array.from(categoryMap.values()).reduce(
    (sum, cat) => sum + cat.value,
    0
  )

  // Convert to array and sort by value descending
  const stats: CategoryStat[] = Array.from(categoryMap.entries()).map(
    ([name, data]) => ({
      name,
      value: data.value,
      personalValue: data.personalValue,
      sharedValue: data.sharedValue,
      projectValue: data.projectValue,
      emoji: data.emoji,
      percent: total > 0 ? (data.value / total) * 100 : 0,
    })
  )

  return stats.sort((a, b) => b.value - a.value)
}

/**
 * Returns weekly statistics with spent amount and week boundaries
 */
export function getWeeklyStats(
  expenses: Expense[],
  date: Date,
  weeklyLimit: number
): WeeklyStat {
  const { start, end } = getWeekBoundaries(date)

  const weekExpenses = expenses.filter(
    (expense) =>
      isExpense(expense) && expense.date >= start && expense.date <= end
  )

  const spent = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  return {
    spent,
    limit: weeklyLimit,
    start,
    end,
  }
}

/**
 * Returns weekly statistics for personal expenses only
 */
export function getWeeklyPersonalStats(
  expenses: Expense[],
  date: Date,
  weeklyLimit: number
): WeeklyStat {
  const { start, end } = getWeekBoundaries(date)

  const weekExpenses = getPersonalExpenses(expenses).filter(
    (expense) => expense.date >= start && expense.date <= end
  )

  const spent = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  return {
    spent,
    limit: weeklyLimit,
    start,
    end,
  }
}

export function getWeeklyBudgetCoverage(
  expenses: Expense[],
  date: Date,
  weeklyLimit: number
): WeeklyBudgetCoverage {
  const { start, end } = getWeekBoundaries(date)

  const weekPersonalExpenses = getPersonalExpenses(expenses).filter(
    (expense) => expense.date >= start && expense.date <= end
  )
  const personalSpent = weekPersonalExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  )

  const topUpsByProject = new Map<
    string,
    {
      projectId: string
      withdrawn: number
      returned: number
      firstWithdrawalDate: string
      firstWithdrawalIndex: number
    }
  >()
  const topUpsByPocket = new Map<
    string,
    {
      pocketId: string
      transferred: number
      firstMovementDate: string
      firstMovementIndex: number
    }
  >()

  expenses.forEach((expense, index) => {
    if (expense.date < start || expense.date > end) {
      return
    }

    if (
      expense.projectId &&
      !expense.pocketId &&
      (isProjectWithdrawal(expense) || isProjectReturn(expense))
    ) {
      const existing = topUpsByProject.get(expense.projectId)
      const item = existing ?? {
        projectId: expense.projectId,
        withdrawn: 0,
        returned: 0,
        firstWithdrawalDate: expense.date,
        firstWithdrawalIndex: index,
      }

      if (isProjectWithdrawal(expense)) {
        if (item.withdrawn === 0) {
          item.firstWithdrawalDate = expense.date
          item.firstWithdrawalIndex = index
        }
        item.withdrawn += expense.amount
      }
      if (isProjectReturn(expense)) item.returned += expense.amount

      topUpsByProject.set(expense.projectId, item)
      return
    }

    if (
      expense.pocketId &&
      !expense.projectId &&
      !expense.sharedBudgetId &&
      expense.operationType === 'pocket_transfer'
    ) {
      const existing = topUpsByPocket.get(expense.pocketId)
      const item = existing ?? {
        pocketId: expense.pocketId,
        transferred: 0,
        firstMovementDate: expense.date,
        firstMovementIndex: index,
      }

      if (
        expense.date < item.firstMovementDate ||
        (expense.date === item.firstMovementDate &&
          index < item.firstMovementIndex)
      ) {
        item.firstMovementDate = expense.date
        item.firstMovementIndex = index
      }

      item.transferred += expense.amount
      topUpsByPocket.set(expense.pocketId, item)
    }
  })

  const overPersonalLimit = Math.max(personalSpent - weeklyLimit, 0)
  const coverageSources = [
    ...Array.from(topUpsByProject.values()).map((item) => ({
      kind: 'project' as const,
      firstMovementDate: item.firstWithdrawalDate,
      firstMovementIndex: item.firstWithdrawalIndex,
      item,
      available: Math.max(item.withdrawn - item.returned, 0),
    })),
    ...Array.from(topUpsByPocket.values()).map((item) => ({
      kind: 'pocket' as const,
      firstMovementDate: item.firstMovementDate,
      firstMovementIndex: item.firstMovementIndex,
      item,
      available: Math.max(item.transferred, 0),
    })),
  ]
    .filter((source) => source.available > 0)
    .sort((a, b) => {
      const dateOrder = a.firstMovementDate.localeCompare(b.firstMovementDate)
      if (dateOrder !== 0) return dateOrder
      return a.firstMovementIndex - b.firstMovementIndex
    })

  let remainingCoverage = overPersonalLimit
  const projectSegments: WeeklyProjectTopUpSegment[] = []
  const pocketSegments: WeeklyPocketTopUpSegment[] = []

  for (const source of coverageSources) {
    const covered = Math.min(remainingCoverage, source.available)
    remainingCoverage -= covered

    if (source.kind === 'project') {
      projectSegments.push({
        projectId: source.item.projectId,
        available: source.available,
        covered,
        withdrawn: source.item.withdrawn,
        returned: source.item.returned,
      })
    } else {
      pocketSegments.push({
        pocketId: source.item.pocketId,
        available: source.available,
        covered,
        transferred: source.item.transferred,
      })
    }
  }

  const projectTopUp = projectSegments.reduce(
    (sum, segment) => sum + segment.available,
    0
  )
  const pocketTopUp = pocketSegments.reduce(
    (sum, segment) => sum + segment.available,
    0
  )
  const personalCovered = Math.min(personalSpent, weeklyLimit)
  const projectCovered = projectSegments.reduce(
    (sum, segment) => sum + segment.covered,
    0
  )
  const pocketCovered = pocketSegments.reduce(
    (sum, segment) => sum + segment.covered,
    0
  )
  const uncovered = Math.max(
    personalSpent - weeklyLimit - projectTopUp - pocketTopUp,
    0
  )

  return {
    personalSpent,
    weeklyLimit,
    projectTopUp,
    pocketTopUp,
    personalCovered,
    projectCovered,
    pocketCovered,
    uncovered,
    totalAvailable: weeklyLimit + projectTopUp + pocketTopUp,
    start,
    end,
    projectSegments,
    pocketSegments,
  }
}

export function getSharedWeeklyBudgetCoverage(
  expenses: Expense[],
  sharedBudgetId: string,
  date: Date,
  weeklyLimit: number
): WeeklyBudgetCoverage {
  const { start, end } = getWeekBoundaries(date)

  const weekSharedExpenses = expenses.filter(
    (expense) =>
      isExpense(expense) &&
      expense.sharedBudgetId === sharedBudgetId &&
      expense.date >= start &&
      expense.date <= end
  )
  const personalSpent = weekSharedExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  )
  const personalCovered = Math.min(personalSpent, weeklyLimit)
  const uncovered = Math.max(personalSpent - weeklyLimit, 0)

  return {
    personalSpent,
    weeklyLimit,
    projectTopUp: 0,
    pocketTopUp: 0,
    personalCovered,
    projectCovered: 0,
    pocketCovered: 0,
    uncovered,
    totalAvailable: weeklyLimit,
    start,
    end,
    projectSegments: [],
    pocketSegments: [],
  }
}

export function getEffectiveWeeklyLimit(
  weeklyLimits: WeeklyLimitSetting[],
  date: Date,
  defaultLimit: number
): number {
  const weekStart = getWeekBoundaries(date).start
  const effectiveLimit = weeklyLimits
    .filter((limit) => limit.effectiveWeekStart <= weekStart)
    .sort((a, b) => b.effectiveWeekStart.localeCompare(a.effectiveWeekStart))
    .at(0)

  return effectiveLimit?.amount ?? defaultLimit
}

/**
 * Helper: Format date as ISO date string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Helper: Get week boundaries (Monday - Sunday)
 */
export function getWeekBoundaries(date: Date): { start: string; end: string } {
  const d = new Date(date)

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = d.getDay()

  // Calculate Monday (start of week)
  // If Sunday (0), go back 6 days; otherwise go back (dayOfWeek - 1) days
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)

  // Calculate Sunday (end of week)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    start: formatDate(monday),
    end: formatDate(sunday),
  }
}
