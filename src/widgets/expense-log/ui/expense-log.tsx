'use client'

import { Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  useDeleteExpenseWithUndo,
  useExpenseStore,
  ExpenseList,
} from '@/entities/expense'
import { usePockets } from '@/entities/pocket'
import { useSessionStore } from '@/entities/session'
import { ExpenseForm } from '@/features/add-expense'
import { ExpenseEditDialog } from '@/features/edit-expense'
import { getDailyExpenseTotal, getDailyOperations } from '@/shared/lib'
import { Button, EmptyState } from '@/shared/ui'

import { ExpenseLogSkeleton } from './expense-log-skeleton'

import type { Expense } from '@/shared/types'

function formatDateRussian(date: Date): string {
  const day = date.getDate()
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ]
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

export function ExpenseLog() {
  const [operationFilter, setOperationFilter] = useState<
    'all' | 'expenses' | 'project' | 'pocket' | 'movement'
  >('all')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'personal' | 'shared'>(
    'all'
  )
  const selectedDate = useSessionStore((state) => state.selectedDate)
  const { expenses, isLoading, updateExpense } = useExpenseStore((state) => ({
    expenses: state.expenses,
    isLoading: state.isLoading,
    updateExpense: state.updateExpense,
  }))
  const deleteExpense = useDeleteExpenseWithUndo()
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const editingExpense = editingExpenseId
    ? expenses.find((expense: Expense) => expense.id === editingExpenseId)
    : undefined

  // Archived pockets stay in the map: their operations keep the pocket name.
  // The journal does not wait for this query: while it loads, pocket cards show
  // a placeholder badge; if it fails, they fall back to a generic badge.
  const { data: pockets, isPending: arePocketsLoading } = usePockets()
  const pocketNames = useMemo(
    () => new Map((pockets ?? []).map((pocket) => [pocket.id, pocket.name])),
    [pockets]
  )
  const archivedPocketIds = useMemo(
    () =>
      new Set(
        (pockets ?? [])
          .filter((pocket) => pocket.archivedAt)
          .map((pocket) => pocket.id)
      ),
    [pockets]
  )

  if (isLoading) {
    return <ExpenseLogSkeleton />
  }

  const dailyOperations = getDailyOperations(expenses, selectedDate)
  const filteredOperations = dailyOperations.filter((expense) => {
    if (scopeFilter === 'personal' && expense.sharedBudgetId) {
      return false
    }
    if (scopeFilter === 'shared' && !expense.sharedBudgetId) {
      return false
    }

    if (operationFilter === 'expenses') {
      return (expense.operationType ?? 'expense') === 'expense'
    }
    if (operationFilter === 'project') {
      return Boolean(expense.projectId)
    }
    if (operationFilter === 'pocket') {
      return Boolean(expense.pocketId)
    }
    if (operationFilter === 'movement') {
      return (expense.operationType ?? 'expense') !== 'expense'
    }
    return true
  })

  const dailyTotal = getDailyExpenseTotal(expenses, selectedDate)

  const formattedDate = formatDateRussian(selectedDate)

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-medium text-zinc-100 sm:text-lg">
          Операции за {formattedDate}
        </h2>
        <span
          data-testid="expense-log-total"
          className="whitespace-nowrap text-base font-semibold text-emerald-400 sm:text-lg"
        >
          {dailyTotal.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      {/* Expense Form */}
      <ExpenseForm />

      <div className="flex flex-wrap gap-2" aria-label="Фильтр бюджета">
        {(
          [
            ['all', 'Все'],
            ['personal', 'Личные'],
            ['shared', 'Общие'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={scopeFilter === value ? 'primary' : 'ghost'}
            onClick={() => setScopeFilter(value)}
            className="min-h-9 px-3 py-1 text-xs"
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Фильтр операций">
        {(
          [
            ['all', 'Все'],
            ['expenses', 'Расходы'],
            ['project', 'Проекты'],
            ['pocket', 'Карманы'],
            ['movement', 'Движение'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={operationFilter === value ? 'primary' : 'ghost'}
            onClick={() => setOperationFilter(value)}
            className="min-h-9 px-3 py-1 text-xs"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Expense List: on phones the page scrolls instead of the list */}
      <div
        data-testid="expense-log-list"
        className="md:max-h-[500px] md:overflow-y-auto lg:max-h-[600px]"
      >
        {filteredOperations.length > 0 ? (
          <ExpenseList
            expenses={filteredOperations}
            onDelete={deleteExpense}
            onEdit={updateExpense}
            onOpenEditor={(expense) => setEditingExpenseId(expense.id)}
            canUndoDelete
            pocketNames={pocketNames}
            arePocketNamesLoading={arePocketsLoading}
            archivedPocketIds={archivedPocketIds}
          />
        ) : (
          <EmptyState
            icon={Wallet}
            title="Нет операций за этот день"
            description="Добавьте операцию используя форму выше"
          />
        )}
      </div>
      {editingExpense && (
        <ExpenseEditDialog
          key={editingExpense.id}
          expense={editingExpense}
          onClose={() => setEditingExpenseId(null)}
        />
      )}
    </div>
  )
}
