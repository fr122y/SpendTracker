'use client'

import { useEffect, useState } from 'react'

import { useExpenseStore } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import { useSettingsStore } from '@/entities/settings'
import { getWeeklyStats, cn } from '@/shared/lib'
import { ProgressBar, MathInput } from '@/shared/ui'

import { WeeklyBudgetSkeleton } from './weekly-budget-skeleton'

export function WeeklyBudget() {
  const {
    weeklyLimit,
    setWeeklyLimit,
    isLoading: isSettingsLoading,
  } = useSettingsStore((state) => ({
    weeklyLimit: state.weeklyLimit,
    setWeeklyLimit: state.setWeeklyLimit,
    isLoading: state.isLoading,
  }))
  const { expenses, isLoading: isExpensesLoading } = useExpenseStore(
    (state) => ({
      expenses: state.expenses,
      isLoading: state.isLoading,
    })
  )
  const selectedDate = useSessionStore((state) => state.selectedDate)
  const [inputValue, setInputValue] = useState(String(weeklyLimit))

  useEffect(() => {
    setInputValue(String(weeklyLimit))
  }, [weeklyLimit])

  if (isSettingsLoading || isExpensesLoading) {
    return <WeeklyBudgetSkeleton />
  }

  const stats = getWeeklyStats(expenses, selectedDate, weeklyLimit)
  const remaining = weeklyLimit - stats.spent
  const isOverBudget = remaining < 0

  // Format week dates
  const formatWeekDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const months = [
      'янв',
      'фев',
      'мар',
      'апр',
      'мая',
      'июн',
      'июл',
      'авг',
      'сен',
      'окт',
      'ноя',
      'дек',
    ]
    return `${day} ${months[date.getMonth()]}`
  }

  const handleLimitChange = (value: string, evaluated: number | null) => {
    if (evaluated !== null) {
      setWeeklyLimit(evaluated)
      setInputValue(String(evaluated))
    } else {
      setInputValue(value)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-medium text-zinc-100 sm:text-lg">
          Бюджет на неделю
        </h2>
        <span className="text-xs text-zinc-500 sm:text-sm">
          {formatWeekDate(stats.start)} - {formatWeekDate(stats.end)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <ProgressBar value={stats.spent} max={weeklyLimit} showPercentage />
        <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <span className="text-zinc-400">
            Потрачено:{' '}
            <span
              className={cn(
                'font-semibold',
                isOverBudget ? 'text-red-400' : 'text-emerald-400'
              )}
            >
              {stats.spent.toLocaleString('ru-RU')} ₽
            </span>
          </span>
          <span className="text-zinc-400">
            Осталось:{' '}
            <span
              className={cn(
                'font-semibold',
                isOverBudget ? 'text-red-400' : 'text-zinc-100'
              )}
            >
              {remaining.toLocaleString('ru-RU')} ₽
            </span>
          </span>
        </div>
      </div>

      {/* Limit Editor */}
      <div className="flex items-center gap-2 sm:gap-3">
        <label className="text-xs text-zinc-400 sm:text-sm">Лимит:</label>
        <MathInput
          value={inputValue}
          onValueChange={handleLimitChange}
          min={0}
          className="w-24 sm:w-32"
        />
        <span className="text-xs text-zinc-500 sm:text-sm">₽</span>
      </div>
    </div>
  )
}
