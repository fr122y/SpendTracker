'use client'

import { useEffect, useState } from 'react'

import { useExpenseStore } from '@/entities/expense'
import { useProjectStore } from '@/entities/project'
import { useSessionStore } from '@/entities/session'
import { useSettingsStore } from '@/entities/settings'
import { getWeeklyBudgetCoverage, cn } from '@/shared/lib'
import { MathInput } from '@/shared/ui'

import { WeeklyBudgetSkeleton } from './weekly-budget-skeleton'

export function WeeklyBudget() {
  const selectedDate = useSessionStore((state) => state.selectedDate)
  const {
    weeklyLimit,
    setWeeklyLimitForDate,
    isLoading: isSettingsLoading,
  } = useSettingsStore((state) => ({
    weeklyLimit: state.getWeeklyLimitForDate(selectedDate),
    setWeeklyLimitForDate: state.setWeeklyLimitForDate,
    isLoading: state.isLoading,
  }))
  const { expenses, isLoading: isExpensesLoading } = useExpenseStore(
    (state) => ({
      expenses: state.expenses,
      isLoading: state.isLoading,
    })
  )
  const { projects, isLoading: isProjectsLoading } = useProjectStore(
    (state) => ({
      projects: state.projects,
      isLoading: state.isLoading,
    })
  )
  const [inputValue, setInputValue] = useState(String(weeklyLimit))

  useEffect(() => {
    setInputValue(String(weeklyLimit))
  }, [weeklyLimit])

  if (isSettingsLoading || isExpensesLoading || isProjectsLoading) {
    return <WeeklyBudgetSkeleton />
  }

  const coverage = getWeeklyBudgetCoverage(expenses, selectedDate, weeklyLimit)
  const remaining = coverage.totalAvailable - coverage.personalSpent
  const isOverBudget = coverage.uncovered > 0
  const progressMax = Math.max(
    coverage.totalAvailable,
    coverage.personalSpent,
    1
  )
  const progressPercent = Math.round(
    (coverage.personalSpent / progressMax) * 100
  )
  const projectById = new Map(projects.map((project) => [project.id, project]))

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
      setWeeklyLimitForDate(selectedDate, evaluated)
      setInputValue(String(evaluated))
    } else {
      setInputValue(value)
    }
  }

  const getSegmentWidth = (value: number) => `${(value / progressMax) * 100}%`

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-medium text-zinc-100 sm:text-lg">
          Бюджет на неделю
        </h2>
        <span className="text-xs text-zinc-500 sm:text-sm">
          {formatWeekDate(coverage.start)} - {formatWeekDate(coverage.end)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm text-zinc-400">Покрытие недели</span>
            <span
              className={cn(
                'font-mono text-sm font-medium',
                isOverBudget ? 'text-red-400' : 'text-zinc-300'
              )}
            >
              {progressPercent}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={coverage.personalSpent}
            aria-valuemin={0}
            aria-valuemax={progressMax}
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-800 shadow-inner shadow-black/30"
          >
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: getSegmentWidth(coverage.personalCovered) }}
              title="Личный бюджет"
            />
            {coverage.projectSegments.map((segment) => {
              const project = projectById.get(segment.projectId)
              return (
                <div
                  key={segment.projectId}
                  className="h-full transition-all duration-500"
                  style={{
                    width: getSegmentWidth(segment.covered),
                    backgroundColor: project?.color ?? '#38bdf8',
                  }}
                  title={project?.name ?? 'Проектная добавка'}
                />
              )
            })}
            {coverage.uncovered > 0 && (
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: getSegmentWidth(coverage.uncovered) }}
                title="Сверх бюджета"
              />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <span className="text-zinc-400">
            Личный бюджет:{' '}
            <span
              className={cn(
                'font-semibold',
                isOverBudget ? 'text-red-400' : 'text-emerald-400'
              )}
            >
              {coverage.personalCovered.toLocaleString('ru-RU')} /{' '}
              {weeklyLimit.toLocaleString('ru-RU')} ₽
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

      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3 sm:text-sm">
          <span className="flex flex-col gap-0.5">
            <span className="text-zinc-500">Проектная добавка</span>
            <span className="whitespace-nowrap font-semibold text-sky-300">
              {coverage.projectTopUp.toLocaleString('ru-RU')} ₽
            </span>
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-zinc-500">Покрыто проектами</span>
            <span className="whitespace-nowrap font-semibold text-sky-300">
              {coverage.projectCovered.toLocaleString('ru-RU')} ₽
            </span>
          </span>
          {coverage.uncovered > 0 && (
            <span className="flex flex-col gap-0.5">
              <span className="text-zinc-500">Сверх бюджета</span>
              <span className="whitespace-nowrap font-semibold text-red-400">
                {coverage.uncovered.toLocaleString('ru-RU')} ₽
              </span>
            </span>
          )}
        </div>

        {coverage.projectSegments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 text-xs sm:text-sm">
            {coverage.projectSegments.map((segment) => {
              const project = projectById.get(segment.projectId)
              return (
                <span
                  key={segment.projectId}
                  className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-zinc-400"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: project?.color ?? '#38bdf8' }}
                  />
                  <span className="min-w-0 truncate">
                    {project?.name ?? 'Проект'}
                  </span>
                  <span className="whitespace-nowrap text-zinc-500">
                    {segment.available.toLocaleString('ru-RU')} ₽
                  </span>
                </span>
              )
            })}
          </div>
        )}
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
