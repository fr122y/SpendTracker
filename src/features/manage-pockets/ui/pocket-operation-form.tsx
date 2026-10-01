'use client'

import { useState } from 'react'

import { useCategoryStore } from '@/entities/category'
import { useAddExpense } from '@/entities/expense'
import { formatDate } from '@/shared/lib'
import { Button, Input, MathInput, Select } from '@/shared/ui'

import type { MoneyOperationType } from '@/shared/types'

type PocketOperationKind = 'purchase' | 'transfer'

export function PocketOperationForm({
  pocketId,
  kind,
  selectedDate,
  onDone,
}: {
  pocketId: string
  kind: PocketOperationKind
  selectedDate: Date
  onDone?: () => void
}) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(formatDate(selectedDate))
  const [category, setCategory] = useState('')
  const categories = useCategoryStore((state) => state.categories)
  const addExpense = useAddExpense()
  const isPurchase = kind === 'purchase'
  const numericAmount = Number(amount)
  const canSubmit =
    description.trim().length > 0 &&
    numericAmount > 0 &&
    date &&
    (!isPurchase || Boolean(category))

  const reset = () => {
    setDescription('')
    setAmount('')
    setDate(formatDate(selectedDate))
    setCategory('')
    onDone?.()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit || addExpense.isPending) return

    const selectedCategory = categories.find((item) => item.id === category)
    if (isPurchase && !selectedCategory) return

    const operationType: MoneyOperationType = isPurchase
      ? 'expense'
      : 'pocket_transfer'

    try {
      await addExpense.mutateAsync({
        description: description.trim(),
        amount: numericAmount,
        date,
        ...(selectedCategory && {
          category: selectedCategory.name,
          emoji: selectedCategory.emoji,
        }),
        pocketId,
        operationType,
      })
      reset()
    } catch {
      // The mutation state renders the retry message below.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        label="Комментарий"
        placeholder={isPurchase ? 'Что купили?' : 'Назначение перевода'}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength={240}
        disabled={addExpense.isPending}
      />
      <MathInput
        label="Сумма"
        placeholder="Например, 1500+250"
        value={amount}
        onValueChange={(value) => setAmount(value)}
        min={0}
        disabled={addExpense.isPending}
        className="text-base sm:text-sm"
      />
      <Input
        label="Дата"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        disabled={addExpense.isPending}
      />
      {isPurchase && (
        <Select
          label="Категория"
          aria-label="Категория покупки"
          options={categories.map((item) => ({
            value: item.id,
            label: `${item.emoji} ${item.name}`,
          }))}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Выберите категорию"
          disabled={addExpense.isPending}
        />
      )}
      <Button
        type="submit"
        disabled={!canSubmit || addExpense.isPending}
        isLoading={addExpense.isPending}
        className="w-full sm:w-auto"
      >
        {isPurchase ? 'Добавить покупку' : 'Перевести в расходы'}
      </Button>
      {addExpense.isError && (
        <p role="alert" className="text-sm text-red-400">
          Не удалось сохранить операцию. Попробуйте ещё раз.
        </p>
      )}
    </form>
  )
}
