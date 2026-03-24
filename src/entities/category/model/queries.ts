'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addCategory as addCategoryAction,
  deleteCategory as deleteCategoryAction,
  getCategories,
  queryKeys,
} from '@/shared/api'

import type { Category } from '@/shared/types'

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCategoryAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
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
