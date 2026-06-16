'use client'

import { Archive, Copy, Link2, Plus, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useExpenseStore } from '@/entities/expense'
import { useProjectStore } from '@/entities/project'
import { useSessionStore } from '@/entities/session'
import { useSettingsStore } from '@/entities/settings'
import {
  getActiveSharedBudget,
  getEffectiveSharedWeeklyLimit,
  useArchiveSharedBudget,
  useCreateSharedBudget,
  useCreateSharedBudgetInvite,
  useSetActiveSharedBudget,
  useSetSharedWeeklyLimitForWeek,
  useSharedBudgets,
} from '@/entities/shared-budget'
import {
  getSharedWeeklyBudgetCoverage,
  getWeekBoundaries,
  getWeeklyBudgetCoverage,
  cn,
  type WeeklyBudgetCoverage,
} from '@/shared/lib'
import { Button, ConfirmDialog, Input, MathInput, Select } from '@/shared/ui'

import { WeeklyBudgetSkeleton } from './weekly-budget-skeleton'

import type { Project, SharedBudget } from '@/shared/types'

function formatCurrency(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`
}

function formatWeekDate(dateStr: string) {
  const date = new Date(dateStr)
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
  return `${date.getDate()} ${months[date.getMonth()]}`
}

function getSegmentWidth(value: number, max: number) {
  return `${(value / max) * 100}%`
}

function BudgetProgress({
  coverage,
  label,
  projectById,
}: {
  coverage: WeeklyBudgetCoverage
  label: string
  projectById?: Map<string, Project>
}) {
  const isOverBudget = coverage.uncovered > 0
  const progressMax = Math.max(
    coverage.totalAvailable,
    coverage.personalSpent,
    1
  )
  const progressPercent = Math.round(
    (coverage.personalSpent / progressMax) * 100
  )

  return (
    <div className="space-y-2">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm text-zinc-400">{label}</span>
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
            style={{
              width: getSegmentWidth(coverage.personalCovered, progressMax),
            }}
            title="Личный бюджет"
          />
          {coverage.projectSegments.map((segment) => {
            const project = projectById?.get(segment.projectId)
            return (
              <div
                key={segment.projectId}
                className="h-full transition-all duration-500"
                style={{
                  width: getSegmentWidth(segment.covered, progressMax),
                  backgroundColor: project?.color ?? '#38bdf8',
                }}
                title={project?.name ?? 'Проектная добавка'}
              />
            )
          })}
          {coverage.uncovered > 0 && (
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{
                width: getSegmentWidth(coverage.uncovered, progressMax),
              }}
              title="Сверх бюджета"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function BudgetSummary({
  coverage,
  limit,
  title,
}: {
  coverage: WeeklyBudgetCoverage
  limit: number
  title: string
}) {
  const remaining = coverage.totalAvailable - coverage.personalSpent
  const isOverBudget = coverage.uncovered > 0

  return (
    <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
      <span className="text-zinc-400">
        {title}:{' '}
        <span
          className={cn(
            'font-semibold',
            isOverBudget ? 'text-red-400' : 'text-emerald-400'
          )}
        >
          {formatCurrency(coverage.personalCovered)} / {formatCurrency(limit)}
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
          {formatCurrency(remaining)}
        </span>
      </span>
    </div>
  )
}

function PersonalBudgetSection({
  coverage,
  weeklyLimit,
  inputValue,
  onLimitChange,
  projectById,
}: {
  coverage: WeeklyBudgetCoverage
  weeklyLimit: number
  inputValue: string
  onLimitChange: (value: string, evaluated: number | null) => void
  projectById: Map<string, Project>
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-200">Личный бюджет</h3>
      </div>

      <BudgetProgress
        coverage={coverage}
        label="Покрытие недели"
        projectById={projectById}
      />
      <BudgetSummary
        coverage={coverage}
        limit={weeklyLimit}
        title="Личный бюджет"
      />

      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3 sm:text-sm">
          <span className="flex flex-col gap-0.5">
            <span className="text-zinc-500">Проектная добавка</span>
            <span className="whitespace-nowrap font-semibold text-sky-300">
              {formatCurrency(coverage.projectTopUp)}
            </span>
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-zinc-500">Покрыто проектами</span>
            <span className="whitespace-nowrap font-semibold text-sky-300">
              {formatCurrency(coverage.projectCovered)}
            </span>
          </span>
          {coverage.uncovered > 0 && (
            <span className="flex flex-col gap-0.5">
              <span className="text-zinc-500">Сверх бюджета</span>
              <span className="whitespace-nowrap font-semibold text-red-400">
                {formatCurrency(coverage.uncovered)}
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
                    {formatCurrency(segment.available)}
                  </span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <label className="text-xs text-zinc-400 sm:text-sm">Лимит:</label>
        <MathInput
          value={inputValue}
          onValueChange={onLimitChange}
          min={0}
          className="w-24 sm:w-32"
        />
        <span className="text-xs text-zinc-500 sm:text-sm">₽</span>
      </div>
    </section>
  )
}

function MemberList({ budget }: { budget: SharedBudget }) {
  return (
    <div className="flex flex-wrap gap-1.5 text-xs">
      {budget.members.length === 0 ? (
        <span className="text-zinc-500">
          Участники появятся после синхронизации
        </span>
      ) : (
        budget.members.map((member) => (
          <span
            key={member.userId}
            className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-zinc-300"
          >
            <Users className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <span className="min-w-0 truncate">
              {member.name ?? member.email ?? 'Участник'}
            </span>
            <span className="text-zinc-600">
              {member.role === 'owner' ? 'владелец' : 'участник'}
            </span>
          </span>
        ))
      )}
    </div>
  )
}

function SharedBudgetSection({
  budgets,
  activeBudget,
  coverage,
  selectedDate,
}: {
  budgets: SharedBudget[]
  activeBudget: SharedBudget | undefined
  coverage: WeeklyBudgetCoverage | undefined
  selectedDate: Date
}) {
  const createSharedBudget = useCreateSharedBudget()
  const setActiveSharedBudget = useSetActiveSharedBudget()
  const setSharedWeeklyLimit = useSetSharedWeeklyLimitForWeek()
  const archiveSharedBudget = useArchiveSharedBudget()
  const createInvite = useCreateSharedBudgetInvite()

  const [name, setName] = useState('')
  const [initialLimit, setInitialLimit] = useState('8000')
  const [sharedLimitInput, setSharedLimitInput] = useState('0')
  const [inviteUrl, setInviteUrl] = useState('')
  const [copyLabel, setCopyLabel] = useState('Копировать')
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (!activeBudget) {
      setSharedLimitInput('0')
      return
    }

    setSharedLimitInput(
      String(getEffectiveSharedWeeklyLimit(activeBudget, selectedDate))
    )
    setInviteUrl('')
  }, [activeBudget, selectedDate])

  const activeBudgets = budgets.filter((budget) => !budget.archivedAt)
  const effectiveWeekStart = getWeekBoundaries(selectedDate).start
  const isOwner = activeBudget?.role === 'owner'

  const handleCreate = () => {
    const trimmedName = name.trim()
    const limit = Number(initialLimit)

    if (!trimmedName || !Number.isFinite(limit) || limit < 0) {
      return
    }

    createSharedBudget.mutate({
      name: trimmedName,
      initialWeeklyLimit: limit,
      effectiveWeekStart,
    })
    setName('')
    setIsCreateOpen(false)
  }

  const handleSharedLimitChange = (value: string, evaluated: number | null) => {
    if (!activeBudget) return

    if (evaluated !== null) {
      setSharedWeeklyLimit.mutate({
        sharedBudgetId: activeBudget.id,
        effectiveWeekStart,
        amount: evaluated,
      })
      setSharedLimitInput(String(evaluated))
    } else {
      setSharedLimitInput(value)
    }
  }

  const handleInvite = () => {
    if (!activeBudget) return

    createInvite.mutate(activeBudget.id, {
      onSuccess: (result) => {
        setInviteUrl(result.inviteUrl)
        setCopyLabel('Копировать')
      },
    })
  }

  const handleCopy = async () => {
    if (!inviteUrl) return

    await navigator.clipboard?.writeText(inviteUrl)
    setCopyLabel('Скопировано')
  }

  const handleArchive = () => {
    if (!activeBudget) return

    archiveSharedBudget.mutate(activeBudget.id, {
      onSuccess: () => setIsArchiveOpen(false),
    })
  }

  return (
    <section className="space-y-3 border-t border-zinc-800 pt-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-zinc-200">Общий бюджет</h3>
        {activeBudgets.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              aria-label="Общий бюджет"
              value={activeBudget?.id ?? ''}
              onChange={(event) =>
                setActiveSharedBudget.mutate(event.target.value)
              }
              options={activeBudgets.map((budget) => ({
                value: budget.id,
                label: budget.name,
              }))}
              className="sm:w-52"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateOpen((value) => !value)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Новый
            </Button>
          </div>
        )}
      </div>

      {(activeBudgets.length === 0 || isCreateOpen) && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <Input
            aria-label="Название общего бюджета"
            placeholder="Общий бюджет"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <MathInput
            aria-label="Лимит общего бюджета"
            value={initialLimit}
            onValueChange={(value, evaluated) =>
              setInitialLimit(evaluated === null ? value : String(evaluated))
            }
            min={0}
          />
          <Button
            type="button"
            onClick={handleCreate}
            isLoading={createSharedBudget.isPending}
            disabled={!name.trim()}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Создать
          </Button>
        </div>
      )}

      {activeBudgets.length > 0 && !activeBudget && (
        <span className="text-sm text-zinc-500">
          Выберите общий бюджет для этой недели
        </span>
      )}

      {activeBudget && coverage && (
        <div className="space-y-3">
          <BudgetProgress coverage={coverage} label="Общие расходы" />
          <BudgetSummary
            coverage={coverage}
            limit={coverage.weeklyLimit}
            title="Общий бюджет"
          />

          <MemberList budget={activeBudget} />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <label className="text-xs text-zinc-400 sm:text-sm">Лимит:</label>
              <MathInput
                value={sharedLimitInput}
                onValueChange={handleSharedLimitChange}
                min={0}
                className="w-24 sm:w-32"
              />
              <span className="text-xs text-zinc-500 sm:text-sm">₽</span>
            </div>

            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {isOwner && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleInvite}
                  isLoading={createInvite.isPending}
                  className="w-full sm:w-auto"
                >
                  <Link2 className="h-4 w-4" />
                  Ссылка
                </Button>
              )}
              {isOwner && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setIsArchiveOpen(true)}
                  isLoading={archiveSharedBudget.isPending}
                  className="w-full sm:w-auto"
                >
                  <Archive className="h-4 w-4" />
                  Архив
                </Button>
              )}
            </div>
          </div>

          {inviteUrl && (
            <div className="flex flex-col gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-2 sm:flex-row sm:items-center">
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300">
                {inviteUrl}
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCopy}
                className="w-full sm:w-auto"
              >
                <Copy className="h-4 w-4" />
                {copyLabel}
              </Button>
            </div>
          )}

          <ConfirmDialog
            isOpen={isArchiveOpen}
            title="Архивировать общий бюджет?"
            description="Он исчезнет из выбора для новых расходов."
            confirmLabel="Архивировать"
            isConfirming={archiveSharedBudget.isPending}
            onConfirm={handleArchive}
            onClose={() => setIsArchiveOpen(false)}
          />
        </div>
      )}
    </section>
  )
}

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
  const { data: sharedBudgets = [], isLoading: isSharedBudgetsLoading } =
    useSharedBudgets()
  const [inputValue, setInputValue] = useState(String(weeklyLimit))

  useEffect(() => {
    setInputValue(String(weeklyLimit))
  }, [weeklyLimit])

  const activeSharedBudget = getActiveSharedBudget(sharedBudgets)
  const personalCoverage = getWeeklyBudgetCoverage(
    expenses,
    selectedDate,
    weeklyLimit
  )
  const sharedCoverage = activeSharedBudget
    ? getSharedWeeklyBudgetCoverage(
        expenses,
        activeSharedBudget.id,
        selectedDate,
        getEffectiveSharedWeeklyLimit(activeSharedBudget, selectedDate)
      )
    : undefined
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  )

  if (
    isSettingsLoading ||
    isExpensesLoading ||
    isProjectsLoading ||
    isSharedBudgetsLoading
  ) {
    return <WeeklyBudgetSkeleton />
  }

  const handleLimitChange = (value: string, evaluated: number | null) => {
    if (evaluated !== null) {
      setWeeklyLimitForDate(selectedDate, evaluated)
      setInputValue(String(evaluated))
    } else {
      setInputValue(value)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-medium text-zinc-100 sm:text-lg">
          Бюджет на неделю
        </h2>
        <span className="text-xs text-zinc-500 sm:text-sm">
          {formatWeekDate(personalCoverage.start)} -{' '}
          {formatWeekDate(personalCoverage.end)}
        </span>
      </div>

      <PersonalBudgetSection
        coverage={personalCoverage}
        weeklyLimit={weeklyLimit}
        inputValue={inputValue}
        onLimitChange={handleLimitChange}
        projectById={projectById}
      />

      <SharedBudgetSection
        budgets={sharedBudgets}
        activeBudget={activeSharedBudget}
        coverage={sharedCoverage}
        selectedDate={selectedDate}
      />
    </div>
  )
}
