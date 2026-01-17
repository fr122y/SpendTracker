'use client'

import { Trash2 } from 'lucide-react'

import type { Expense } from '@/shared/types'

interface ExpenseCardProps {
  expense: Expense
  onDelete: (id: string) => void
}

export function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{expense.emoji}</span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-100">
            {expense.description}
          </span>
          <span className="text-xs text-zinc-500">{expense.category}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-emerald-400">
          {expense.amount} ₽
        </span>
        <button
          onClick={() => onDelete(expense.id)}
          aria-label="delete"
          className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
