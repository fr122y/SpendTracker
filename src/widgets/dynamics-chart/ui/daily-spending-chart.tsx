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
  const dailyMap = new Map<number, number>()
  for (const expense of monthlyExpenses) {
    const expenseDate = new Date(expense.date)
    const day = expenseDate.getDate()
    dailyMap.set(day, (dailyMap.get(day) || 0) + expense.amount)
  }

  // Create array for all days in month
  const data: DailyData[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    data.push({
      day,
      amount: dailyMap.get(day) || 0,
      date: new Date(year, month, day),
    })
  }

  return data
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: DailyData }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="rounded bg-zinc-800 px-3 py-2 text-sm shadow-lg">
        <p className="text-zinc-400">День {data.payload.day}</p>
        <p className="font-semibold text-emerald-400">
          {data.value.toLocaleString('ru-RU')} ₽
        </p>
      </div>
    )
  }
  return null
}

export function DailySpendingChart() {
  const { viewDate, selectedDate, setSelectedDate } = useSessionStore()
  const expenses = useExpenseStore((state) => state.expenses)

  const data = getDailySpendingData(expenses, viewDate)
  const selectedDay = selectedDate.getDate()
  const selectedMonth = selectedDate.getMonth()
  const viewMonth = viewDate.getMonth()

  const monthName = MONTH_NAMES[viewDate.getMonth()]
  const year = viewDate.getFullYear()

  const totalMonthly = data.reduce((sum, d) => sum + d.amount, 0)

  const handleBarClick = (data: DailyData) => {
    setSelectedDate(data.date)
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-medium text-zinc-100 sm:text-lg">
          Динамика за {monthName} {year}
        </h2>
        <span className="text-base font-semibold text-emerald-400 sm:text-lg">
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
              dataKey="amount"
              radius={[4, 4, 0, 0]}
              onClick={(data) => handleBarClick(data)}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => {
                const isSelected =
                  entry.day === selectedDay && selectedMonth === viewMonth
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isSelected ? '#3b82f6' : '#10b981'}
                    opacity={entry.amount > 0 ? 1 : 0.3}
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
