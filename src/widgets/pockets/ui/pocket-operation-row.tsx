'use client'

import {
  ExpenseCard,
  useDeleteExpense,
  useUpdateExpense,
} from '@/entities/expense'

import type { Expense } from '@/shared/types'

export function PocketOperationRow({
  operation,
  readOnly = false,
}: {
  operation: Expense
  /** An archived pocket's history is shown without edit or delete actions. */
  readOnly?: boolean
}) {
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  return (
    <li>
      <ExpenseCard
        expense={operation}
        isPocketArchived={readOnly}
        onDelete={readOnly ? undefined : (id) => deleteExpense.mutate(id)}
        onEdit={
          readOnly
            ? undefined
            : (id, data) => updateExpense.mutate({ id, data })
        }
        showDate
      />
    </li>
  )
}
