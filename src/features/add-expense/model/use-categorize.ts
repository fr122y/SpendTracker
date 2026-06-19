'use client'

import { useCallback, useMemo } from 'react'

import {
  createMatcher,
  useKeywordMappings,
  useSaveKeywordMapping,
  useSaveSharedKeywordMapping,
  useSharedKeywordMappings,
} from '@/entities/keyword-mapping'

import type { MatchResult } from '@/entities/keyword-mapping'

interface UseCategorizeReturn {
  categorize: (description: string) => MatchResult
  saveMappingAndGetResult: (
    keyword: string,
    categoryId: string
  ) => Promise<void>
  mappingsLoaded: boolean
  isSavingMapping: boolean
}

export function useCategorize(): UseCategorizeReturn {
  const { data: mappings = [], isLoading } = useKeywordMappings()
  const saveMapping = useSaveKeywordMapping()

  const matcher = useMemo(() => createMatcher(mappings), [mappings])

  const categorize = useCallback(
    (description: string) => matcher(description),
    [matcher]
  )

  const saveMappingAndGetResult = useCallback(
    async (keyword: string, categoryId: string) => {
      await saveMapping.mutateAsync({ keyword, categoryId })
    },
    [saveMapping]
  )

  return {
    categorize,
    saveMappingAndGetResult,
    mappingsLoaded: !isLoading,
    isSavingMapping: saveMapping.isPending,
  }
}

export function useSharedCategorize(
  sharedBudgetId: string | undefined
): UseCategorizeReturn {
  const { data: mappings = [], isLoading } =
    useSharedKeywordMappings(sharedBudgetId)
  const saveMapping = useSaveSharedKeywordMapping(sharedBudgetId ?? '')

  const matcher = useMemo(() => createMatcher(mappings), [mappings])

  const categorize = useCallback(
    (description: string) => matcher(description),
    [matcher]
  )

  const saveMappingAndGetResult = useCallback(
    async (keyword: string, categoryId: string) => {
      if (!sharedBudgetId) return
      await saveMapping.mutateAsync({ keyword, categoryId })
    },
    [saveMapping, sharedBudgetId]
  )

  return {
    categorize,
    saveMappingAndGetResult,
    mappingsLoaded: !isLoading,
    isSavingMapping: saveMapping.isPending,
  }
}
