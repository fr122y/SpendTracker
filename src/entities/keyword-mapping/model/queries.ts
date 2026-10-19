'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteKeywordMapping as deleteKeywordMappingAction,
  deleteSharedKeywordMapping as deleteSharedKeywordMappingAction,
  getKeywordMappings,
  getSharedKeywordMappings,
  queryKeys,
  saveKeywordMapping as saveKeywordMappingAction,
  saveSharedKeywordMapping as saveSharedKeywordMappingAction,
} from '@/shared/api'
import { normalizeKeywordPhrase, showMutationRollbackToast } from '@/shared/lib'

import type {
  Category,
  KeywordMapping,
  SharedBudgetCategory,
  SharedKeywordMapping,
} from '@/shared/types'

function getCategoryMeta(
  categories: Category[] | undefined,
  categoryId: string
): { name: string; emoji: string } {
  const category = (categories ?? []).find((item) => item.id === categoryId)
  return {
    name: category?.name ?? 'Другое',
    emoji: category?.emoji ?? '📝',
  }
}

export function useKeywordMappings() {
  return useQuery({
    queryKey: queryKeys.keywordMappings.all,
    queryFn: getKeywordMappings,
  })
}

export function useSharedKeywordMappings(sharedBudgetId: string | undefined) {
  return useQuery({
    enabled: Boolean(sharedBudgetId),
    queryKey: queryKeys.sharedKeywordMappings.list(sharedBudgetId ?? ''),
    queryFn: () => {
      if (!sharedBudgetId) return Promise.resolve([])
      return getSharedKeywordMappings(sharedBudgetId)
    },
  })
}

export function useSaveKeywordMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      keyword,
      categoryId,
    }: {
      keyword: string
      categoryId: string
    }) => saveKeywordMappingAction(keyword, categoryId),
    onMutate: async ({ keyword, categoryId }) => {
      const normalizedKeyword = normalizeKeywordPhrase(keyword)
      if (!normalizedKeyword) {
        return { previous: undefined as KeywordMapping[] | undefined }
      }

      await queryClient.cancelQueries({
        queryKey: queryKeys.keywordMappings.all,
      })
      const previous = queryClient.getQueryData<KeywordMapping[]>(
        queryKeys.keywordMappings.all
      )
      const categories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.all
      )
      const categoryMeta = getCategoryMeta(categories, categoryId)
      const optimisticRow: KeywordMapping = {
        id: `temp-${crypto.randomUUID()}`,
        keyword: normalizedKeyword,
        matchType: 'exact',
        categoryId,
        categoryName: categoryMeta.name,
        categoryEmoji: categoryMeta.emoji,
      }

      queryClient.setQueryData(
        queryKeys.keywordMappings.all,
        (old: KeywordMapping[] = []) => {
          const withoutDuplicateKeyword = old.filter(
            (item) => item.keyword !== normalizedKeyword
          )
          return [...withoutDuplicateKeyword, optimisticRow]
        }
      )

      return { previous }
    },
    onError: (_error, _payload, context) => {
      queryClient.setQueryData(queryKeys.keywordMappings.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.keywordMappings.all,
      })
    },
  })
}

function getSharedCategoryMeta(
  categories: SharedBudgetCategory[] | undefined,
  categoryId: string
): { name: string; emoji: string } {
  const category = (categories ?? []).find((item) => item.id === categoryId)
  return {
    name: category?.name ?? 'Другое',
    emoji: category?.emoji ?? '📝',
  }
}

export function useSaveSharedKeywordMapping(sharedBudgetId: string) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.sharedKeywordMappings.list(sharedBudgetId)

  return useMutation({
    mutationFn: ({
      keyword,
      categoryId,
    }: {
      keyword: string
      categoryId: string
    }) => saveSharedKeywordMappingAction(sharedBudgetId, keyword, categoryId),
    onMutate: async ({ keyword, categoryId }) => {
      const normalizedKeyword = normalizeKeywordPhrase(keyword)
      if (!normalizedKeyword) {
        return { previous: undefined as SharedKeywordMapping[] | undefined }
      }

      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<SharedKeywordMapping[]>(queryKey)
      const categories = queryClient.getQueryData<SharedBudgetCategory[]>(
        queryKeys.sharedBudgetCategories.list(sharedBudgetId)
      )
      const categoryMeta = getSharedCategoryMeta(categories, categoryId)
      const optimisticRow: SharedKeywordMapping = {
        id: `temp-${crypto.randomUUID()}`,
        keyword: normalizedKeyword,
        matchType: 'exact',
        categoryId,
        categoryName: categoryMeta.name,
        categoryEmoji: categoryMeta.emoji,
      }

      queryClient.setQueryData(queryKey, (old: SharedKeywordMapping[] = []) => {
        const withoutDuplicateKeyword = old.filter(
          (item) => item.keyword !== normalizedKeyword
        )
        return [...withoutDuplicateKeyword, optimisticRow]
      })

      return { previous }
    },
    onError: (_error, _payload, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useDeleteKeywordMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteKeywordMappingAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.keywordMappings.all,
      })
      const previous = queryClient.getQueryData<KeywordMapping[]>(
        queryKeys.keywordMappings.all
      )

      queryClient.setQueryData(
        queryKeys.keywordMappings.all,
        (old: KeywordMapping[] = []) => old.filter((item) => item.id !== id)
      )

      return { previous }
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(queryKeys.keywordMappings.all, context?.previous)
      showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.keywordMappings.all,
      })
    },
  })
}

export function useDeleteSharedKeywordMapping(sharedBudgetId: string) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.sharedKeywordMappings.list(sharedBudgetId)

  return useMutation({
    mutationFn: (id: string) =>
      deleteSharedKeywordMappingAction(sharedBudgetId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<SharedKeywordMapping[]>(queryKey)

      queryClient.setQueryData(queryKey, (old: SharedKeywordMapping[] = []) =>
        old.filter((item) => item.id !== id)
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

interface KeywordMappingState {
  mappings: KeywordMapping[]
  isLoading: boolean
  saveKeywordMapping: (keyword: string, categoryId: string) => Promise<void>
  deleteKeywordMapping: (id: string) => Promise<void>
}

export function useKeywordMappingStore(): KeywordMappingState
export function useKeywordMappingStore<T>(
  selector: (state: KeywordMappingState) => T
): T
export function useKeywordMappingStore<T>(
  selector?: (state: KeywordMappingState) => T
) {
  const { data: mappings = [], isLoading } = useKeywordMappings()
  const saveMutation = useSaveKeywordMapping()
  const deleteMutation = useDeleteKeywordMapping()

  const state: KeywordMappingState = {
    mappings,
    isLoading,
    saveKeywordMapping: async (keyword, categoryId) => {
      await saveMutation.mutateAsync({ keyword, categoryId })
    },
    deleteKeywordMapping: async (id) => {
      await deleteMutation.mutateAsync(id)
    },
  }

  if (selector) {
    return selector(state)
  }

  return state
}
