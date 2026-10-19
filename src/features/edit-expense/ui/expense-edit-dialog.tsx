'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useCategoryStore } from '@/entities/category'
import {
  ARCHIVED_POCKET_OPERATION_HINT,
  useUpdateExpense,
} from '@/entities/expense'
import { useSaveKeywordMapping } from '@/entities/keyword-mapping'
import { usePockets } from '@/entities/pocket'
import { parseAmountInput, useBackDismiss } from '@/shared/lib'
import { Button, Input, MathInput, Select } from '@/shared/ui'

import { buildExpensePatch, getExpenseEditRules } from '../model/edit-rules'

import type { Expense } from '@/shared/types'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

interface ExpenseEditDialogProps {
  expense: Expense
  onClose: () => void
}

export function ExpenseEditDialog({
  expense,
  onClose,
}: ExpenseEditDialogProps) {
  const titleId = useId()
  // Browser Back closes the dialog instead of leaving the page.
  useBackDismiss(true, onClose)
  const descriptionInputRef = useRef<HTMLInputElement>(null)
  const categories = useCategoryStore((state) => state.categories)
  const { data: pockets } = usePockets()
  const updateExpense = useUpdateExpense()
  const saveKeywordMapping = useSaveKeywordMapping()
  const rules = getExpenseEditRules(expense)
  const isPocketArchived = Boolean(
    expense.pocketId &&
    pockets?.some(
      (pocket) => pocket.id === expense.pocketId && pocket.archivedAt
    )
  )

  const [description, setDescription] = useState(expense.description)
  const [amount, setAmount] = useState(String(expense.amount))
  const [date, setDate] = useState(expense.date)
  const [categoryName, setCategoryName] = useState(expense.category)

  const parsedAmount = parseAmountInput(amount, {
    allowZero: rules.allowZeroAmount,
  })
  const categoryOptions = useMemo(() => {
    const options = categories.map((category) => ({
      value: category.name,
      label: `${category.emoji} ${category.name}`,
    }))
    // A record may still carry a category the user has since removed.
    if (!categories.some((category) => category.name === expense.category)) {
      options.unshift({
        value: expense.category,
        label: `${expense.emoji} ${expense.category}`,
      })
    }
    return options
  }, [categories, expense.category, expense.emoji])

  const isValid =
    description.trim().length > 0 &&
    DATE_PATTERN.test(date) &&
    (!rules.canEditAmount || parsedAmount.ok)
  const patch = parsedAmount.ok
    ? buildExpensePatch(
        expense,
        { description, amount: parsedAmount.value, date, categoryName },
        categories
      )
    : null
  const hasChanges = patch !== null && Object.keys(patch).length > 0
  const isReadOnly = isPocketArchived

  useEffect(() => {
    descriptionInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (isReadOnly || !isValid || !patch || !hasChanges) return
    // One optimistic update; the server rounds and bounds-checks the amount
    // and rolls back with a toast if it rejects the change.
    updateExpense.mutate({ id: expense.id, data: patch })
    // A manual category change is remembered as an exact rule for the whole
    // phrase; the rule mutation rolls back on its own and never blocks the edit.
    if (patch.category) {
      const category = categories.find((item) => item.name === patch.category)
      const phrase = patch.description ?? expense.description
      if (category && phrase.trim()) {
        saveKeywordMapping.mutate({ keyword: phrase, categoryId: category.id })
      }
    }
    onClose()
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  return createPortal(
    <div
      data-testid="expense-edit-backdrop"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl sm:p-6"
      >
        <h2 id={titleId} className="text-lg font-semibold text-zinc-100">
          Изменить операцию
        </h2>
        {isReadOnly && (
          <p role="note" className="text-sm text-zinc-400">
            {ARCHIVED_POCKET_OPERATION_HINT}
          </p>
        )}
        <Input
          ref={descriptionInputRef}
          label="Описание"
          id={`${titleId}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={isReadOnly}
        />
        <MathInput
          label="Сумма"
          id={`${titleId}-amount`}
          value={amount}
          allowZero={rules.allowZeroAmount}
          onValueChange={(value) => setAmount(value)}
          disabled={isReadOnly || !rules.canEditAmount}
          className="text-base sm:text-sm"
        />
        <div>
          <Select
            label="Категория"
            id={`${titleId}-category`}
            options={categoryOptions}
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            disabled={isReadOnly || !rules.canEditCategory}
          />
          {rules.categoryHint && (
            <p className="mt-1 text-xs text-zinc-400">{rules.categoryHint}</p>
          )}
        </div>
        <Input
          label="Дата"
          id={`${titleId}-date`}
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          disabled={isReadOnly}
          required
        />
        <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={isReadOnly || !isValid || !hasChanges}
            className="w-full sm:w-auto"
          >
            Сохранить
          </Button>
        </div>
      </form>
    </div>,
    document.body
  )
}
