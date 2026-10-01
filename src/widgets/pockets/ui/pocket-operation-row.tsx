'use client'

import { useEffect, useState } from 'react'

import { useCategoryStore } from '@/entities/category'
import {
  ExpenseCard,
  useDeleteExpense,
  useUpdateExpense,
} from '@/entities/expense'
import { Button, Input, Select } from '@/shared/ui'

import type { Expense } from '@/shared/types'

export function PocketOperationRow({
  operation,
  kind,
}: {
  operation: Expense
  kind: 'purchase' | 'transfer'
}) {
  const [description, setDescription] = useState(operation.description)
  const [date, setDate] = useState(operation.date)
  const [categoryName, setCategoryName] = useState(operation.category)
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()
  const categories = useCategoryStore((state) => state.categories)
  const isPurchase = kind === 'purchase'

  useEffect(() => {
    setDescription(operation.description)
    setDate(operation.date)
    setCategoryName(operation.category)
  }, [operation])

  const save = (data: Partial<Omit<Expense, 'id'>>) => {
    updateExpense.mutate({ id: operation.id, data })
  }

  const handleDescriptionBlur = () => {
    const normalized = description.trim()
    if (normalized && normalized !== operation.description) {
      save({ description: normalized })
    }
  }

  const handleDateChange = (nextDate: string) => {
    setDate(nextDate)
    if (nextDate && nextDate !== operation.date) save({ date: nextDate })
  }

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId)
    if (!category || category.name === operation.category) {
      setIsEditingCategory(false)
      return
    }
    setCategoryName(category.name)
    save({ category: category.name, emoji: category.emoji })
    setIsEditingCategory(false)
  }

  const selectedCategoryId = categories.find(
    (category) => category.name === categoryName
  )?.id

  return (
    <li className="space-y-2">
      <ExpenseCard
        expense={operation}
        onDelete={(id) => deleteExpense.mutate(id)}
        onEdit={(id, data) => updateExpense.mutate({ id, data })}
        showDate
      />
      <div className="grid grid-cols-1 gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-end">
        <Input
          label="Комментарий"
          aria-label={`Комментарий операции ${operation.id}`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onBlur={handleDescriptionBlur}
          maxLength={240}
          disabled={updateExpense.isPending}
        />
        <Input
          label="Дата"
          aria-label={`Дата операции ${operation.id}`}
          type="date"
          value={date}
          onChange={(event) => handleDateChange(event.target.value)}
          disabled={updateExpense.isPending}
        />
        {isPurchase && (
          <div className="flex flex-col gap-2 sm:col-span-2">
            {isEditingCategory ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Select
                    label="Категория"
                    aria-label={`Категория операции ${operation.id}`}
                    options={categories.map((category) => ({
                      value: category.id,
                      label: `${category.emoji} ${category.name}`,
                    }))}
                    value={selectedCategoryId ?? ''}
                    onChange={(event) =>
                      handleCategoryChange(event.target.value)
                    }
                    placeholder="Выберите категорию"
                    disabled={updateExpense.isPending}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditingCategory(false)}
                >
                  Отмена
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditingCategory(true)}
                className="min-h-9 self-start px-2 text-xs"
              >
                Изменить категорию
              </Button>
            )}
          </div>
        )}
        {updateExpense.isError && (
          <p role="alert" className="sm:col-span-2 text-xs text-red-400">
            Не удалось сохранить изменения.
          </p>
        )}
        {deleteExpense.isError && (
          <p role="alert" className="sm:col-span-2 text-xs text-red-400">
            Не удалось удалить операцию. Изменения отменены.
          </p>
        )}
      </div>
    </li>
  )
}
