'use client'

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  addCategory as addCategoryAction,
  addSharedBudgetCategory as addSharedBudgetCategoryAction,
  archiveSharedBudgetCategory as archiveSharedBudgetCategoryAction,
  countCategoryExpenses,
  deleteCategoryWithReassign,
  getCategories,
  getSharedBudgetCategories,
  queryKeys,
  updateCategory as updateCategoryAction,
  updateSharedBudgetCategory as updateSharedBudgetCategoryAction,
} from '@/shared/api'
import { showMutationRollbackToast } from '@/shared/lib'

import type { Category, SharedBudgetCategory } from '@/shared/types'

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: getCategories,
  })
}

export function useAddCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<Category, 'id'>) => addCategoryAction(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all })
      const previous = queryClient.getQueryData<Category[]>(
        queryKeys.categories.all
      )
      const optimisticCategory: Category = {
        id: `temp-${crypto.randomUUID()}`,
        name: data.name,
        emoji: data.emoji,
        color: data.color ?? null,
      }
      queryClient.setQueryData(
        queryKeys.categories.all,
        (old: Category[] = []) => [...old, optimisticCategory]
      )
      return { previous }
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(queryKeys.categories.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.keywordMappings.all })
    },
  })
}

export interface UpdateCategoryInput {
  id: string
  name?: string
  emoji?: string
  color?: string | null
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCategoryInput) =>
      updateCategoryAction(id, data),
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all })
      const previous = queryClient.getQueryData<Category[]>(
        queryKeys.categories.all
      )
      queryClient.setQueryData(
        queryKeys.categories.all,
        (old: Category[] = []) =>
          old.map((category) =>
            category.id === id
              ? {
                  ...category,
                  ...(data.name !== undefined && { name: data.name.trim() }),
                  ...(data.emoji !== undefined && { emoji: data.emoji.trim() }),
                  ...(data.color !== undefined && { color: data.color }),
                }
              : category
          )
      )
      return { previous }
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(queryKeys.categories.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      // A rename rewrites the category text on expenses; analysis reads them.
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.keywordMappings.all })
    },
  })
}

export function useCategoryExpenseCount(categoryId: string | undefined) {
  return useQuery({
    enabled: Boolean(categoryId),
    queryKey: queryKeys.categories.expenseCount(categoryId ?? ''),
    queryFn: () => countCategoryExpenses(categoryId ?? ''),
  })
}

export interface DeleteCategoryInput {
  id: string
  targetCategoryId: string
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, targetCategoryId }: DeleteCategoryInput) =>
      deleteCategoryWithReassign(id, targetCategoryId),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all })
      const previous = queryClient.getQueryData<Category[]>(
        queryKeys.categories.all
      )
      queryClient.setQueryData(
        queryKeys.categories.all,
        (old: Category[] = []) => old.filter((category) => category.id !== id)
      )
      return { previous }
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(queryKeys.categories.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      // Analysis is derived from the expenses query, so refetching expenses
      // removes the deleted category's tile and shows moved expenses.
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.keywordMappings.all })
    },
  })
}

export function useSharedBudgetCategories(sharedBudgetId: string | undefined) {
  return useQuery({
    enabled: Boolean(sharedBudgetId),
    queryKey: queryKeys.sharedBudgetCategories.list(sharedBudgetId ?? ''),
    queryFn: () => {
      if (!sharedBudgetId) return Promise.resolve([])
      return getSharedBudgetCategories(sharedBudgetId)
    },
  })
}

/** Active categories of several shared budgets, flattened. */
export function useSharedBudgetCategoryLists(
  sharedBudgetIds: string[]
): SharedBudgetCategory[] {
  return useQueries({
    queries: sharedBudgetIds.map((sharedBudgetId) => ({
      queryKey: queryKeys.sharedBudgetCategories.list(sharedBudgetId),
      queryFn: () => getSharedBudgetCategories(sharedBudgetId),
    })),
    combine: (results) => results.flatMap((result) => result.data ?? []),
  })
}

export function useAddSharedBudgetCategory(sharedBudgetId: string) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.sharedBudgetCategories.list(sharedBudgetId)

  return useMutation({
    mutationFn: (data: Pick<SharedBudgetCategory, 'name' | 'emoji'>) =>
      addSharedBudgetCategoryAction(sharedBudgetId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<SharedBudgetCategory[]>(queryKey)
      const now = new Date().toISOString()
      const optimisticCategory: SharedBudgetCategory = {
        id: `temp-${crypto.randomUUID()}`,
        sharedBudgetId,
        name: data.name,
        emoji: data.emoji,
        createdAt: now,
      }
      queryClient.setQueryData(queryKey, (old: SharedBudgetCategory[] = []) => [
        ...old,
        optimisticCategory,
      ])
      return { previous }
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedKeywordMappings.list(sharedBudgetId),
      })
    },
  })
}

export type UpdateSharedCategoryInput = Pick<
  SharedBudgetCategory,
  'id' | 'name' | 'emoji'
> & { color?: string | null }

export function useUpdateSharedBudgetCategory(sharedBudgetId: string) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.sharedBudgetCategories.list(sharedBudgetId)

  return useMutation({
    mutationFn: ({ id, name, emoji, color }: UpdateSharedCategoryInput) =>
      updateSharedBudgetCategoryAction(id, { name, emoji, color }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<SharedBudgetCategory[]>(queryKey)
      queryClient.setQueryData(queryKey, (old: SharedBudgetCategory[] = []) =>
        old.map((category) =>
          category.id === data.id
            ? {
                ...category,
                name: data.name,
                emoji: data.emoji,
                ...(data.color !== undefined && { color: data.color }),
              }
            : category
        )
      )
      return { previous }
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedKeywordMappings.list(sharedBudgetId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
    },
  })
}

export function useArchiveSharedBudgetCategory(sharedBudgetId: string) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.sharedBudgetCategories.list(sharedBudgetId)

  return useMutation({
    mutationFn: (id: string) => archiveSharedBudgetCategoryAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<SharedBudgetCategory[]>(queryKey)
      queryClient.setQueryData(queryKey, (old: SharedBudgetCategory[] = []) =>
        old.filter((category) => category.id !== id)
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedKeywordMappings.list(sharedBudgetId),
      })
    },
  })
}

export function isCategoryNameDuplicate(
  name: string,
  categories: Category[]
): boolean {
  const normalized = name.trim().toLowerCase()
  return categories.some(
    (category) => category.name.toLowerCase() === normalized
  )
}

export function isSharedCategoryNameDuplicate(
  name: string,
  categories: SharedBudgetCategory[],
  excludeId?: string
): boolean {
  const normalized = name.trim().toLowerCase()
  return categories.some(
    (category) =>
      category.id !== excludeId && category.name.toLowerCase() === normalized
  )
}

interface CategoryState {
  categories: Category[]
  isLoading: boolean
  addCategory: (category: Category) => void
  addCategoryIfUnique: (category: Category) => boolean
  deleteCategory: (id: string, targetCategoryId: string) => void
}

export function useCategoryStore(): CategoryState
export function useCategoryStore<T>(selector: (state: CategoryState) => T): T
export function useCategoryStore<T>(selector?: (state: CategoryState) => T) {
  const { data: categories = [], isLoading } = useCategories()
  const addCategory = useAddCategory()
  const deleteCategory = useDeleteCategory()

  const state: CategoryState = {
    categories,
    isLoading,
    addCategory: (category) => {
      addCategory.mutate({
        name: category.name,
        emoji: category.emoji,
      })
    },
    addCategoryIfUnique: (category) => {
      if (isCategoryNameDuplicate(category.name, categories)) {
        return false
      }
      addCategory.mutate({
        name: category.name,
        emoji: category.emoji,
      })
      return true
    },
    deleteCategory: (id, targetCategoryId) => {
      deleteCategory.mutate({ id, targetCategoryId })
    },
  }

  if (selector) {
    return selector(state)
  }

  return state
}

export function getDefaultReassignTarget(
  categories: Category[],
  deletedId: string
): Category | undefined {
  const remaining = categories.filter((category) => category.id !== deletedId)
  return (
    remaining.find((category) => category.name === 'Другое') ?? remaining[0]
  )
}
