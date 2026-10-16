'use client'

import {
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Pencil,
  Receipt,
  Users,
  Trash2,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { ConfirmDialog, MathInput } from '@/shared/ui'

import type { Expense } from '@/shared/types'

interface ExpenseCardProps {
  expense: Expense
  /** Omit to render the card without a delete action. */
  onDelete?: (id: string) => void
  onEdit?: (id: string, data: Partial<Omit<Expense, 'id'>>) => void
  showDate?: boolean
  /** Name of the operation's pocket; the badge falls back to a generic label without it. */
  pocketName?: string
  /** The pocket name is still loading: show a fixed-width placeholder instead of the generic label. */
  isPocketNameLoading?: boolean
  /** The operation belongs to an archived pocket: no edit or delete actions. */
  isPocketArchived?: boolean
  /** Opens the full editor (amount, description, category, date). */
  onOpenEditor?: (expense: Expense) => void
  /** The delete can be undone from a toast; the confirmation says so. */
  canUndoDelete?: boolean
}

/** Names a record in a delete confirmation: description, amount, and date. */
export function describeExpenseForDelete(expense: Expense): string {
  const description = expense.description.trim() || 'Без описания'
  return `«${description}» · ${expense.amount} ₽ · ${formatExpenseDate(expense.date)}`
}

export const ARCHIVED_POCKET_OPERATION_HINT =
  'Карман в архиве — восстановите, чтобы изменить'

function formatExpenseDate(date: string) {
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) {
    return date
  }

  return `${day}.${month}.${year}`
}

function getOperationMeta(expense: Expense, pocketName?: string) {
  if (expense.operationType === 'pocket_transfer') {
    return {
      // The category line already reads «Перевод из кармана»; the badge names the pocket.
      label: pocketName ?? 'Перевод из кармана',
      className: 'bg-violet-500/10 text-violet-300 ring-violet-500/30',
      Icon: ArrowUpRight,
    }
  }

  if (expense.pocketId) {
    return {
      label: pocketName ? `Из кармана: ${pocketName}` : 'Покупка из кармана',
      className: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
      Icon: Receipt,
    }
  }

  if (expense.operationType === 'project_withdrawal') {
    return {
      label: 'Взято из проекта',
      className: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
      Icon: ArrowDownLeft,
    }
  }

  if (expense.operationType === 'project_return') {
    return {
      label: 'Возврат в проект',
      className: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
      Icon: ArrowUpRight,
    }
  }

  if (expense.projectId) {
    return {
      label: 'Проектный расход',
      className: 'bg-blue-500/10 text-blue-300 ring-blue-500/30',
      Icon: Briefcase,
    }
  }

  if (expense.sharedBudgetId) {
    return {
      label: 'Общий расход',
      className: 'bg-violet-500/10 text-violet-300 ring-violet-500/30',
      Icon: Users,
    }
  }

  return {
    label: 'Личный расход',
    className: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
    Icon: Receipt,
  }
}

export function ExpenseCard({
  expense,
  onDelete: onDeleteProp,
  onEdit: onEditProp,
  showDate = false,
  pocketName,
  isPocketNameLoading = false,
  isPocketArchived = false,
  onOpenEditor: onOpenEditorProp,
  canUndoDelete = false,
}: ExpenseCardProps) {
  const onDelete = isPocketArchived ? undefined : onDeleteProp
  const onEdit = isPocketArchived ? undefined : onEditProp
  const onOpenEditor = isPocketArchived ? undefined : onOpenEditorProp
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editValue, setEditValue] = useState(String(expense.amount))
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelPendingBlurRef = useRef(false)
  const lastSavedAmountRef = useRef<number | null>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleAmountClick = () => {
    const operationType = expense.operationType ?? 'expense'
    if (
      onEdit &&
      (operationType === 'expense' || operationType === 'pocket_transfer')
    ) {
      cancelPendingBlurRef.current = false
      lastSavedAmountRef.current = null
      setEditValue(String(expense.amount))
      setIsEditing(true)
    }
  }

  const handleValueChange = (value: string, evaluated: number | null) => {
    if (evaluated !== null) {
      if (cancelPendingBlurRef.current) {
        cancelPendingBlurRef.current = false
        return
      }
      // Evaluation complete (blur/Enter) - save and exit edit mode
      if (
        evaluated !== expense.amount &&
        evaluated > 0 &&
        lastSavedAmountRef.current !== evaluated
      ) {
        lastSavedAmountRef.current = evaluated
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    cancelPendingBlurRef.current = true
    setEditValue(String(expense.amount))
    setIsEditing(false)
    event.currentTarget.blur()
  }

  const operationMeta = getOperationMeta(expense, pocketName)
  const OperationIcon = operationMeta.Icon
  const isPocketTransfer = expense.operationType === 'pocket_transfer'
  const showPocketBadgePlaceholder =
    Boolean(expense.pocketId) && !pocketName && isPocketNameLoading
  const canEditAmount =
    Boolean(onEdit) &&
    ((expense.operationType ?? 'expense') === 'expense' ||
      expense.operationType === 'pocket_transfer')

  // Enhanced contrast with border-zinc-700 and bg-zinc-900/70, shadow-md for depth, hover states for feedback
  return (
    <>
      <div
        data-operation-type={expense.operationType ?? 'expense'}
        className={`flex items-center justify-between rounded-lg border ${isPocketTransfer ? 'border-dashed border-violet-500/40' : 'border-zinc-700'} bg-zinc-900/70 shadow-md p-2 sm:p-3 transition-all duration-200 ease-out hover:bg-zinc-800/80 hover:border-zinc-600 hover:-translate-y-0.5 hover:shadow-lg`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{expense.emoji}</span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-100">
              {expense.description}
            </span>
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
              <span>{expense.category}</span>
              {showPocketBadgePlaceholder ? (
                <span
                  data-testid={`pocket-badge-placeholder-${expense.id}`}
                  aria-hidden="true"
                  className="inline-block h-[22px] w-24 animate-pulse rounded bg-zinc-800"
                />
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ring-1 ${operationMeta.className}`}
                >
                  <OperationIcon className="h-3 w-3" />
                  {operationMeta.label}
                </span>
              )}
              {isPocketArchived && (
                <span className="text-zinc-400">
                  {ARCHIVED_POCKET_OPERATION_HINT}
                </span>
              )}
              {showDate && (
                <span data-testid={`expense-date-${expense.id}`}>
                  {formatExpenseDate(expense.date)}
                </span>
              )}
              {expense.sharedBudgetId && (
                <>
                  <span>
                    Общий бюджет: {expense.sharedBudgetName ?? 'Общий бюджет'}
                  </span>
                  <span>Автор: {expense.authorName ?? 'участник'}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <MathInput
              ref={inputRef}
              value={editValue}
              onValueChange={handleValueChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-24 sm:w-20 text-right text-base sm:text-sm font-semibold min-h-11"
              aria-label="edit amount"
            />
          ) : (
            <button
              onClick={handleAmountClick}
              className={`text-base sm:text-sm font-semibold ${isPocketTransfer ? 'text-violet-300 hover:text-violet-200 active:text-violet-400' : 'text-emerald-400 hover:text-emerald-300 active:text-emerald-500'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 transition-colors cursor-pointer min-h-11 px-2 rounded-md`}
              aria-label="edit amount"
              disabled={!canEditAmount}
            >
              {expense.amount} ₽
            </button>
          )}
          {onOpenEditor && (
            <button
              type="button"
              onClick={() => onOpenEditor(expense)}
              aria-label="Изменить операцию"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100 sm:min-h-0 sm:min-w-0 sm:p-1"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              aria-label="delete"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400 sm:min-h-0 sm:min-w-0 sm:p-1"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Удалить операцию?"
        description={
          <>
            <span className="block text-zinc-200">
              {describeExpenseForDelete(expense)}
            </span>
            {!canUndoDelete && (
              <span className="mt-1 block">
                Операция будет удалена без возможности восстановления.
              </span>
            )}
          </>
        }
        confirmLabel="Удалить"
        onConfirm={() => {
          onDelete?.(expense.id)
          setIsDeleteDialogOpen(false)
        }}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </>
  )
}
