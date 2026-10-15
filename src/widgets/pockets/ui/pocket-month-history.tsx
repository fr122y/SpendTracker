'use client'

import { useMemo, useState } from 'react'

import { usePocketMonthBudgets } from '@/entities/pocket'
import { getPocketMonthHistory } from '@/shared/lib'

import { formatPocketCurrency, formatPocketPeriod } from './pocket-format'

import type { Expense, PocketMonthBudget } from '@/shared/types'

const PAGE_SIZE = 12

export function PocketMonthHistory({
  pocket,
  selectedPeriod,
  expenses,
  monthBudget,
}: {
  pocket: { id: string; name: string; createdAt: string }
  selectedPeriod: string
  expenses: Expense[]
  monthBudget: PocketMonthBudget | null | undefined
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const budgetsQuery = usePocketMonthBudgets(isOpen ? pocket.id : '')

  const months = useMemo(() => {
    const budgets = (budgetsQuery.data ?? []).filter(
      (budget) => budget.period !== monthBudget?.period
    )
    if (monthBudget) budgets.push(monthBudget)
    return getPocketMonthHistory({
      pocketId: pocket.id,
      pocketCreatedAt: pocket.createdAt,
      budgets,
      expenses,
      selectedPeriod,
    })
  }, [
    budgetsQuery.data,
    expenses,
    monthBudget,
    pocket.createdAt,
    pocket.id,
    selectedPeriod,
  ])
  const visibleMonths = months.slice(0, visibleCount)

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950/50 px-3 py-2 text-left text-sm text-zinc-300 transition hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        История по месяцам
        <span className="text-xs text-zinc-500">
          {isOpen ? 'Скрыть' : 'Показать'}
        </span>
      </button>

      {isOpen && (
        <div aria-label="История кармана по месяцам" className="space-y-2">
          {budgetsQuery.isLoading ? (
            <p className="text-sm text-zinc-500">Загрузка истории…</p>
          ) : budgetsQuery.isError && !budgetsQuery.data ? (
            <p role="alert" className="text-sm text-red-300">
              Не удалось загрузить историю по месяцам.
            </p>
          ) : visibleMonths.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-800 p-4 text-center text-sm text-zinc-500">
              Карман ещё не существовал в этом месяце.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
              {visibleMonths.map((month) => {
                const isOverspent = month.remaining < 0
                return (
                  <li
                    key={month.period}
                    data-testid={`pocket-history-${month.period}`}
                    className="flex flex-col gap-1 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-zinc-200">
                        {formatPocketPeriod(month.period)}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        Бюджет {formatPocketCurrency(month.budget)}
                        {month.isBudgetSaved ? '' : ' (перенесён)'} · Потрачено{' '}
                        {formatPocketCurrency(month.spent)}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 font-mono text-sm ${isOverspent ? 'text-red-400' : 'text-emerald-300'}`}
                    >
                      {isOverspent ? 'Перерасход' : 'Остаток'}{' '}
                      {formatPocketCurrency(Math.abs(month.remaining))}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {months.length > visibleCount && (
            <button
              type="button"
              className="min-h-11 w-full rounded-lg text-sm text-blue-300 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Показать ещё
            </button>
          )}
        </div>
      )}
    </div>
  )
}
