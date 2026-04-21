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

/**
 * Returns personal expenses without a linked project
 */
export function getPersonalExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => !expense.projectId)
}

/**
 * Returns expenses linked to a specific project
 */
export function getProjectExpenses(
  expenses: Expense[],
  projectId: string
): Expense[] {
  return expenses.filter((expense) => expense.projectId === projectId)
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
      expenseDate.getFullYear() === year && expenseDate.getMonth() === month
    )
  })
}

/**
 * Returns expenses for the specified date
 */
export function getDailyExpenses(expenses: Expense[], date: Date): Expense[] {
  const dateStr = formatDate(date)
  return expenses.filter((expense) => expense.date === dateStr)
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

  const weekExpenses = expenses.filter((expense) => {
    return expense.date >= start && expense.date <= end
  })

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
function getWeekBoundaries(date: Date): { start: string; end: string } {
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
