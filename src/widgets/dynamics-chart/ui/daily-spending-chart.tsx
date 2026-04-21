'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

import { useExpenseStore } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import { getMonthlyExpenses } from '@/shared/lib'

import { DailySpendingChartSkeleton } from './daily-spending-chart-skeleton'

import type { Expense } from '@/shared/types'

const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

interface DailyData {
  day: number
  amount: number
  personalAmount: number
  projectAmount: number
  date: Date
}

function getDailySpendingData(
  expenses: Expense[],
  viewDate: Date
): DailyData[] {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthlyExpenses = getMonthlyExpenses(expenses, viewDate)

  // Group expenses by day
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

  // Create array for all days in month
  const data: DailyData[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    data.push({
      day,
      amount: dailyMap.get(day)?.amount || 0,
      personalAmount: dailyMap.get(day)?.personalAmount || 0,
      projectAmount: dailyMap.get(day)?.projectAmount || 0,
      date: new Date(year, month, day),
    })
  }

  return data
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; payload: DailyData }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded bg-zinc-800 px-3 py-2 text-sm shadow-lg">
        <p className="text-zinc-400">День {data.day}</p>
        <p className="font-semibold text-zinc-100">
          Всего: {data.amount.toLocaleString('ru-RU')} ₽
        </p>
        <p className="text-emerald-400">
          Личные: {data.personalAmount.toLocaleString('ru-RU')} ₽
        </p>
        <p className="text-sky-400">
          Проекты: {data.projectAmount.toLocaleString('ru-RU')} ₽
        </p>
      </div>
    )
  }
  return null
}

export function DailySpendingChart() {
  const { viewDate, selectedDate, setSelectedDate } = useSessionStore()
  const { expenses, isLoading } = useExpenseStore((state) => ({
    expenses: state.expenses,
    isLoading: state.isLoading,
  }))

  if (isLoading) {
    return <DailySpendingChartSkeleton />
  }

  const data = getDailySpendingData(expenses, viewDate)
  const selectedDay = selectedDate.getDate()
  const selectedMonth = selectedDate.getMonth()
  const viewMonth = viewDate.getMonth()

  const monthName = MONTH_NAMES[viewDate.getMonth()]
  const year = viewDate.getFullYear()

  const totalMonthly = data.reduce((sum, d) => sum + d.amount, 0)
  const personalTotal = data.reduce((sum, d) => sum + d.personalAmount, 0)
  const projectTotal = data.reduce((sum, d) => sum + d.projectAmount, 0)

  const handleBarClick = (data: DailyData) => {
    setSelectedDate(data.date)
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-zinc-100 sm:text-lg">
            Динамика за {monthName} {year}
          </h2>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm">
            <span
              className="text-emerald-400"
              data-testid="dynamics-header-personal"
            >
              Личные: {personalTotal.toLocaleString('ru-RU')} ₽
            </span>
            <span
              className="text-sky-400"
              data-testid="dynamics-header-project"
            >
              Проекты: {projectTotal.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
        <span
          className="text-base font-semibold text-emerald-400 sm:text-lg"
          data-testid="dynamics-header-total"
        >
          {totalMonthly.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      {/* Chart */}
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <XAxis
              dataKey="day"
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={{ stroke: '#3f3f46' }}
              tickLine={{ stroke: '#3f3f46' }}
              interval={4}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={{ stroke: '#3f3f46' }}
              tickLine={{ stroke: '#3f3f46' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a' }} />
            <Bar
              dataKey="personalAmount"
              stackId="daily-total"
              radius={[4, 4, 0, 0]}
              onClick={(data) => handleBarClick(data)}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => {
                const isSelected =
                  entry.day === selectedDay && selectedMonth === viewMonth
                return (
                  <Cell
                    key={`personal-cell-${index}`}
                    fill={isSelected ? '#34d399' : '#10b981'}
                    opacity={entry.personalAmount > 0 ? 1 : 0.2}
                  />
                )
              })}
            </Bar>
            <Bar
              dataKey="projectAmount"
              stackId="daily-total"
              radius={[4, 4, 0, 0]}
              onClick={(data) => handleBarClick(data)}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => {
                const isSelected =
                  entry.day === selectedDay && selectedMonth === viewMonth
                return (
                  <Cell
                    key={`project-cell-${index}`}
                    fill={isSelected ? '#38bdf8' : '#0ea5e9'}
                    opacity={entry.projectAmount > 0 ? 1 : 0.2}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
