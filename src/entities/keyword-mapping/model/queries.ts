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
import {
  createTempId,
  isPendingIdLostError,
  isTempId,
  replaceRecordId,
  resolveId,
  trackPendingId,
  type PendingIdHandle,
} from '@/shared/lib/pending-ids'

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
    enabled: Boolean(sharedBudgetId) && !isTempId(sharedBudgetId),
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
    mutationFn: async ({
      keyword,
      categoryId,
    }: {
      keyword: string
      categoryId: string
    }) => saveKeywordMappingAction(keyword, await resolveId(categoryId)),
    onMutate: async ({ keyword, categoryId }) => {
      const normalizedKeyword = normalizeKeywordPhrase(keyword)
      if (!normalizedKeyword) {
        return {
          previous: undefined as KeywordMapping[] | undefined,
          tempId: undefined as string | undefined,
          pending: undefined as PendingIdHandle | undefined,
        }
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
        id: createTempId(),
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

      const pending = trackPendingId(optimisticRow.id)
      return { previous, tempId: optimisticRow.id, pending }
    },
    onSuccess: (mapping, _payload, context) => {
      if (!context.tempId) return
      const storedId = mapping?.id ?? context.tempId
      queryClient.setQueryData<KeywordMapping[]>(
        queryKeys.keywordMappings.all,
        (old) => replaceRecordId(old, context.tempId!, storedId)
      )
      context.pending?.resolve(storedId)
    },
    onError: (error, _payload, context) => {
      queryClient.setQueryData(queryKeys.keywordMappings.all, context?.previous)
      context?.pending?.reject()
      if (!isPendingIdLostError(error)) showMutationRollbackToast()
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
    mutationFn: async ({
      keyword,
      categoryId,
    }: {
      keyword: string
      categoryId: string
    }) =>
      saveSharedKeywordMappingAction(
        await resolveId(sharedBudgetId),
        keyword,
        await resolveId(categoryId)
      ),
    onMutate: async ({ keyword, categoryId }) => {
      const normalizedKeyword = normalizeKeywordPhrase(keyword)
      if (!normalizedKeyword) {
        return {
          previous: undefined as SharedKeywordMapping[] | undefined,
          tempId: undefined as string | undefined,
          pending: undefined as PendingIdHandle | undefined,
        }
      }

      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<SharedKeywordMapping[]>(queryKey)
      const categories = queryClient.getQueryData<SharedBudgetCategory[]>(
        queryKeys.sharedBudgetCategories.list(sharedBudgetId)
      )
      const categoryMeta = getSharedCategoryMeta(categories, categoryId)
      const optimisticRow: SharedKeywordMapping = {
        id: createTempId(),
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

      const pending = trackPendingId(optimisticRow.id)
      return { previous, tempId: optimisticRow.id, pending }
    },
    onSuccess: (mapping, _payload, context) => {
      if (!context.tempId) return
      const storedId = mapping?.id ?? context.tempId
      queryClient.setQueryData<SharedKeywordMapping[]>(queryKey, (old) =>
        replaceRecordId(old, context.tempId!, storedId)
      )
      context.pending?.resolve(storedId)
    },
    onError: (error, _payload, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      context?.pending?.reject()
      if (!isPendingIdLostError(error)) showMutationRollbackToast()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useDeleteKeywordMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) =>
      deleteKeywordMappingAction(await resolveId(id)),
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
    onError: (error, _id, context) => {
      if (isPendingIdLostError(error)) return
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
    mutationFn: async (id: string) =>
      deleteSharedKeywordMappingAction(
        await resolveId(sharedBudgetId),
        await resolveId(id)
      ),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<SharedKeywordMapping[]>(queryKey)

      queryClient.setQueryData(queryKey, (old: SharedKeywordMapping[] = []) =>
        old.filter((item) => item.id !== id)
      )

      return { previous }
    },
    onError: (error, _id, context) => {
      if (isPendingIdLostError(error)) return
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
