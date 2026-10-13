'use client'

import { ExpenseCard } from './expense-card'

import type { Expense } from '@/shared/types'

interface ExpenseListProps {
  expenses: Expense[]
  onDelete: (id: string) => void
  onEdit?: (id: string, data: Partial<Omit<Expense, 'id'>>) => void
  showDate?: boolean
  /** Pocket names by pocket id, shown on the cards of pocket operations. */
  pocketNames?: ReadonlyMap<string, string>
}

export function ExpenseList({
  expenses,
  onDelete,
  onEdit,
  showDate = false,
  pocketNames,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return <div className="py-8 text-center text-zinc-500">Нет расходов</div>
  }

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="flex flex-col gap-2">
      {sortedExpenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onDelete={onDelete}
          onEdit={onEdit}
          showDate={showDate}
          pocketName={
            expense.pocketId ? pocketNames?.get(expense.pocketId) : undefined
          }
        />
      ))}
    </div>
  )
}
