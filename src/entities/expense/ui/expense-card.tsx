'use client'

import { Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { MathInput } from '@/shared/ui/math-input'

import type { Expense } from '@/shared/types'

interface ExpenseCardProps {
  expense: Expense
  onDelete: (id: string) => void
  onEdit?: (id: string, data: Partial<Omit<Expense, 'id'>>) => void
}

export function ExpenseCard({ expense, onDelete, onEdit }: ExpenseCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(expense.amount))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleAmountClick = () => {
    if (onEdit) {
      setEditValue(String(expense.amount))
      setIsEditing(true)
    }
  }

  const handleValueChange = (value: string, evaluated: number | null) => {
    if (evaluated !== null) {
      // Evaluation complete (blur/Enter) - save and exit edit mode
      if (evaluated !== expense.amount && evaluated > 0) {
        onEdit?.(expense.id, { amount: evaluated })
      }
      setIsEditing(false)
    } else {
      // Still typing
      setEditValue(value)
    }
  }

  const handleBlur = () => {
    // MathInput handles evaluation on blur, but we need to exit edit mode
    // if the value is unchanged or invalid
    setIsEditing(false)
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 sm:p-3">
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
        {isEditing ? (
          <MathInput
            ref={inputRef}
            value={editValue}
            onValueChange={handleValueChange}
            onBlur={handleBlur}
            min={0}
            className="w-24 sm:w-20 text-right text-base sm:text-sm font-semibold min-h-11"
            aria-label="edit amount"
          />
        ) : (
          <button
            onClick={handleAmountClick}
            className="text-base sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 active:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 transition-colors cursor-pointer min-h-11 px-2 rounded-md"
            aria-label="edit amount"
            disabled={!onEdit}
          >
            {expense.amount} ₽
          </button>
        )}
        <button
          onClick={() => onDelete(expense.id)}
          aria-label="delete"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400 sm:min-h-0 sm:min-w-0 sm:p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
