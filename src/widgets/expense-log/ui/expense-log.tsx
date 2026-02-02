'use client'

import { Wallet } from 'lucide-react'

import { useExpenseStore, ExpenseList } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import { ExpenseForm } from '@/features/add-expense'
import { getDailyExpenses } from '@/shared/lib'
import { EmptyState } from '@/shared/ui'

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
  const selectedDate = useSessionStore((state) => state.selectedDate)
  const expenses = useExpenseStore((state) => state.expenses)
  const deleteExpense = useExpenseStore((state) => state.deleteExpense)
  const updateExpense = useExpenseStore((state) => state.updateExpense)

  // Get expenses for the selected date, excluding project expenses
  const dailyExpenses = getDailyExpenses(expenses, selectedDate).filter(
    (expense) => !expense.projectId
  )

  // Calculate daily total
  const dailyTotal = dailyExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  )

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

      {/* Expense List */}
      <div className="max-h-[400px] overflow-y-auto sm:max-h-[500px] lg:max-h-[600px]">
        {dailyExpenses.length > 0 ? (
          <ExpenseList
            expenses={dailyExpenses}
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
