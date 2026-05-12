'use client'

import { Wallet } from 'lucide-react'
import { useState } from 'react'

import { useExpenseStore, ExpenseList } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import { ExpenseForm } from '@/features/add-expense'
import { getDailyExpenseTotal, getDailyOperations } from '@/shared/lib'
import { Button, EmptyState } from '@/shared/ui'

import { ExpenseLogSkeleton } from './expense-log-skeleton'

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
  const [filter, setFilter] = useState<
    'all' | 'expenses' | 'project' | 'movement'
  >('all')
  const selectedDate = useSessionStore((state) => state.selectedDate)
  const { expenses, isLoading, deleteExpense, updateExpense } = useExpenseStore(
    (state) => ({
      expenses: state.expenses,
      isLoading: state.isLoading,
      deleteExpense: state.deleteExpense,
      updateExpense: state.updateExpense,
    })
  )

  if (isLoading) {
    return <ExpenseLogSkeleton />
  }

  const dailyOperations = getDailyOperations(expenses, selectedDate)
  const filteredOperations = dailyOperations.filter((expense) => {
    if (filter === 'expenses') {
      return (expense.operationType ?? 'expense') === 'expense'
    }
    if (filter === 'project') {
      return Boolean(expense.projectId)
    }
    if (filter === 'movement') {
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
        <span className="text-base font-semibold text-emerald-400 sm:text-lg">
          {dailyTotal.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      {/* Expense Form */}
      <ExpenseForm />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', 'Все'],
            ['expenses', 'Расходы'],
            ['project', 'Проекты'],
            ['movement', 'Движение'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? 'primary' : 'ghost'}
            onClick={() => setFilter(value)}
            className="min-h-9 px-3 py-1 text-xs"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Expense List */}
      <div className="max-h-[400px] overflow-y-auto sm:max-h-[500px] lg:max-h-[600px]">
        {filteredOperations.length > 0 ? (
          <ExpenseList
            expenses={filteredOperations}
            onDelete={deleteExpense}
            onEdit={updateExpense}
          />
        ) : (
          <EmptyState
            icon={Wallet}
            title="Нет операций за этот день"
            description="Добавьте операцию используя форму выше"
          />
        )}
      </div>
    </div>
  )
}
