'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useCategorize, useCategoryStore } from '@/entities/category'
import { useAddExpense } from '@/entities/expense'
import { POCKET_PURCHASE_HINT, POCKET_TRANSFER_HINT } from '@/entities/pocket'
import {
  formatDate,
  parseAmountInput,
  useFormDraft,
  useSubmitLock,
} from '@/shared/lib'
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
  const draftKey = `pocket-operation:${pocketId}:${kind}`
  const [description, setDescription] = useFormDraft(
    draftKey,
    'description',
    ''
  )
  const [amount, setAmount] = useFormDraft(draftKey, 'amount', '')
  const [suggestedCategoryId, setSuggestedCategoryId] = useFormDraft<
    string | null
  >(draftKey, 'suggestedCategoryId', null)
  const [suggestedCategoryLabel, setSuggestedCategoryLabel] = useFormDraft(
    draftKey,
    'suggestedCategoryLabel',
    ''
  )
  const [showCategorySelect, setShowCategorySelect] = useFormDraft(
    draftKey,
    'showCategorySelect',
    false
  )
  const [selectedCategoryId, setSelectedCategoryId] = useFormDraft(
    draftKey,
    'selectedCategoryId',
    ''
  )
  const [hasManualCategoryOverride, setHasManualCategoryOverride] =
    useFormDraft(draftKey, 'hasManualCategoryOverride', false)
  const [shouldResolveCategory, setShouldResolveCategory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const categories = useCategoryStore((state) => state.categories)
  const addExpense = useAddExpense()
  const runLocked = useSubmitLock()
  const parsedAmount = parseAmountInput(amount)
  // Enter turns `500+50` into `550` after submit; the same number is not a
  // new operation.
  const numericAmount = parsedAmount.ok ? parsedAmount.value : null
  // One id per entered operation: a retry after a failed request reuses it,
  // so the server stores the operation at most once.
  const operationIdRef = useRef<string | null>(null)
  useEffect(() => {
    // Edited input is a new operation, not a retry.
    operationIdRef.current = null
  }, [description, numericAmount, selectedCategoryId, kind])
  const {
    categorize,
    saveMappingAndGetResult,
    mappingsLoaded,
    isSavingMapping,
  } = useCategorize()
  const isPurchase = kind === 'purchase'
  const isBusy = addExpense.isPending || isSubmitting || isSavingMapping
  const canSubmit =
    description.trim().length > 0 &&
    numericAmount !== null &&
    (!isPurchase || !showCategorySelect || Boolean(selectedCategoryId))

  const reset = () => {
    setDescription('')
    setAmount('')
    setSuggestedCategoryId(null)
    setSuggestedCategoryLabel('')
    setShowCategorySelect(false)
    setSelectedCategoryId('')
    setHasManualCategoryOverride(false)
    setShouldResolveCategory(false)
    setIsSubmitting(false)
    operationIdRef.current = null
    onDone?.()
  }

  const resolveCategory = useCallback(
    (value: string) => {
      const normalizedDescription = value.trim()
      setShouldResolveCategory(false)
      if (!normalizedDescription) {
        setSuggestedCategoryId(null)
        setSuggestedCategoryLabel('')
        setSelectedCategoryId('')
        setShowCategorySelect(false)
        return
      }

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
    [
      categorize,
      setSelectedCategoryId,
      setShowCategorySelect,
      setSuggestedCategoryId,
      setSuggestedCategoryLabel,
    ]
  )

  // Recomputed on every description change, not only on blur, so the
  // suggestion label always matches the category that submit will save.
  const updateSuggestion = (value: string) => {
    if (!isPurchase || hasManualCategoryOverride) return
    if (!mappingsLoaded) {
      setShouldResolveCategory(true)
      return
    }

    resolveCategory(value)
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

  const submit = async () => {
    if (!canSubmit || isBusy || numericAmount === null) return
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

    operationIdRef.current ??= crypto.randomUUID()
    try {
      await addExpense.mutateAsync({
        id: operationIdRef.current,
        description: description.trim(),
        amount: numericAmount,
        date: formatDate(selectedDate),
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void runLocked(submit)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-xs text-zinc-400">
        {isPurchase ? POCKET_PURCHASE_HINT : POCKET_TRANSFER_HINT}
      </p>
      <Input
        label="Комментарий"
        placeholder={isPurchase ? 'Что купили?' : 'Назначение перевода'}
        value={description}
        onChange={(event) => {
          setDescription(event.target.value)
          updateSuggestion(event.target.value)
        }}
        onBlur={() => updateSuggestion(description)}
        maxLength={240}
        disabled={isBusy}
      />
      <MathInput
        label="Сумма"
        placeholder="Например, 1500+250"
        value={amount}
        onValueChange={(value) => setAmount(value)}
        disabled={isBusy}
        className="text-base sm:text-sm"
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
