'use client'

import { useEffect, useState } from 'react'

import { useCategoryStore } from '@/entities/category'
import { useUpdateExpense } from '@/entities/expense'
import { Input, MathInput, Select } from '@/shared/ui'

import type { Expense } from '@/shared/types'

export function PocketOperationRow({
  operation,
  kind,
}: {
  operation: Expense
  kind: 'purchase' | 'transfer'
}) {
  const [amount, setAmount] = useState(String(operation.amount))
  const [description, setDescription] = useState(operation.description)
  const [date, setDate] = useState(operation.date)
  const [categoryName, setCategoryName] = useState(operation.category)
  const updateExpense = useUpdateExpense()
  const categories = useCategoryStore((state) => state.categories)
  const isPurchase = kind === 'purchase'

  useEffect(() => {
    setAmount(String(operation.amount))
    setDescription(operation.description)
    setDate(operation.date)
    setCategoryName(operation.category)
  }, [operation])

  const save = (data: Partial<Omit<Expense, 'id'>>) => {
    updateExpense.mutate({ id: operation.id, data })
  }

  const handleAmountChange = (value: string, evaluated: number | null) => {
    setAmount(value)
    if (evaluated !== null && evaluated > 0 && evaluated !== operation.amount) {
      save({ amount: evaluated })
      setAmount(String(evaluated))
    }
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
    if (!category || category.name === operation.category) return
    setCategoryName(category.name)
    save({ category: category.name, emoji: category.emoji })
  }

  const selectedCategoryId = categories.find(
    (category) => category.name === categoryName
  )?.id

  return (
    <li className="grid grid-cols-1 gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 sm:grid-cols-[minmax(0,1fr)_9rem_8rem] sm:items-end">
      <Input
        label="Комментарий"
        aria-label={`Комментарий операции ${operation.id}`}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        onBlur={handleDescriptionBlur}
        maxLength={240}
        disabled={updateExpense.isPending}
      />
      <MathInput
        label="Сумма"
        aria-label={`Сумма операции ${operation.id}`}
        value={amount}
        onValueChange={handleAmountChange}
        min={0}
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
        <div className="sm:col-span-3">
          <Select
            label="Категория"
            aria-label={`Категория операции ${operation.id}`}
            options={categories.map((category) => ({
              value: category.id,
              label: `${category.emoji} ${category.name}`,
            }))}
            value={selectedCategoryId ?? ''}
            onChange={(event) => handleCategoryChange(event.target.value)}
            placeholder="Выберите категорию"
            disabled={updateExpense.isPending}
          />
        </div>
      )}
      {updateExpense.isError && (
        <p role="alert" className="sm:col-span-3 text-xs text-red-400">
          Не удалось сохранить изменения.
        </p>
      )}
    </li>
  )
}
