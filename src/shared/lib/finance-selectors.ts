import type { Expense } from '@/shared/types'

export interface CategoryStat {
  name: string
  value: number
  personalValue: number
  projectValue: number
  emoji: string
  percent: number
}

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

export interface WeeklyBudgetCoverage {
  personalSpent: number
  weeklyLimit: number
  projectTopUp: number
  personalCovered: number
  projectCovered: number
  uncovered: number
  totalAvailable: number
  start: string
  end: string
  projectSegments: WeeklyProjectTopUpSegment[]
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

/**
 * Returns personal expenses without a linked project
 */
export function getPersonalExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => isExpense(expense) && !expense.projectId)
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
export function getMonthlyExpenses(expenses: Expense[], date: Date): Expense[] {
  const year = date.getFullYear()
  const month = date.getMonth()

  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return (
      isExpense(expense) &&
      expenseDate.getFullYear() === year &&
      expenseDate.getMonth() === month
    )
  })
}

/**
 * Returns expenses for the specified date
 */
export function getDailyExpenses(expenses: Expense[], date: Date): Expense[] {
  const dateStr = formatDate(date)
  return expenses.filter(
    (expense) => isExpense(expense) && expense.date === dateStr
  )
}

export function getDailyOperations(expenses: Expense[], date: Date): Expense[] {
  const dateStr = formatDate(date)
  return expenses.filter((expense) => expense.date === dateStr)
}

export function getDailyExpenseTotal(expenses: Expense[], date: Date): number {
  return getDailyExpenses(expenses, date).reduce(
    (sum, expense) => sum + expense.amount,
    0
  )
}

/**
 * Returns category statistics for the month sorted by value
 */
export function getCategoryStats(
  expenses: Expense[],
  date: Date
): CategoryStat[] {
  const monthlyExpenses = getMonthlyExpenses(expenses, date)

  // Group by category
  const categoryMap = new Map<
    string,
    {
      value: number
      personalValue: number
      projectValue: number
      emoji: string
    }
  >()

  for (const expense of monthlyExpenses) {
    const existing = categoryMap.get(expense.category)
    const personalValue = expense.projectId ? 0 : expense.amount
    const projectValue = expense.projectId ? expense.amount : 0

    if (existing) {
      existing.value += expense.amount
      existing.personalValue += personalValue
      existing.projectValue += projectValue
    } else {
      categoryMap.set(expense.category, {
        value: expense.amount,
        personalValue,
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

  expenses.forEach((expense, index) => {
    if (
      !expense.projectId ||
      expense.date < start ||
      expense.date > end ||
      (!isProjectWithdrawal(expense) && !isProjectReturn(expense))
    ) {
      return
    }

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

    if (isProjectReturn(expense)) {
      item.returned += expense.amount
    }

    topUpsByProject.set(expense.projectId, item)
  })

  const overPersonalLimit = Math.max(personalSpent - weeklyLimit, 0)
  let remainingProjectCoverage = overPersonalLimit

  const projectSegments = Array.from(topUpsByProject.values())
    .map((item) => ({
      ...item,
      available: Math.max(item.withdrawn - item.returned, 0),
    }))
    .filter((item) => item.available > 0)
    .sort((a, b) => {
      const dateOrder = a.firstWithdrawalDate.localeCompare(
        b.firstWithdrawalDate
      )
      if (dateOrder !== 0) return dateOrder
      return a.firstWithdrawalIndex - b.firstWithdrawalIndex
    })
    .map((item) => {
      const covered = Math.min(remainingProjectCoverage, item.available)
      remainingProjectCoverage -= covered

      return {
        projectId: item.projectId,
        available: item.available,
        covered,
        withdrawn: item.withdrawn,
        returned: item.returned,
      }
    })

  const projectTopUp = projectSegments.reduce(
    (sum, segment) => sum + segment.available,
    0
  )
  const personalCovered = Math.min(personalSpent, weeklyLimit)
  const projectCovered = Math.min(overPersonalLimit, projectTopUp)
  const uncovered = Math.max(personalSpent - weeklyLimit - projectTopUp, 0)

  return {
    personalSpent,
    weeklyLimit,
    projectTopUp,
    personalCovered,
    projectCovered,
    uncovered,
    totalAvailable: weeklyLimit + projectTopUp,
    start,
    end,
    projectSegments,
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
