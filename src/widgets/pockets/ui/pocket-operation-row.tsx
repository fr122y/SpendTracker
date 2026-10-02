'use client'

import {
  ExpenseCard,
  useDeleteExpense,
  useUpdateExpense,
} from '@/entities/expense'

import type { Expense } from '@/shared/types'

export function PocketOperationRow({ operation }: { operation: Expense }) {
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  return (
    <li>
      <ExpenseCard
        expense={operation}
        onDelete={(id) => deleteExpense.mutate(id)}
        onEdit={(id, data) => updateExpense.mutate({ id, data })}
        showDate
      />
    </li>
  )
}
