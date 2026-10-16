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
  useUpdateSharedBudgetCategory,
} from '@/entities/category'
import {
  getActiveSharedBudget,
  useSharedBudgets,
} from '@/entities/shared-budget'
import { useSubmitLock } from '@/shared/lib'
import { Button, ConfirmDialog, EmptyState, Input, Select } from '@/shared/ui'

import { CategoryManagerSkeleton } from './category-manager-skeleton'

import type { Category, SharedBudgetCategory } from '@/shared/types'

type CategoryMode = 'personal' | 'shared'

export function CategoryManager() {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [error, setError] = useState('')
  const runLocked = useSubmitLock()
  const [categoryPendingDelete, setCategoryPendingDelete] =
    useState<Category | null>(null)
  const [mode, setMode] = useState<CategoryMode>('personal')
  const [selectedSharedBudgetId, setSelectedSharedBudgetId] = useState('')
  const [sharedName, setSharedName] = useState('')
  const [sharedEmoji, setSharedEmoji] = useState('')
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void runLocked(submit)
  }

  const isFormValid = name.trim() && emoji.trim()
  const isSharedFormValid = sharedName.trim() && sharedEmoji.trim()

  const resetSharedForm = () => {
    setSharedName('')
    setSharedEmoji('')
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
    setSharedError('')
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-2 gap-2 rounded-md bg-zinc-900 p-1">
        <button
          type="button"
          onClick={() => setMode('personal')}
          className={`min-h-10 rounded px-3 text-sm font-medium transition ${
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
          className={`min-h-10 rounded px-3 text-sm font-medium transition ${
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
          <ul className="flex flex-col gap-2">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-col gap-2 rounded-lg bg-zinc-800/50 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.emoji}</span>
                  <span className="text-zinc-200">{category.name}</span>
                </div>
                <Button
                  variant="danger"
                  onClick={() => setCategoryPendingDelete(category)}
                  disabled={categories.length <= 1}
                  aria-label={`Удалить ${category.name}`}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </Button>
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
            className="flex flex-col gap-3 sm:gap-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Название категории"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  error={error}
                />
              </div>
              <div className="w-full sm:w-24">
                <Input
                  placeholder="Эмодзи"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  maxLength={2}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!isFormValid}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Добавить категорию
            </Button>
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
            <ul className="flex flex-col gap-2">
              {sharedCategories.map((category) => (
                <li
                  key={category.id}
                  className="flex flex-col gap-2 rounded-lg bg-zinc-800/50 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{category.emoji}</span>
                    <span className="text-zinc-200">{category.name}</span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => startSharedEdit(category)}
                      className="w-full sm:w-auto"
                    >
                      <Pencil className="h-4 w-4" />
                      Изменить
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => setSharedCategoryPendingArchive(category)}
                      className="w-full sm:w-auto"
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
            className="flex flex-col gap-3 sm:gap-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Название категории"
                  value={sharedName}
                  onChange={(e) => {
                    setSharedName(e.target.value)
                    setSharedError('')
                  }}
                  error={sharedError}
                />
              </div>
              <div className="w-full sm:w-24">
                <Input
                  placeholder="Эмодзи"
                  value={sharedEmoji}
                  onChange={(e) => setSharedEmoji(e.target.value)}
                  maxLength={2}
                />
              </div>
            </div>
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
                {editingSharedCategory ? 'Сохранить' : 'Добавить категорию'}
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
          <p>В категории {expenseCount} операций. Куда перенести?</p>
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
