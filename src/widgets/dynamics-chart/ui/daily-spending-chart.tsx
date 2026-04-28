'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'

import { useExpenseStore } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'

import { DailySpendingChartSkeleton } from './daily-spending-chart-skeleton'
import {
  getDailySpendingData,
  getWeekendSpans,
  type DailyData,
} from '../lib/daily-spending-data'

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

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; payload: DailyData }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded bg-zinc-800 px-3 py-2 text-sm shadow-lg">
        <p className="text-zinc-400">
          {data.weekdayLabel}, день {data.day}
        </p>
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
  const { selectedDate, setSelectedDate } = useSessionStore()
  const { expenses, isLoading } = useExpenseStore((state) => ({
    expenses: state.expenses,
    isLoading: state.isLoading,
  }))

  if (isLoading) {
    return <DailySpendingChartSkeleton />
  }

  const data = getDailySpendingData(expenses, selectedDate)
  const weekStartDays = data.filter(
    (entry) => entry.isWeekStart && entry.day !== 1
  )
  const weekendSpans = getWeekendSpans(data)
  const lastDay = data[data.length - 1]?.day
  const axisTicks = data
    .filter(
      (entry) => entry.day === 1 || entry.day === lastDay || entry.isWeekStart
    )
    .map((entry) => entry.day)
  const xAxisDomain = [0.5, (lastDay ?? 1) + 0.5]
  const selectedDay = selectedDate.getDate()

  const monthName = MONTH_NAMES[selectedDate.getMonth()]
  const year = selectedDate.getFullYear()

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
      <div>
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 8 }}
            >
              <XAxis
                type="number"
                dataKey="day"
                domain={xAxisDomain}
                ticks={axisTicks}
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickMargin={8}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={false}
                interval={0}
                height={24}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={{ stroke: '#3f3f46' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                width={35}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: '#27272a' }}
              />
              {weekendSpans.map((span) => (
                <ReferenceArea
                  key={`weekend-${span.id}`}
                  x1={span.startDay - 0.5}
                  x2={span.endDay + 0.5}
                  fill="#3f3f46"
                  fillOpacity={0.18}
                  strokeOpacity={0}
                  ifOverflow="hidden"
                  data-testid="dynamics-weekend-area"
                />
              ))}
              {weekStartDays.map((entry) => (
                <ReferenceLine
                  key={`week-start-${entry.day}`}
                  x={entry.day - 0.5}
                  stroke="#52525b"
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                  data-testid="dynamics-week-start"
                />
              ))}
              <Bar
                dataKey="personalAmount"
                stackId="daily-total"
                radius={[4, 4, 0, 0]}
                onClick={(data) => handleBarClick(data)}
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry, index) => {
                  const isSelected = entry.day === selectedDay
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
                  const isSelected = entry.day === selectedDay
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
    </div>
  )
}
