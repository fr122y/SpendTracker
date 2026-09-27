'use client'

import { X } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  filterExpensesByNameGroups,
  getCategoryExpenseBase,
  groupExpenseDescriptions,
  groupExpensesByDate,
  type ExpenseNameGroup,
} from '../lib/category-expense-details'

import type { CategoryStat, ExpenseScope } from '@/shared/lib'
import type { Expense } from '@/shared/types'

const SCOPE_LABELS: Record<ExpenseScope, string> = {
  all: 'Все расходы',
  personal: 'Личные',
  shared: 'Общие',
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), summary, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface AnalysisCategoryDetailsDialogProps {
  category: CategoryStat
  expenses: Expense[]
  selectedDate: Date
  scope: ExpenseScope
  triggerRef: { current: HTMLButtonElement | null }
  onClose: () => void
}

interface ExpenseDetailRowProps {
  expense: Expense
}

interface NameGroupFilterProps {
  groups: ExpenseNameGroup[]
  selectedGroupKeys: ReadonlySet<string>
  onToggle: (groupKey: string) => void
  showAll: boolean
  onToggleExpanded: () => void
  hasMoreGroups: boolean
  totalGroups: number
}

function formatExpenseDate(date: string): string {
  const [year, month, day] = date.split('-')
  return year && month && day ? `${day}.${month}.${year}` : date
}

function NameGroupFilter({
  groups,
  selectedGroupKeys,
  onToggle,
  showAll,
  onToggleExpanded,
  hasMoreGroups,
  totalGroups,
}: NameGroupFilterProps) {
  const displayedGroups = useMemo(
    () =>
      showAll
        ? groups
        : groups.filter(
            (group, index) => index < 8 || selectedGroupKeys.has(group.key)
          ),
    [groups, selectedGroupKeys, showAll]
  )

  if (groups.length === 0) return null

  return (
    <section aria-label="Фильтр по названию расхода" className="space-y-3">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Названия расходов"
      >
        {displayedGroups.map((group) => (
          <div
            key={group.key}
            className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 p-1"
          >
            <button
              type="button"
              aria-pressed={selectedGroupKeys.has(group.key)}
              onClick={() => onToggle(group.key)}
              className="min-h-9 rounded-full px-3 text-xs text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 aria-pressed:bg-emerald-500/20 aria-pressed:text-emerald-200"
            >
              {group.label}
              <span className="ml-1 text-zinc-400">{group.variantCount}</span>
            </button>
            <details className="group relative">
              <summary
                aria-label={`Варианты названия ${group.label}`}
                className="flex min-h-9 min-w-9 cursor-pointer list-none items-center justify-center rounded-full px-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 [&::-webkit-details-marker]:hidden"
              >
                <span aria-hidden="true">···</span>
              </summary>
              <ul className="absolute right-0 top-full z-10 mt-1 max-h-48 min-w-44 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-xs text-zinc-200 shadow-xl">
                {group.variants.map((variant) => (
                  <li
                    key={`${group.key}:${variant.description}`}
                    className="flex items-start justify-between gap-3 px-2 py-1.5"
                  >
                    <span>{variant.description || 'Без описания'}</span>
                    <span className="shrink-0 text-zinc-500">
                      {variant.count}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>
      {hasMoreGroups && (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={onToggleExpanded}
          className="min-h-9 rounded-md px-2 text-sm text-emerald-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {showAll ? 'Свернуть' : `Показать все (${totalGroups})`}
        </button>
      )}
    </section>
  )
}

function ExpenseDetailRow({ expense }: ExpenseDetailRowProps) {
  const operationLabel = expense.sharedBudgetId
    ? 'Общий расход'
    : expense.projectId
      ? 'Проектный расход'
      : 'Личный расход'

  return (
    <article
      data-testid={`category-expense-${expense.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="shrink-0 text-xl">
          {expense.emoji}
        </span>
        <div className="min-w-0">
          <p className="break-words text-sm font-medium text-zinc-100">
            {expense.description || 'Без описания'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{operationLabel}</p>
        </div>
      </div>
      <span className="shrink-0 text-sm font-semibold text-emerald-300">
        {expense.amount.toLocaleString('ru-RU')} ₽
      </span>
    </article>
  )
}

export function AnalysisCategoryDetailsDialog({
  category,
  expenses,
  selectedDate,
  scope,
  triggerRef,
  onClose,
}: AnalysisCategoryDetailsDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [showAllGroups, setShowAllGroups] = useState(false)
  const [selectedGroupKeyValues, setSelectedGroupKeyValues] = useState<
    string[]
  >([])
  const baseExpenses = useMemo(
    () => getCategoryExpenseBase(expenses, selectedDate, scope, category.name),
    [category.name, expenses, scope, selectedDate]
  )
  const nameGroups = useMemo(
    () => groupExpenseDescriptions(baseExpenses),
    [baseExpenses]
  )
  const selectedGroupKeys = useMemo(
    () => new Set(selectedGroupKeyValues),
    [selectedGroupKeyValues]
  )
  const filteredExpenses = useMemo(
    () =>
      filterExpensesByNameGroups(baseExpenses, nameGroups, selectedGroupKeys),
    [baseExpenses, nameGroups, selectedGroupKeys]
  )
  const dateGroups = useMemo(
    () => groupExpensesByDate(filteredExpenses),
    [filteredExpenses]
  )
  const baseSum = baseExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const filteredSum = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  )
  const monthLabel = selectedDate.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  const handleClose = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    const triggerElement = triggerRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      triggerElement?.focus()
    }
  }, [triggerRef])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      const firstElement = focusableElements?.[0]
      const lastElement = focusableElements?.[focusableElements.length - 1]

      if (!firstElement || !lastElement) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }

      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault()
        firstElement.focus()
        return
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) handleClose()
  }

  const handleToggleGroup = (groupKey: string) => {
    setSelectedGroupKeyValues((current) => {
      const nextKeys = new Set(current)

      if (nextKeys.has(groupKey)) {
        nextKeys.delete(groupKey)
      } else {
        nextKeys.add(groupKey)
      }

      return [...nextKeys]
    })
  }

  return createPortal(
    <div
      data-testid="analysis-category-details-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:flex md:items-center md:justify-center md:p-4"
      onClick={handleBackdropClick}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        data-testid="analysis-category-details-dialog"
        className="flex h-full w-full flex-col overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl md:max-h-[90vh] md:max-w-3xl md:rounded-xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-900 px-4 py-3 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-zinc-100">
              Расходы: {category.name}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-zinc-400">
              {monthLabel} · {SCOPE_LABELS[scope]}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Закрыть расходы категории"
            onClick={handleClose}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <NameGroupFilter
            groups={nameGroups}
            selectedGroupKeys={selectedGroupKeys}
            onToggle={handleToggleGroup}
            showAll={showAllGroups}
            onToggleExpanded={() => setShowAllGroups((value) => !value)}
            hasMoreGroups={nameGroups.length > 8}
            totalGroups={nameGroups.length}
          />

          <p
            data-testid="analysis-category-details-summary"
            aria-live="polite"
            className="text-sm text-zinc-400"
          >
            Найдено: {filteredExpenses.length} из {baseExpenses.length} ·{' '}
            {filteredSum.toLocaleString('ru-RU')} ₽ из{' '}
            {baseSum.toLocaleString('ru-RU')} ₽
          </p>

          {baseExpenses.length === 0 ? (
            <p
              data-testid="analysis-category-details-empty-base"
              className="py-8 text-center text-sm text-zinc-400"
            >
              В этой категории нет расходов за выбранный период
            </p>
          ) : filteredExpenses.length === 0 ? (
            <p
              data-testid="analysis-category-details-empty-filter"
              className="py-8 text-center text-sm text-zinc-400"
            >
              Нет расходов с выбранными названиями
            </p>
          ) : (
            <div
              data-testid="analysis-category-details-list"
              className="space-y-5"
            >
              {dateGroups.map((dateGroup) => (
                <section
                  key={dateGroup.date}
                  aria-label={formatExpenseDate(dateGroup.date)}
                  className="space-y-2"
                >
                  <h3 className="text-sm font-medium text-zinc-400">
                    {formatExpenseDate(dateGroup.date)}
                  </h3>
                  <div className="space-y-2">
                    {dateGroup.expenses.map((expense) => (
                      <ExpenseDetailRow key={expense.id} expense={expense} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body
  )
}
