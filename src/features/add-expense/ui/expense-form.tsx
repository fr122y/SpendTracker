'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  useCategoryStore,
  useSharedBudgetCategories,
} from '@/entities/category'
import { useExpenseStore } from '@/entities/expense'
import { useProjectStore } from '@/entities/project'
import { useSessionStore } from '@/entities/session'
import {
  getActiveSharedBudget,
  useSharedBudgets,
} from '@/entities/shared-budget'
import {
  useCategorize,
  useSharedCategorize,
} from '@/features/add-expense/model/use-categorize'
import { formatDate } from '@/shared/lib'
import { Button, Input, MathInput, Select } from '@/shared/ui'

import type { MoneyOperationType, SharedBudget } from '@/shared/types'

const PROJECT_MONEY_CATEGORY = 'Проектные деньги'
const PROJECT_MONEY_EMOJI = '💼'
type OperationScenario =
  | 'personal_expense'
  | 'shared_expense'
  | 'project_expense'
  | 'project_withdrawal'
  | 'project_return'

function getSharedBudgetOptions(budgets: SharedBudget[]) {
  const activeBudget = getActiveSharedBudget(budgets)
  const activeBudgets = budgets.filter((budget) => !budget.archivedAt)
  const activeBudgetId = activeBudget?.id

  return activeBudgets.sort((a, b) => {
    if (a.id === activeBudgetId) return -1
    if (b.id === activeBudgetId) return 1
    return a.name.localeCompare(b.name, 'ru')
  })
}

export function ExpenseForm() {
  const [scenario, setScenario] =
    useState<OperationScenario>('personal_expense')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedSharedBudgetId, setSelectedSharedBudgetId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(
    null
  )
  const [suggestedCategoryLabel, setSuggestedCategoryLabel] = useState('')
  const [showCategorySelect, setShowCategorySelect] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [hasManualCategoryOverride, setHasManualCategoryOverride] =
    useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addExpense = useExpenseStore((state) => state.addExpense)
  const categories = useCategoryStore((state) => state.categories)
  const projects = useProjectStore((state) => state.projects)
  const selectedDate = useSessionStore((state) => state.selectedDate)
  const { data: sharedBudgets = [] } = useSharedBudgets()
  const {
    categorize,
    saveMappingAndGetResult,
    mappingsLoaded,
    isSavingMapping,
  } = useCategorize()

  const sharedBudgetOptions = useMemo(
    () => getSharedBudgetOptions(sharedBudgets),
    [sharedBudgets]
  )
  const selectedSharedBudget =
    sharedBudgetOptions.find(
      (budget) => budget.id === selectedSharedBudgetId
    ) ?? sharedBudgetOptions[0]
  const isSharedExpense = scenario === 'shared_expense'
  const { data: sharedCategories = [] } = useSharedBudgetCategories(
    isSharedExpense ? selectedSharedBudget?.id : undefined
  )
  const {
    categorize: categorizeShared,
    saveMappingAndGetResult: saveSharedMappingAndGetResult,
    mappingsLoaded: sharedMappingsLoaded,
    isSavingMapping: isSavingSharedMapping,
  } = useSharedCategorize(
    isSharedExpense ? selectedSharedBudget?.id : undefined
  )
  const isSavingAnyMapping = isSavingMapping || isSavingSharedMapping

  useEffect(() => {
    if (selectedSharedBudgetId) {
      const exists = sharedBudgetOptions.some(
        (budget) => budget.id === selectedSharedBudgetId
      )
      if (exists) return
    }

    setSelectedSharedBudgetId(selectedSharedBudget?.id ?? '')
  }, [selectedSharedBudget?.id, selectedSharedBudgetId, sharedBudgetOptions])

  const personalCategoryOptions = categories.map((category) => ({
    value: category.id,
    label: `${category.emoji} ${category.name}`,
  }))
  const sharedCategoryOptions = sharedCategories.map((category) => ({
    value: category.id,
    label: `${category.emoji} ${category.name}`,
  }))
  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }))
  const sharedBudgetSelectOptions = sharedBudgetOptions.map((budget) => ({
    value: budget.id,
    label: budget.name,
  }))
  const operationType: MoneyOperationType =
    scenario === 'project_withdrawal' || scenario === 'project_return'
      ? scenario
      : 'expense'
  const isMovement = operationType !== 'expense'
  const needsProject =
    scenario === 'project_expense' ||
    scenario === 'project_withdrawal' ||
    scenario === 'project_return'

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setSuggestedCategoryId(null)
    setSuggestedCategoryLabel('')
    setShowCategorySelect(false)
    setSelectedCategoryId('')
    setHasManualCategoryOverride(false)
  }

  const resetCategorySelection = () => {
    setSuggestedCategoryId(null)
    setSuggestedCategoryLabel('')
    setShowCategorySelect(false)
    setSelectedCategoryId('')
  }

  const handleDescriptionBlur = () => {
    if (isMovement) return
    const normalizedDescription = description.trim()
    if (!normalizedDescription) return
    if (hasManualCategoryOverride) return

    if (isSharedExpense) {
      if (!sharedMappingsLoaded) return

      const result = categorizeShared(normalizedDescription)
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
      return
    }

    if (!mappingsLoaded) return

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
    if (needsProject && !selectedProjectId) return
    if (isSharedExpense && !selectedSharedBudget?.id) return

    setIsSubmitting(true)

    if (isMovement) {
      addExpense({
        id: crypto.randomUUID(),
        description: normalizedDescription,
        amount: parsedAmount,
        date: formatDate(selectedDate),
        category: PROJECT_MONEY_CATEGORY,
        emoji: PROJECT_MONEY_EMOJI,
        projectId: selectedProjectId,
        operationType,
      })

      resetForm()
      setIsSubmitting(false)
      return
    }

    if (isSharedExpense) {
      let resolvedSuggestedCategoryId = suggestedCategoryId
      let resolvedShowCategorySelect = showCategorySelect

      if (
        !resolvedSuggestedCategoryId &&
        sharedMappingsLoaded &&
        !hasManualCategoryOverride
      ) {
        const result = categorizeShared(normalizedDescription)
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

      if (
        (resolvedShowCategorySelect || !resolvedSuggestedCategoryId) &&
        !selectedCategoryId
      ) {
        setIsSubmitting(false)
        return
      }

      const categoryId =
        resolvedShowCategorySelect || !resolvedSuggestedCategoryId
          ? selectedCategoryId
          : resolvedSuggestedCategoryId
      const sharedCategory = sharedCategories.find(
        (item) => item.id === categoryId
      )

      if (!selectedSharedBudget || !sharedCategory) {
        setIsSubmitting(false)
        return
      }

      if (resolvedShowCategorySelect || !resolvedSuggestedCategoryId) {
        try {
          await saveSharedMappingAndGetResult(
            normalizedDescription,
            sharedCategory.id
          )
        } catch {
          // Rollback toast is handled inside shared keyword mapping mutation.
        }
      }

      addExpense({
        id: crypto.randomUUID(),
        description: normalizedDescription,
        amount: parsedAmount,
        date: formatDate(selectedDate),
        category: sharedCategory.name,
        emoji: sharedCategory.emoji,
        sharedBudgetId: selectedSharedBudget.id,
        sharedBudgetCategoryId: sharedCategory.id,
        sharedBudgetName: selectedSharedBudget.name,
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
      projectId: scenario === 'project_expense' ? selectedProjectId : undefined,
      operationType,
    })

    resetForm()
    setIsSubmitting(false)
  }

  const isFormValid =
    description.trim() &&
    amount &&
    Number(amount) > 0 &&
    (!needsProject || !!selectedProjectId) &&
    (!isSharedExpense ||
      (!!selectedSharedBudget?.id && !!selectedCategoryId)) &&
    (!showCategorySelect || !!selectedCategoryId)

  const scenarioOptions = [
    { value: 'personal_expense', label: 'Личный расход' },
    ...(sharedBudgetOptions.length > 0
      ? [{ value: 'shared_expense', label: 'Общий расход' }]
      : []),
    { value: 'project_expense', label: 'Проектный расход' },
    { value: 'project_withdrawal', label: 'Взял из проекта' },
    { value: 'project_return', label: 'Вернул в проект' },
  ]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
      <div>
        <Select
          aria-label="Сценарий операции"
          options={scenarioOptions}
          value={scenario}
          onChange={(e) => {
            const nextScenario = e.target.value as OperationScenario
            setScenario(nextScenario)
            resetCategorySelection()

            if (
              nextScenario === 'project_withdrawal' ||
              nextScenario === 'project_return'
            ) {
              return
            }

            if (nextScenario === 'shared_expense') {
              setSelectedSharedBudgetId(selectedSharedBudget?.id ?? '')
            }
          }}
          disabled={isSubmitting || isSavingAnyMapping}
        />
      </div>
      {isSharedExpense && sharedBudgetOptions.length > 1 && (
        <Select
          aria-label="Общий бюджет"
          options={sharedBudgetSelectOptions}
          value={selectedSharedBudget?.id ?? ''}
          onChange={(e) => {
            setSelectedSharedBudgetId(e.target.value)
            resetCategorySelection()
          }}
          placeholder="Выберите общий бюджет"
          disabled={isSubmitting || isSavingAnyMapping}
        />
      )}
      {needsProject && (
        <Select
          aria-label="Проект"
          options={projectOptions}
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          placeholder="Выберите проект"
          disabled={isSubmitting || isSavingAnyMapping}
        />
      )}
      <Input
        placeholder="Описание расхода"
        aria-label="Описание расхода"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        disabled={isSubmitting || isSavingAnyMapping}
      />
      <MathInput
        placeholder="Сумма (можно ввести выражение, напр. 500+50)"
        aria-label="Сумма расхода"
        value={amount}
        onValueChange={(value) => setAmount(value)}
        min={0}
        disabled={isSubmitting || isSavingAnyMapping}
        className="text-base sm:text-sm"
      />
      {suggestedCategoryId && !showCategorySelect && !isMovement && (
        <div className="text-sm text-zinc-300">
          <span className="mr-2">Категория:</span>
          <span className="font-medium">{suggestedCategoryLabel}</span>
          <button
            type="button"
            onClick={() => setShowCategorySelect(true)}
            className="ml-3 text-blue-400 underline underline-offset-2"
            disabled={isSubmitting || isSavingAnyMapping}
          >
            Изменить
          </button>
        </div>
      )}
      {isSharedExpense && (!suggestedCategoryId || showCategorySelect) && (
        <Select
          aria-label="Категория общего бюджета"
          options={sharedCategoryOptions}
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value)
            setHasManualCategoryOverride(true)
          }}
          placeholder="Выберите категорию"
          disabled={isSubmitting || isSavingAnyMapping}
        />
      )}
      {showCategorySelect && !isMovement && !isSharedExpense && (
        <Select
          aria-label="Категория"
          options={personalCategoryOptions}
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value)
            setHasManualCategoryOverride(true)
          }}
          placeholder="Выберите категорию"
          disabled={isSubmitting || isSavingAnyMapping}
        />
      )}
      <Button
        type="submit"
        disabled={!isFormValid || isSubmitting || isSavingAnyMapping}
        isLoading={isSubmitting || isSavingAnyMapping}
        className="w-full sm:w-auto"
      >
        Добавить
      </Button>
    </form>
  )
}
