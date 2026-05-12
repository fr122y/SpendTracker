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
  isWeekend: boolean
}

export interface WeekendSpan {
  id: string
  startDay: number
  endDay: number
}

function createWeekendSpan(startDay: number, endDay: number): WeekendSpan {
  return {
    id: `${startDay}-${endDay}`,
    startDay,
    endDay,
  }
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
      isWeekend: weekday === 0 || weekday === 6,
    })
  }

  return data
}

export function getWeekendSpans(data: DailyData[]): WeekendSpan[] {
  const spans: WeekendSpan[] = []
  let currentStart: number | null = null

  for (const entry of data) {
    if (entry.isWeekend && currentStart === null) {
      currentStart = entry.day
    }

    if (!entry.isWeekend && currentStart !== null) {
      spans.push(createWeekendSpan(currentStart, entry.day - 1))
      currentStart = null
    }
  }

  if (currentStart !== null && data.length > 0) {
    spans.push(createWeekendSpan(currentStart, data[data.length - 1].day))
  }

  return spans
}
