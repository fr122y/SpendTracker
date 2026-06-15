'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addCategory as addCategoryAction,
  addSharedBudgetCategory as addSharedBudgetCategoryAction,
  archiveSharedBudgetCategory as archiveSharedBudgetCategoryAction,
  deleteCategory as deleteCategoryAction,
  getCategories,
  getSharedBudgetCategories,
  queryKeys,
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

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCategoryAction(id),
    onMutate: async (id) => {
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
    onError: (_error, _id, context) => {
      queryClient.setQueryData(queryKeys.categories.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
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
    },
  })
}

export function useUpdateSharedBudgetCategory(sharedBudgetId: string) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.sharedBudgetCategories.list(sharedBudgetId)

  return useMutation({
    mutationFn: ({
      id,
      name,
      emoji,
    }: Pick<SharedBudgetCategory, 'id' | 'name' | 'emoji'>) =>
      updateSharedBudgetCategoryAction(id, { name, emoji }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<SharedBudgetCategory[]>(queryKey)
      queryClient.setQueryData(queryKey, (old: SharedBudgetCategory[] = []) =>
        old.map((category) =>
          category.id === data.id
            ? { ...category, name: data.name, emoji: data.emoji }
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

interface CategoryState {
  categories: Category[]
  isLoading: boolean
  addCategory: (category: Category) => void
  addCategoryIfUnique: (category: Category) => boolean
  deleteCategory: (id: string) => void
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
    deleteCategory: (id) => {
      deleteCategory.mutate(id)
    },
  }

  if (selector) {
    return selector(state)
  }

  return state
}
