import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { showMutationRollbackToast } from '@/shared/lib'

import {
  useDeleteKeywordMapping,
  useSaveKeywordMapping,
} from '../model/queries'

import type { Category, KeywordMapping } from '@/shared/types'

let shouldRejectSave = false
let shouldRejectDelete = false

jest.mock('@/shared/lib', () => ({
  showMutationRollbackToast: jest.fn(),
}))

jest.mock('@/shared/api', () => ({
  queryKeys: {
    keywordMappings: { all: ['keyword-mappings'] },
    categories: { all: ['categories'] },
  },
  getKeywordMappings: jest.fn(),
  saveKeywordMapping: jest.fn(async () => {
    if (shouldRejectSave) {
      throw new Error('save failed')
    }
  }),
  deleteKeywordMapping: jest.fn(async () => {
    if (shouldRejectDelete) {
      throw new Error('delete failed')
    }
  }),
}))

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

const initialMappings: KeywordMapping[] = [
  {
    id: '1',
    keyword: 'молоко',
    categoryId: 'c1',
    categoryName: 'Продукты',
    categoryEmoji: '🛒',
  },
]

const categories: Category[] = [
  { id: 'c1', name: 'Продукты', emoji: '🛒' },
  { id: 'c2', name: 'Транспорт', emoji: '🚕' },
]

describe('keyword mapping optimistic mutations', () => {
  beforeEach(() => {
    shouldRejectSave = false
    shouldRejectDelete = false
    ;(showMutationRollbackToast as jest.Mock).mockReset()
  })

  it('adds mapping optimistically with temp id', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(['keyword-mappings'], initialMappings)
    queryClient.setQueryData(['categories'], categories)

    const { result } = renderHook(() => useSaveKeywordMapping(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        keyword: 'такси',
        categoryId: 'c2',
      })
    })

    await waitFor(() => {
      const optimistic = queryClient.getQueryData<KeywordMapping[]>([
        'keyword-mappings',
      ])
      expect(optimistic).toHaveLength(2)
      expect(optimistic?.[1].id).toMatch(/^temp-/)
      expect(optimistic?.[1]).toEqual(
        expect.objectContaining({
          keyword: 'такси',
          categoryName: 'Транспорт',
          categoryEmoji: '🚕',
        })
      )
    })
  })

  it('rolls back save on error and shows toast', async () => {
    shouldRejectSave = true

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(['keyword-mappings'], initialMappings)
    queryClient.setQueryData(['categories'], categories)

    const { result } = renderHook(() => useSaveKeywordMapping(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        keyword: 'кофе',
        categoryId: 'c1',
      })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['keyword-mappings'])).toEqual(
        initialMappings
      )
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })

  it('rolls back delete on error and shows toast', async () => {
    shouldRejectDelete = true

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(['keyword-mappings'], initialMappings)

    const { result } = renderHook(() => useDeleteKeywordMapping(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate('1')
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['keyword-mappings'])).toEqual(
        initialMappings
      )
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })
})
