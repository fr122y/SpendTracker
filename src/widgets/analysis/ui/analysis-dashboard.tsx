'use client'

import { useState } from 'react'

import { useExpenseStore } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import { getCategoryStats, type CategoryStat } from '@/shared/lib'
import { cn } from '@/shared/lib'

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

interface CategoryBoxProps {
  stat: CategoryStat
  maxPercent: number
}

function CategoryBox({ stat, maxPercent }: CategoryBoxProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Calculate size based on percentage (min 80px, max 160px)
  const sizeScale = maxPercent > 0 ? stat.percent / maxPercent : 0
  const size = Math.max(80, Math.min(160, 80 + sizeScale * 80))

  // Calculate opacity based on percentage (min 0.4, max 1)
  const opacity = Math.max(0.4, Math.min(1, 0.4 + sizeScale * 0.6))

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={cn(
          'flex cursor-default flex-col items-center justify-center rounded-lg bg-emerald-600 transition-transform hover:scale-105'
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          opacity,
        }}
      >
        <span className="text-2xl">{stat.emoji}</span>
        <span className="mt-1 text-xs font-medium text-white">{stat.name}</span>
        <span className="text-xs text-white/80">
          {stat.percent.toFixed(0)}%
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 shadow-lg">
          {stat.value.toLocaleString('ru-RU')} ₽
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-800" />
        </div>
      )}
    </div>
  )
}

export function AnalysisDashboard() {
  const viewDate = useSessionStore((state) => state.viewDate)
  const expenses = useExpenseStore((state) => state.expenses)

  const stats = getCategoryStats(expenses, viewDate)
  const maxPercent =
    stats.length > 0 ? Math.max(...stats.map((s) => s.percent)) : 0
  const totalSpent = stats.reduce((sum, s) => sum + s.value, 0)

  const monthName = MONTH_NAMES[viewDate.getMonth()]
  const year = viewDate.getFullYear()

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-100">
          Анализ за {monthName} {year}
        </h2>
        <span className="text-lg font-semibold text-emerald-400">
          {totalSpent.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      {/* Category Grid */}
      {stats.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {stats.map((stat) => (
            <CategoryBox key={stat.name} stat={stat} maxPercent={maxPercent} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-zinc-500">
          Нет данных за этот месяц
        </p>
      )}
    </div>
  )
}
