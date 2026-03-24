'use client'

import { useState } from 'react'

import { useCategoryStore } from '@/entities/category'
import { useExpenseStore } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import { useCategorize } from '@/features/add-expense/model/use-categorize'
import { formatDate } from '@/shared/lib'
import { Button, Input, MathInput, Select } from '@/shared/ui'

export function ExpenseForm() {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(
    null
  )
  const [suggestedCategoryLabel, setSuggestedCategoryLabel] = useState('')
  const [showCategorySelect, setShowCategorySelect] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addExpense = useExpenseStore((state) => state.addExpense)
  const categories = useCategoryStore((state) => state.categories)
  const selectedDate = useSessionStore((state) => state.selectedDate)
  const {
    categorize,
    saveMappingAndGetResult,
    mappingsLoaded,
    isSavingMapping,
  } = useCategorize()

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: `${category.emoji} ${category.name}`,
  }))

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setSuggestedCategoryId(null)
    setSuggestedCategoryLabel('')
    setShowCategorySelect(false)
    setSelectedCategoryId('')
  }

  const handleDescriptionBlur = () => {
    if (!mappingsLoaded) return
    const normalizedDescription = description.trim()
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedDescription = description.trim()
    const parsedAmount = Number(amount)
    if (!normalizedDescription || !amount || parsedAmount <= 0) return

    let resolvedSuggestedCategoryId = suggestedCategoryId
    let resolvedShowCategorySelect = showCategorySelect

    if (!resolvedSuggestedCategoryId && mappingsLoaded) {
      const result = categorize(normalizedDescription)
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
    if (shouldUseManualCategory && !selectedCategoryId) return

    const category = shouldUseManualCategory
      ? categories.find((item) => item.id === selectedCategoryId)
      : categories.find((item) => item.id === resolvedSuggestedCategoryId)
    if (!category) return

    setIsSubmitting(true)
    if (shouldUseManualCategory) {
      try {
        await saveMappingAndGetResult(normalizedDescription, category.id)
      } catch {
        // Rollback toast is handled inside keyword mapping mutation.
      }
    }

    addExpense({
      id: crypto.randomUUID(),
      description: normalizedDescription,
      amount: parsedAmount,
      date: formatDate(selectedDate),
      category: category.name,
      emoji: category.emoji,
    })

    resetForm()
    setIsSubmitting(false)
  }

  const isFormValid =
    description.trim() &&
    amount &&
    Number(amount) > 0 &&
    (!showCategorySelect || !!selectedCategoryId)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
      <Input
        placeholder="Описание расхода"
        aria-label="Описание расхода"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        disabled={isSubmitting || isSavingMapping}
      />
      <MathInput
        placeholder="Сумма (можно ввести выражение, напр. 500+50)"
        aria-label="Сумма расхода"
        value={amount}
        onValueChange={(value) => setAmount(value)}
        min={0}
        disabled={isSubmitting || isSavingMapping}
        className="text-base sm:text-sm"
      />
      {suggestedCategoryId && !showCategorySelect && (
        <div className="text-sm text-zinc-300">
          <span className="mr-2">Категория:</span>
          <span className="font-medium">{suggestedCategoryLabel}</span>
          <button
            type="button"
            onClick={() => setShowCategorySelect(true)}
            className="ml-3 text-blue-400 underline underline-offset-2"
            disabled={isSubmitting || isSavingMapping}
          >
            Изменить
          </button>
        </div>
      )}
      {showCategorySelect && (
        <Select
          aria-label="Категория"
          options={categoryOptions}
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          placeholder="Выберите категорию"
          disabled={isSubmitting || isSavingMapping}
        />
      )}
      <Button
        type="submit"
        disabled={!isFormValid || isSubmitting || isSavingMapping}
        isLoading={isSubmitting || isSavingMapping}
        className="w-full sm:w-auto"
      >
        Добавить
      </Button>
    </form>
  )
}
