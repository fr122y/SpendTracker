'use client'

import { Archive, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  getDefaultReassignTarget,
  isSharedCategoryNameDuplicate,
  useAddSharedBudgetCategory,
  useArchiveSharedBudgetCategory,
  useCategoryExpenseCount,
  useCategoryStore,
  useSharedBudgetCategories,
  useUpdateCategory,
  useUpdateSharedBudgetCategory,
} from '@/entities/category'
import {
  useDeleteKeywordMapping,
  useDeleteSharedKeywordMapping,
  useKeywordMappings,
  useSharedKeywordMappings,
} from '@/entities/keyword-mapping'
import {
  getActiveSharedBudget,
  useSharedBudgets,
} from '@/entities/shared-budget'
import {
  CATEGORY_NAME_MAX_LENGTH,
  CATEGORY_NAME_TOO_LONG_MESSAGE,
  getCategoryColor,
  getTextLimitMessage,
  isCategoryNameTooLong,
  limitGraphemes,
  pluralizeRu,
  useSubmitLock,
  HIDES_CALCULATOR_PROPS,
} from '@/shared/lib'
import { Button, ConfirmDialog, EmptyState, Input, Select } from '@/shared/ui'

import { CategoryColorPicker } from './category-color-picker'
import { CategoryManagerSkeleton } from './category-manager-skeleton'
import { CategoryRules, groupRulesByCategory } from './category-rules'

import type { Category, SharedBudgetCategory } from '@/shared/types'

type CategoryMode = 'personal' | 'shared'

export function CategoryManager() {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const runLocked = useSubmitLock()
  const [categoryPendingDelete, setCategoryPendingDelete] =
    useState<Category | null>(null)
  const [mode, setMode] = useState<CategoryMode>('personal')
  const [selectedSharedBudgetId, setSelectedSharedBudgetId] = useState('')
  const [sharedName, setSharedName] = useState('')
  const [sharedEmoji, setSharedEmoji] = useState('')
  const [sharedColor, setSharedColor] = useState<string | null>(null)
  const [sharedError, setSharedError] = useState('')
  const [editingSharedCategory, setEditingSharedCategory] =
    useState<SharedBudgetCategory | null>(null)
  const [sharedCategoryPendingArchive, setSharedCategoryPendingArchive] =
    useState<SharedBudgetCategory | null>(null)

  const { categories, isLoading, addCategoryIfUnique, deleteCategory } =
    useCategoryStore((state) => ({
      categories: state.categories,
      isLoading: state.isLoading,
      addCategoryIfUnique: state.addCategoryIfUnique,
      deleteCategory: state.deleteCategory,
    }))
  const updateCategory = useUpdateCategory()
  const { data: sharedBudgets = [], isLoading: isSharedBudgetsLoading } =
    useSharedBudgets()
  const activeSharedBudget = getActiveSharedBudget(sharedBudgets)
  const activeSharedBudgets = useMemo(
    () => sharedBudgets.filter((budget) => !budget.archivedAt),
    [sharedBudgets]
  )
  const selectedSharedBudget =
    activeSharedBudgets.find(
      (budget) => budget.id === selectedSharedBudgetId
    ) ??
    activeSharedBudget ??
    activeSharedBudgets[0]
  const { data: sharedCategories = [], isLoading: isSharedCategoriesLoading } =
    useSharedBudgetCategories(selectedSharedBudget?.id)
  const addSharedCategory = useAddSharedBudgetCategory(
    selectedSharedBudget?.id ?? ''
  )
  const updateSharedCategory = useUpdateSharedBudgetCategory(
    selectedSharedBudget?.id ?? ''
  )
  const archiveSharedCategory = useArchiveSharedBudgetCategory(
    selectedSharedBudget?.id ?? ''
  )
  const { data: keywordMappings = [], isLoading: areRulesLoading } =
    useKeywordMappings()
  const deleteKeywordMapping = useDeleteKeywordMapping()
  const { data: sharedKeywordMappings = [], isLoading: areSharedRulesLoading } =
    useSharedKeywordMappings(
      mode === 'shared' ? selectedSharedBudget?.id : undefined
    )
  const deleteSharedKeywordMapping = useDeleteSharedKeywordMapping(
    selectedSharedBudget?.id ?? ''
  )
  const rulesByCategory = useMemo(
    () => groupRulesByCategory(keywordMappings),
    [keywordMappings]
  )
  const sharedRulesByCategory = useMemo(
    () => groupRulesByCategory(sharedKeywordMappings),
    [sharedKeywordMappings]
  )

  useEffect(() => {
    if (mode !== 'shared') return

    const hasSelectedBudget = activeSharedBudgets.some(
      (budget) => budget.id === selectedSharedBudgetId
    )
    const nextBudgetId = activeSharedBudget?.id ?? activeSharedBudgets[0]?.id
    if (!hasSelectedBudget && nextBudgetId) {
      setSelectedSharedBudgetId(nextBudgetId)
    }
  }, [activeSharedBudget, activeSharedBudgets, mode, selectedSharedBudgetId])

  if (isLoading) {
    return <CategoryManagerSkeleton />
  }

  if (mode === 'shared' && isSharedBudgetsLoading) {
    return <CategoryManagerSkeleton />
  }

  const submit = () => {
    setError('')

    if (!name.trim() || !emoji.trim()) return

    if (editingCategory) {
      const normalized = name.trim().toLowerCase()
      const isDuplicate = categories.some(
        (category) =>
          category.id !== editingCategory.id &&
          category.name.toLowerCase() === normalized
      )
      if (isDuplicate) {
        setError('Категория с таким названием уже существует')
        return
      }

      updateCategory.mutate({
        id: editingCategory.id,
        name: name.trim(),
        emoji: emoji.trim(),
        color,
      })
      resetPersonalForm()
      return
    }

    const success = addCategoryIfUnique({
      id: crypto.randomUUID(),
      name: name.trim(),
      emoji: emoji.trim(),
    })

    if (!success) {
      setError('Категория с таким названием уже существует')
      return
    }

    setName('')
    setEmoji('')
  }

  const resetPersonalForm = () => {
    setName('')
    setEmoji('')
    setColor(null)
    setError('')
    setEditingCategory(null)
  }

  const startPersonalEdit = (category: Category) => {
    setEditingCategory(category)
    setName(category.name)
    setEmoji(category.emoji)
    setColor(category.color ?? null)
    setError('')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void runLocked(submit)
  }

  // A legacy name over the limit stays valid while it is unchanged.
  const isNameTooLong =
    name.trim() !== (editingCategory?.name.trim() ?? '') &&
    isCategoryNameTooLong(name)
  const isSharedNameTooLong =
    sharedName.trim() !== (editingSharedCategory?.name.trim() ?? '') &&
    isCategoryNameTooLong(sharedName)
  const isFormValid = name.trim() && emoji.trim() && !isNameTooLong
  const isSharedFormValid =
    sharedName.trim() && sharedEmoji.trim() && !isSharedNameTooLong

  const resetSharedForm = () => {
    setSharedName('')
    setSharedEmoji('')
    setSharedColor(null)
    setSharedError('')
    setEditingSharedCategory(null)
  }

  const submitShared = async () => {
    setSharedError('')

    if (!selectedSharedBudget || !isSharedFormValid) return

    const nextCategory = {
      name: sharedName.trim(),
      emoji: sharedEmoji.trim(),
    }

    if (
      isSharedCategoryNameDuplicate(
        nextCategory.name,
        sharedCategories,
        editingSharedCategory?.id
      )
    ) {
      setSharedError('Категория с таким названием уже существует')
      return
    }

    try {
      if (editingSharedCategory) {
        await updateSharedCategory.mutateAsync({
          id: editingSharedCategory.id,
          ...nextCategory,
          color: sharedColor,
        })
      } else {
        await addSharedCategory.mutateAsync(nextCategory)
      }
      resetSharedForm()
    } catch {
      // The mutation hooks roll back and show the error toast.
    }
  }

  const handleSharedSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void runLocked(submitShared)
  }

  const startSharedEdit = (category: SharedBudgetCategory) => {
    setEditingSharedCategory(category)
    setSharedName(category.name)
    setSharedEmoji(category.emoji)
    setSharedColor(category.color ?? null)
    setSharedError('')
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-2 gap-2 rounded-md bg-zinc-900 p-1">
        <button
          type="button"
          onClick={() => setMode('personal')}
          className={`min-h-11 rounded px-3 text-sm font-medium transition wide:min-h-10 ${
            mode === 'personal'
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Личные
        </button>
        <button
          type="button"
          onClick={() => setMode('shared')}
          className={`min-h-11 rounded px-3 text-sm font-medium transition wide:min-h-10 ${
            mode === 'shared'
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Общие
        </button>
      </div>

      {mode === 'personal' && (
        <>
          <ul className="@container flex flex-col gap-2">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-col gap-2 rounded-lg bg-zinc-800/50 p-2 @md:flex-row @md:items-start @md:justify-between @md:gap-3 @md:p-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <CategoryColorDot category={category} />
                    <span className="shrink-0 text-xl">{category.emoji}</span>
                    <span
                      title={category.name}
                      data-testid={`category-name-${category.id}`}
                      className="min-w-0 truncate text-zinc-200"
                    >
                      {category.name}
                    </span>
                  </div>
                  <CategoryRules
                    categoryName={category.name}
                    rules={rulesByCategory.get(category.id) ?? []}
                    isLoading={areRulesLoading}
                    onDelete={(id) => deleteKeywordMapping.mutate(id)}
                  />
                </div>
                <div className="flex shrink-0 flex-row gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => startPersonalEdit(category)}
                    aria-label={`Изменить ${category.name}`}
                    className="flex-1 @md:flex-none"
                  >
                    <Pencil className="h-4 w-4" />
                    Изменить
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setCategoryPendingDelete(category)}
                    disabled={categories.length <= 1}
                    aria-label={`Удалить ${category.name}`}
                    className="flex-1 @md:flex-none"
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <DeleteCategoryDialog
            category={categoryPendingDelete}
            categories={categories}
            onConfirm={(targetCategoryId) => {
              if (categoryPendingDelete) {
                deleteCategory(categoryPendingDelete.id, targetCategoryId)
                setCategoryPendingDelete(null)
              }
            }}
            onClose={() => setCategoryPendingDelete(null)}
          />

          <form
            onSubmit={handleSubmit}
            {...(editingCategory ? HIDES_CALCULATOR_PROPS : {})}
            className="flex flex-col gap-3 sm:gap-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Название личной категории"
                  aria-label="Название личной категории"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  maxLength={CATEGORY_NAME_MAX_LENGTH}
                  error={
                    error ||
                    getTextLimitMessage(
                      name,
                      CATEGORY_NAME_MAX_LENGTH,
                      CATEGORY_NAME_TOO_LONG_MESSAGE,
                      editingCategory?.name
                    )
                  }
                />
              </div>
              <div className="w-full sm:w-24">
                <Input
                  placeholder="Эмодзи"
                  aria-label="Эмодзи личной категории"
                  value={emoji}
                  onChange={(e) => setEmoji(limitGraphemes(e.target.value, 1))}
                />
              </div>
            </div>
            {editingCategory && (
              <CategoryColorPicker
                name={name}
                value={color}
                onChange={setColor}
              />
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                disabled={!isFormValid}
                className="w-full sm:w-auto"
              >
                {editingCategory ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingCategory ? 'Сохранить' : 'Добавить личную категорию'}
              </Button>
              {editingCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetPersonalForm}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4" />
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </>
      )}

      {mode === 'shared' && activeSharedBudgets.length === 0 && (
        <EmptyState
          icon={Archive}
          title="Нет общих бюджетов"
          description="Создайте общий бюджет, чтобы настроить его категории."
          className="py-6"
        />
      )}

      {mode === 'shared' && activeSharedBudgets.length > 0 && (
        <>
          <Select
            label="Общий бюджет"
            value={selectedSharedBudget?.id ?? ''}
            onChange={(event) => {
              setSelectedSharedBudgetId(event.target.value)
              resetSharedForm()
            }}
            options={activeSharedBudgets.map((budget) => ({
              value: budget.id,
              label: budget.name,
            }))}
          />

          {isSharedCategoriesLoading ? (
            <CategoryManagerSkeleton />
          ) : (
            <ul className="@container flex flex-col gap-2">
              {sharedCategories.map((category) => (
                <li
                  key={category.id}
                  className="flex flex-col gap-2 rounded-lg bg-zinc-800/50 p-2 @md:flex-row @md:items-start @md:justify-between @md:gap-3 @md:p-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex min-w-0 items-center gap-3">
                      <CategoryColorDot category={category} />
                      <span className="shrink-0 text-xl">{category.emoji}</span>
                      <span
                        title={category.name}
                        data-testid={`category-name-${category.id}`}
                        className="min-w-0 truncate text-zinc-200"
                      >
                        {category.name}
                      </span>
                    </div>
                    <CategoryRules
                      categoryName={category.name}
                      rules={sharedRulesByCategory.get(category.id) ?? []}
                      isLoading={areSharedRulesLoading}
                      onDelete={(id) => deleteSharedKeywordMapping.mutate(id)}
                    />
                  </div>
                  <div className="flex shrink-0 flex-row gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => startSharedEdit(category)}
                      aria-label={`Изменить ${category.name}`}
                      className="flex-1 @md:flex-none"
                    >
                      <Pencil className="h-4 w-4" />
                      Изменить
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => setSharedCategoryPendingArchive(category)}
                      className="flex-1 @md:flex-none"
                    >
                      <Archive className="h-4 w-4" />
                      Архив
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <ConfirmDialog
            isOpen={Boolean(sharedCategoryPendingArchive)}
            title={
              sharedCategoryPendingArchive
                ? `Архивировать категорию «${sharedCategoryPendingArchive.name}»?`
                : 'Архивировать категорию?'
            }
            description="Она исчезнет из выбора для новых общих расходов, но старые расходы останутся в истории."
            confirmLabel="Архивировать"
            isConfirming={archiveSharedCategory.isPending}
            onConfirm={() => {
              if (sharedCategoryPendingArchive) {
                archiveSharedCategory.mutate(sharedCategoryPendingArchive.id, {
                  onSuccess: () => setSharedCategoryPendingArchive(null),
                })
              }
            }}
            onClose={() => setSharedCategoryPendingArchive(null)}
          />

          <form
            onSubmit={handleSharedSubmit}
            {...(editingSharedCategory ? HIDES_CALCULATOR_PROPS : {})}
            className="flex flex-col gap-3 sm:gap-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Название категории общего бюджета"
                  aria-label="Название категории общего бюджета"
                  value={sharedName}
                  onChange={(e) => {
                    setSharedName(e.target.value)
                    setSharedError('')
                  }}
                  maxLength={CATEGORY_NAME_MAX_LENGTH}
                  error={
                    sharedError ||
                    getTextLimitMessage(
                      sharedName,
                      CATEGORY_NAME_MAX_LENGTH,
                      CATEGORY_NAME_TOO_LONG_MESSAGE,
                      editingSharedCategory?.name
                    )
                  }
                />
              </div>
              <div className="w-full sm:w-24">
                <Input
                  placeholder="Эмодзи"
                  aria-label="Эмодзи категории общего бюджета"
                  value={sharedEmoji}
                  onChange={(e) =>
                    setSharedEmoji(limitGraphemes(e.target.value, 1))
                  }
                />
              </div>
            </div>
            {editingSharedCategory && (
              <CategoryColorPicker
                name={sharedName}
                value={sharedColor}
                onChange={setSharedColor}
              />
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                disabled={!isSharedFormValid}
                isLoading={
                  addSharedCategory.isPending || updateSharedCategory.isPending
                }
                className="w-full sm:w-auto"
              >
                {editingSharedCategory ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingSharedCategory
                  ? 'Сохранить'
                  : 'Добавить категорию общего бюджета'}
              </Button>
              {editingSharedCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetSharedForm}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4" />
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  )
}

function CategoryColorDot({
  category,
}: {
  category: Pick<Category, 'name' | 'color'>
}) {
  return (
    <span
      aria-hidden="true"
      data-testid={`category-color-${category.name}`}
      className="h-3 w-3 shrink-0 rounded-full"
      style={{
        backgroundColor: getCategoryColor(category.name, category.color),
      }}
    />
  )
}

interface DeleteCategoryDialogProps {
  category: Category | null
  categories: Category[]
  onConfirm: (targetCategoryId: string) => void
  onClose: () => void
}

function DeleteCategoryDialog({
  category,
  categories,
  onConfirm,
  onClose,
}: DeleteCategoryDialogProps) {
  const { data: expenseCount, isLoading } = useCategoryExpenseCount(
    category?.id
  )
  const [targetId, setTargetId] = useState('')

  const targets = category
    ? categories.filter((item) => item.id !== category.id)
    : []
  const defaultTarget = category
    ? getDefaultReassignTarget(categories, category.id)
    : undefined
  const selectedTargetId =
    targets.find((item) => item.id === targetId)?.id ?? defaultTarget?.id ?? ''

  const hasExpenses = (expenseCount ?? 0) > 0

  const description = (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <p>Считаем операции…</p>
      ) : hasExpenses ? (
        <>
          <p>
            В категории {expenseCount}{' '}
            {pluralizeRu(expenseCount ?? 0, [
              'операция',
              'операции',
              'операций',
            ])}
            . Куда перенести?
          </p>
          <Select
            label="Перенести в"
            id="delete-category-target"
            value={selectedTargetId}
            onChange={(event) => setTargetId(event.target.value)}
            options={targets.map((item) => ({
              value: item.id,
              label: `${item.emoji} ${item.name}`,
            }))}
          />
        </>
      ) : (
        <p>В категории нет операций.</p>
      )}
      <p>Правила автокатегоризации этой категории будут удалены.</p>
    </div>
  )

  return (
    <ConfirmDialog
      isOpen={Boolean(category)}
      title={
        category
          ? `Удалить категорию «${category.name}»?`
          : 'Удалить категорию?'
      }
      description={description}
      confirmLabel="Удалить категорию"
      isConfirming={isLoading}
      onConfirm={() => {
        if (isLoading || !selectedTargetId) return
        onConfirm(selectedTargetId)
        setTargetId('')
      }}
      onClose={() => {
        setTargetId('')
        onClose()
      }}
    />
  )
}
