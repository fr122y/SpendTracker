'use client'

import { useCallback, useEffect, useState } from 'react'

import { useCategorize, useCategoryStore } from '@/entities/category'
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
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(
    null
  )
  const [suggestedCategoryLabel, setSuggestedCategoryLabel] = useState('')
  const [showCategorySelect, setShowCategorySelect] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [hasManualCategoryOverride, setHasManualCategoryOverride] =
    useState(false)
  const [shouldResolveCategory, setShouldResolveCategory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const categories = useCategoryStore((state) => state.categories)
  const addExpense = useAddExpense()
  const {
    categorize,
    saveMappingAndGetResult,
    mappingsLoaded,
    isSavingMapping,
  } = useCategorize()
  const isPurchase = kind === 'purchase'
  const numericAmount = Number(amount)
  const isBusy = addExpense.isPending || isSubmitting || isSavingMapping
  const canSubmit =
    description.trim().length > 0 &&
    numericAmount > 0 &&
    Boolean(date) &&
    (!isPurchase || !showCategorySelect || Boolean(selectedCategoryId))

  const reset = () => {
    setDescription('')
    setAmount('')
    setDate(formatDate(selectedDate))
    setSuggestedCategoryId(null)
    setSuggestedCategoryLabel('')
    setShowCategorySelect(false)
    setSelectedCategoryId('')
    setHasManualCategoryOverride(false)
    setShouldResolveCategory(false)
    setIsSubmitting(false)
    onDone?.()
  }

  const resolveCategory = useCallback(
    (value: string) => {
      const normalizedDescription = value.trim()
      setShouldResolveCategory(false)
      if (!normalizedDescription) return

      const result = categorize(normalizedDescription)
      if (result.found) {
        setSuggestedCategoryId(result.categoryId)
        setSuggestedCategoryLabel(
          `${result.categoryEmoji} ${result.categoryName}`
        )
        setSelectedCategoryId(result.categoryId)
        setShowCategorySelect(false)
        return
      }

      setSuggestedCategoryId(null)
      setSuggestedCategoryLabel('')
      setSelectedCategoryId('')
      setShowCategorySelect(true)
    },
    [categorize]
  )

  const handleDescriptionBlur = () => {
    if (!isPurchase || hasManualCategoryOverride) return
    if (!mappingsLoaded) {
      setShouldResolveCategory(true)
      return
    }

    resolveCategory(description)
  }

  useEffect(() => {
    if (!isPurchase || !mappingsLoaded || !shouldResolveCategory) return
    if (hasManualCategoryOverride) {
      setShouldResolveCategory(false)
      return
    }

    resolveCategory(description)
  }, [
    description,
    hasManualCategoryOverride,
    isPurchase,
    mappingsLoaded,
    resolveCategory,
    shouldResolveCategory,
  ])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit || isBusy) return
    if (isPurchase && !mappingsLoaded && !hasManualCategoryOverride) {
      setShouldResolveCategory(true)
      return
    }

    setIsSubmitting(true)
    let resolvedSuggestedCategoryId = suggestedCategoryId
    let resolvedShowCategorySelect = showCategorySelect

    if (
      isPurchase &&
      !resolvedSuggestedCategoryId &&
      mappingsLoaded &&
      !hasManualCategoryOverride
    ) {
      const result = categorize(description.trim())
      if (result.found) {
        resolvedSuggestedCategoryId = result.categoryId
        setSuggestedCategoryId(result.categoryId)
        setSuggestedCategoryLabel(
          `${result.categoryEmoji} ${result.categoryName}`
        )
        setSelectedCategoryId(result.categoryId)
        setShowCategorySelect(false)
      } else {
        resolvedShowCategorySelect = true
        setShowCategorySelect(true)
      }
    }

    const shouldUseManualCategory =
      resolvedShowCategorySelect || !resolvedSuggestedCategoryId
    if (isPurchase && shouldUseManualCategory && !selectedCategoryId) {
      setIsSubmitting(false)
      return
    }

    const selectedCategory = isPurchase
      ? categories.find(
          (item) =>
            item.id ===
            (shouldUseManualCategory
              ? selectedCategoryId
              : resolvedSuggestedCategoryId)
        )
      : undefined
    if (isPurchase && !selectedCategory) {
      setIsSubmitting(false)
      return
    }

    if (isPurchase && shouldUseManualCategory && selectedCategory) {
      try {
        await saveMappingAndGetResult(description.trim(), selectedCategory.id)
      } catch {
        // Mapping mutations handle optimistic rollback and error feedback.
      }
    }

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
      setIsSubmitting(false)
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
        onBlur={handleDescriptionBlur}
        maxLength={240}
        disabled={isBusy}
      />
      <MathInput
        label="Сумма"
        placeholder="Например, 1500+250"
        value={amount}
        onValueChange={(value) => setAmount(value)}
        min={0}
        disabled={isBusy}
        className="text-base sm:text-sm"
      />
      <Input
        label="Дата"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        disabled={isBusy}
      />
      {isPurchase && !mappingsLoaded && description.trim() && (
        <p aria-live="polite" className="text-xs text-zinc-500">
          Подбираем категорию…
        </p>
      )}
      {suggestedCategoryId && !showCategorySelect && isPurchase && (
        <div className="text-sm text-zinc-300">
          <span className="mr-2">Категория:</span>
          <span className="font-medium">{suggestedCategoryLabel}</span>
          <button
            type="button"
            onClick={() => setShowCategorySelect(true)}
            className="ml-3 text-blue-400 underline underline-offset-2"
            disabled={isBusy}
          >
            Изменить
          </button>
        </div>
      )}
      {showCategorySelect && isPurchase && (
        <Select
          label="Категория"
          aria-label="Категория покупки"
          options={categories.map((item) => ({
            value: item.id,
            label: `${item.emoji} ${item.name}`,
          }))}
          value={selectedCategoryId}
          onChange={(event) => {
            setSelectedCategoryId(event.target.value)
            setHasManualCategoryOverride(true)
          }}
          placeholder="Выберите категорию"
          disabled={isBusy}
        />
      )}
      <Button
        type="submit"
        disabled={!canSubmit || isBusy}
        isLoading={isBusy}
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
