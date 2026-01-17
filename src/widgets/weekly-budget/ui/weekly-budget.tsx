'use client'

import { useExpenseStore } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import { useSettingsStore } from '@/entities/settings'
import { getWeeklyStats, cn } from '@/shared/lib'
import { ProgressBar, Input } from '@/shared/ui'

export function WeeklyBudget() {
  const { weeklyLimit, setWeeklyLimit } = useSettingsStore()
  const expenses = useExpenseStore((state) => state.expenses)
  const selectedDate = useSessionStore((state) => state.selectedDate)

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

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0) {
      setWeeklyLimit(value)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-100">Бюджет на неделю</h2>
        <span className="text-sm text-zinc-500">
          {formatWeekDate(stats.start)} - {formatWeekDate(stats.end)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <ProgressBar value={stats.spent} max={weeklyLimit} showPercentage />
        <div className="flex items-center justify-between text-sm">
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
      <div className="flex items-center gap-3">
        <label className="text-sm text-zinc-400">Лимит:</label>
        <Input
          type="number"
          value={weeklyLimit}
          onChange={handleLimitChange}
          min={0}
          step={1000}
          className="w-32"
        />
        <span className="text-sm text-zinc-500">₽</span>
      </div>
    </div>
  )
}
