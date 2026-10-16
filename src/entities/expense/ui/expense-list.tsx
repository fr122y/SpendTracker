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
  /** Pocket names are still loading: pocket cards show a placeholder badge. */
  arePocketNamesLoading?: boolean
  /** Ids of archived pockets; their operations render without edit or delete. */
  archivedPocketIds?: ReadonlySet<string>
  /** Opens the full editor for a record. */
  onOpenEditor?: (expense: Expense) => void
  /** Deletes can be undone from a toast. */
  canUndoDelete?: boolean
}

export function ExpenseList({
  expenses,
  onDelete,
  onEdit,
  showDate = false,
  pocketNames,
  arePocketNamesLoading = false,
  archivedPocketIds,
  onOpenEditor,
  canUndoDelete = false,
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
          onOpenEditor={onOpenEditor}
          canUndoDelete={canUndoDelete}
          showDate={showDate}
          isPocketNameLoading={arePocketNamesLoading}
          isPocketArchived={Boolean(
            expense.pocketId && archivedPocketIds?.has(expense.pocketId)
          )}
          pocketName={
            expense.pocketId ? pocketNames?.get(expense.pocketId) : undefined
          }
        />
      ))}
    </div>
  )
}
