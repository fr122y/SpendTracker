'use client'

import { useExpenseStore, ExpenseList } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import { ExpenseForm } from '@/features/add-expense'
import { getDailyExpenses } from '@/shared/lib'

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
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-100">
          Операции за {formattedDate}
        </h2>
        <span className="text-lg font-semibold text-emerald-400">
          {dailyTotal.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      {/* Expense Form */}
      <ExpenseForm />

      {/* Expense List */}
      <div className="max-h-[400px] overflow-y-auto">
        {dailyExpenses.length > 0 ? (
          <ExpenseList expenses={dailyExpenses} onDelete={deleteExpense} />
        ) : (
          <p className="py-4 text-center text-sm text-zinc-500">
            Нет операций за этот день
          </p>
        )}
      </div>
    </div>
  )
}
