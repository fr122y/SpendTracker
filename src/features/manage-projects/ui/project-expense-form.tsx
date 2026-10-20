'use client'

import { useState } from 'react'

import { useCategorize, useCategoryStore } from '@/entities/category'
import { useExpenseStore } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import {
  formatDate,
  getProjectCashOnHand,
  parseAmountInput,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_DESCRIPTION_TOO_LONG_MESSAGE,
  getTextLimitMessage,
  useSubmitLock,
  useFormDraft,
} from '@/shared/lib'
import { Button, Input, MathInput, Select } from '@/shared/ui'

import type { MoneyOperationType } from '@/shared/types'

interface ProjectExpenseFormProps {
  projectId: string
}

const PROJECT_MONEY_CATEGORY = 'Проектные деньги'
const PROJECT_MONEY_EMOJI = '💼'

export function ProjectExpenseForm({ projectId }: ProjectExpenseFormProps) {
  const draftKey = `project-expense:${projectId}`
  const [operationType, setOperationType] = useFormDraft<MoneyOperationType>(
    draftKey,
    'operationType',
    'expense'
  )
  const [description, setDescription] = useFormDraft(
    draftKey,
    'description',
    '',
    { input: true }
  )
  const [amount, setAmount] = useFormDraft(draftKey, 'amount', '', {
    input: true,
  })
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addExpense = useExpenseStore((state) => state.addExpense)
  const runLocked = useSubmitLock()
  const expenses = useExpenseStore((state) => state.expenses)
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
  const isMovement = operationType !== 'expense'
  const projectCashOnHand =
    operationType === 'project_return'
      ? Math.max(getProjectCashOnHand(expenses, projectId), 0)
      : null
  const parsedAmountInput = parseAmountInput(amount)
  const returnExceedsCash =
    projectCashOnHand !== null &&
    parsedAmountInput.ok &&
    parsedAmountInput.value > projectCashOnHand

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setSuggestedCategoryId(null)
    setSuggestedCategoryLabel('')
    setShowCategorySelect(false)
    setSelectedCategoryId('')
    setHasManualCategoryOverride(false)
  }

  // Recomputed on every description change, not only on blur, so the
  // suggestion label always matches the category that submit will save.
  // A manually chosen category is never overwritten.
  const updateSuggestion = (value: string) => {
    if (isMovement || !mappingsLoaded || hasManualCategoryOverride) return
    const normalizedDescription = value.trim()
    if (!normalizedDescription) {
      setSuggestedCategoryId(null)
      setSuggestedCategoryLabel('')
      setShowCategorySelect(false)
      setSelectedCategoryId('')
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
  }

  const submit = async () => {
    const normalizedDescription = description.trim()
    if (!normalizedDescription || !parsedAmountInput.ok) return
    const parsedAmount = parsedAmountInput.value
    if (returnExceedsCash) return

    setIsSubmitting(true)

    if (isMovement) {
      addExpense({
        id: crypto.randomUUID(),
        description: normalizedDescription,
        amount: parsedAmount,
        date: formatDate(selectedDate),
        category: PROJECT_MONEY_CATEGORY,
        emoji: PROJECT_MONEY_EMOJI,
        projectId,
        operationType,
      })

      resetForm()
      setIsSubmitting(false)
      return
    }

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
    if (shouldUseManualCategory && !selectedCategoryId) {
      setIsSubmitting(false)
      return
    }

    const category = shouldUseManualCategory
      ? categories.find((item) => item.id === selectedCategoryId)
      : categories.find((item) => item.id === resolvedSuggestedCategoryId)
    if (!category) {
      setIsSubmitting(false)
      return
    }

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
      projectId,
      operationType,
    })

    resetForm()
    setIsSubmitting(false)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // Enter in the amount field submits through requestSubmit, which does not
    // respect the disabled submit button.
    if (!isFormValid) return
    void runLocked(submit)
  }

  const isFormValid =
    description.trim() &&
    parsedAmountInput.ok &&
    !returnExceedsCash &&
    (isMovement || !showCategorySelect || !!selectedCategoryId)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
      <Select
        aria-label="Сценарий операции проекта"
        options={[
          { value: 'expense', label: 'Проектный расход' },
          { value: 'project_withdrawal', label: 'Взял из проекта' },
          { value: 'project_return', label: 'Вернул в проект' },
        ]}
        value={operationType}
        onChange={(e) => {
          const nextType = e.target.value as MoneyOperationType
          setOperationType(nextType)
          if (nextType !== 'expense') {
            setShowCategorySelect(false)
            setSuggestedCategoryId(null)
          }
        }}
        disabled={isSubmitting || isSavingMapping}
      />
      <Input
        placeholder="Описание расхода"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value)
          updateSuggestion(e.target.value)
        }}
        onBlur={() => updateSuggestion(description)}
        maxLength={EXPENSE_DESCRIPTION_MAX_LENGTH}
        error={getTextLimitMessage(
          description,
          EXPENSE_DESCRIPTION_MAX_LENGTH,
          EXPENSE_DESCRIPTION_TOO_LONG_MESSAGE
        )}
        disabled={isSubmitting || isSavingMapping}
      />
      <MathInput
        placeholder="Сумма, напр. 500+50"
        value={amount}
        onValueChange={(value) => setAmount(value)}
        disabled={isSubmitting || isSavingMapping}
        className="text-base sm:text-sm"
      />
      {returnExceedsCash && projectCashOnHand !== null && (
        <p role="alert" className="text-sm text-red-400">
          Нельзя вернуть больше, чем на руках:{' '}
          {projectCashOnHand.toLocaleString('ru-RU')} ₽
        </p>
      )}
      {suggestedCategoryId && !showCategorySelect && !isMovement && (
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
      {showCategorySelect && !isMovement && (
        <Select
          aria-label="Категория"
          options={categoryOptions}
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value)
            setHasManualCategoryOverride(true)
          }}
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
