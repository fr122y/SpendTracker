'use client'

import { PieChart } from 'lucide-react'
import { useState } from 'react'

import { useExpenseStore } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import {
  getCategoryStats,
  type CategoryStat,
  type ExpenseScope,
} from '@/shared/lib'
import { cn } from '@/shared/lib'
import { Button, EmptyState } from '@/shared/ui'

import { AnalysisSkeleton } from './analysis-skeleton'

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
  scope: ExpenseScope
}

const SCOPE_OPTIONS: Array<{ value: ExpenseScope; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'personal', label: 'Личные' },
  { value: 'shared', label: 'Общие' },
]

function CategoryBox({ stat, maxPercent, scope }: CategoryBoxProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Calculate size based on percentage (min 60px/80px, max 120px/160px for mobile/desktop)
  const sizeScale = maxPercent > 0 ? stat.percent / maxPercent : 0

  // Calculate opacity based on percentage (min 0.4, max 1)
  const opacity = Math.max(0.4, Math.min(1, 0.4 + sizeScale * 0.6))
  const personalShare =
    stat.value > 0 ? (stat.personalValue / stat.value) * 100 : 0
  const sharedShare = stat.value > 0 ? (stat.sharedValue / stat.value) * 100 : 0
  const projectShare =
    stat.value > 0 ? (stat.projectValue / stat.value) * 100 : 0

  const segments = [
    { value: personalShare, color: '#10b981' },
    { value: sharedShare, color: '#f59e0b' },
    { value: projectShare, color: '#0ea5e9' },
  ].filter((segment) => segment.value > 0)
  const backgroundColor = segments.length === 1 ? segments[0].color : undefined
  let offset = 0
  const backgroundImage =
    segments.length > 1
      ? `linear-gradient(135deg, ${segments
          .map((segment) => {
            const start = offset
            offset += segment.value
            return `${segment.color} ${start}%, ${segment.color} ${offset}%`
          })
          .join(', ')})`
      : undefined
  const fillMode =
    segments.length > 1
      ? 'mixed'
      : sharedShare > 0
        ? 'shared'
        : projectShare > 0
          ? 'project'
          : 'personal'

  return (
    <div
      className="relative"
      data-testid={`analysis-category-${stat.name}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)}
      onTouchEnd={() => setShowTooltip(false)}
    >
      <div
        data-testid={`analysis-category-fill-${stat.name}`}
        data-fill-mode={fillMode}
        className={cn(
          'flex cursor-default flex-col items-center justify-center rounded-lg transition-transform hover:scale-105',
          'h-20 w-20 sm:h-24 sm:w-24 md:h-auto md:w-auto'
        )}
        style={{
          // Only apply dynamic size on larger screens
          minWidth: sizeScale > 0.5 ? `${60 + sizeScale * 40}px` : undefined,
          minHeight: sizeScale > 0.5 ? `${60 + sizeScale * 40}px` : undefined,
          opacity,
          backgroundColor,
          backgroundImage,
        }}
      >
        <span className="text-2xl sm:text-3xl">{stat.emoji}</span>
        <span className="mt-1 text-xs font-medium text-white sm:mt-1 sm:text-sm">
          {stat.name}
        </span>
        <span className="text-xs text-white/80 sm:text-sm">
          {stat.percent.toFixed(0)}%
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute -top-24 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-3 py-2 text-xs text-zinc-100 shadow-lg"
          data-testid={`analysis-tooltip-${stat.name}`}
        >
          <div
            className="font-semibold text-zinc-100"
            data-testid={`analysis-tooltip-total-${stat.name}`}
          >
            Всего: {stat.value.toLocaleString('ru-RU')} ₽
          </div>
          {(scope === 'all' || scope === 'personal') && (
            <div
              className="mt-1 text-emerald-400"
              data-testid={`analysis-tooltip-personal-${stat.name}`}
            >
              Личные: {stat.personalValue.toLocaleString('ru-RU')} ₽
            </div>
          )}
          {(scope === 'all' || scope === 'shared') && (
            <div
              className="text-amber-400"
              data-testid={`analysis-tooltip-shared-${stat.name}`}
            >
              Общие: {stat.sharedValue.toLocaleString('ru-RU')} ₽
            </div>
          )}
          {(scope === 'all' || scope === 'personal') && (
            <div
              className="text-sky-400"
              data-testid={`analysis-tooltip-project-${stat.name}`}
            >
              Проекты: {stat.projectValue.toLocaleString('ru-RU')} ₽
            </div>
          )}
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-800" />
        </div>
      )}
    </div>
  )
}

export function AnalysisDashboard() {
  const [scope, setScope] = useState<ExpenseScope>('all')
  const selectedDate = useSessionStore((state) => state.selectedDate)
  const { expenses, isLoading } = useExpenseStore((state) => ({
    expenses: state.expenses,
    isLoading: state.isLoading,
  }))

  if (isLoading) {
    return <AnalysisSkeleton />
  }

  const stats = getCategoryStats(expenses, selectedDate, scope)
  const maxPercent =
    stats.length > 0 ? Math.max(...stats.map((s) => s.percent)) : 0
  const totalSpent = stats.reduce((sum, s) => sum + s.value, 0)
  const personalTotal = stats.reduce((sum, s) => sum + s.personalValue, 0)
  const sharedTotal = stats.reduce((sum, s) => sum + s.sharedValue, 0)
  const projectTotal = stats.reduce((sum, s) => sum + s.projectValue, 0)

  const monthName = MONTH_NAMES[selectedDate.getMonth()]
  const year = selectedDate.getFullYear()

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-zinc-100 sm:text-lg">
            Анализ за {monthName} {year}
          </h2>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm">
            {(scope === 'all' || scope === 'personal') && (
              <span
                className="text-emerald-400"
                data-testid="analysis-header-personal"
              >
                Личные: {personalTotal.toLocaleString('ru-RU')} ₽
              </span>
            )}
            {(scope === 'all' || scope === 'shared') && (
              <span
                className="text-amber-400"
                data-testid="analysis-header-shared"
              >
                Общие: {sharedTotal.toLocaleString('ru-RU')} ₽
              </span>
            )}
            {(scope === 'all' || scope === 'personal') && (
              <span
                className="text-sky-400"
                data-testid="analysis-header-project"
              >
                Проекты: {projectTotal.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
        </div>
        <span
          className="text-base font-semibold text-emerald-400 sm:text-lg"
          data-testid="analysis-header-total"
        >
          {totalSpent.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Фильтр аналитики">
        {SCOPE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={scope === option.value ? 'primary' : 'ghost'}
            onClick={() => setScope(option.value)}
            className="min-h-9 px-3 py-1 text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Category Grid */}
      {stats.length > 0 ? (
        <div
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-4"
          data-testid="analysis-category-grid"
        >
          {stats.map((stat) => (
            <CategoryBox
              key={stat.name}
              stat={stat}
              maxPercent={maxPercent}
              scope={scope}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PieChart}
          title="Нет данных за этот месяц"
          description="Добавьте операции для анализа расходов"
        />
      )}
    </div>
  )
}
