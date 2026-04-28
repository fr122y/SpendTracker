import { getMonthlyExpenses } from '@/shared/lib'

import type { Expense } from '@/shared/types'

const WEEKDAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export interface DailyData {
  day: number
  amount: number
  personalAmount: number
  projectAmount: number
  date: Date
  weekdayLabel: string
  isWeekStart: boolean
}

export interface WeekRange {
  id: string
  startDay: number
  endDay: number
  label: string
}

function formatWeekRangeLabel(startDay: number, endDay: number) {
  return startDay === endDay ? `${startDay}` : `${startDay}-${endDay}`
}

export function getDailySpendingData(
  expenses: Expense[],
  selectedDate: Date
): DailyData[] {
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthlyExpenses = getMonthlyExpenses(expenses, selectedDate)

  const dailyMap = new Map<
    number,
    { amount: number; personalAmount: number; projectAmount: number }
  >()
  for (const expense of monthlyExpenses) {
    const expenseDate = new Date(expense.date)
    const day = expenseDate.getDate()
    const current = dailyMap.get(day) ?? {
      amount: 0,
      personalAmount: 0,
      projectAmount: 0,
    }

    current.amount += expense.amount
    if (expense.projectId) {
      current.projectAmount += expense.amount
    } else {
      current.personalAmount += expense.amount
    }

    dailyMap.set(day, current)
  }

  const data: DailyData[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const weekday = date.getDay()

    data.push({
      day,
      amount: dailyMap.get(day)?.amount || 0,
      personalAmount: dailyMap.get(day)?.personalAmount || 0,
      projectAmount: dailyMap.get(day)?.projectAmount || 0,
      date,
      weekdayLabel: WEEKDAY_LABELS[weekday],
      isWeekStart: day === 1 || weekday === 1,
    })
  }

  return data
}

export function getWeekRanges(data: DailyData[]): WeekRange[] {
  const ranges: WeekRange[] = []
  let currentStart: DailyData | undefined

  for (const entry of data) {
    if (!currentStart) {
      currentStart = entry
      continue
    }

    if (entry.isWeekStart) {
      const previousDay = entry.day - 1
      ranges.push({
        id: `${currentStart.day}-${previousDay}`,
        startDay: currentStart.day,
        endDay: previousDay,
        label: formatWeekRangeLabel(currentStart.day, previousDay),
      })
      currentStart = entry
    }
  }

  if (currentStart && data.length > 0) {
    const lastDay = data[data.length - 1].day
    ranges.push({
      id: `${currentStart.day}-${lastDay}`,
      startDay: currentStart.day,
      endDay: lastDay,
      label: formatWeekRangeLabel(currentStart.day, lastDay),
    })
  }

  return ranges
}
