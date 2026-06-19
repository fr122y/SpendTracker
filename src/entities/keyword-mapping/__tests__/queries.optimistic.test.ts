import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { showMutationRollbackToast } from '@/shared/lib'

import {
  useDeleteKeywordMapping,
  useSaveKeywordMapping,
  useSaveSharedKeywordMapping,
} from '../model/queries'

import type {
  Category,
  KeywordMapping,
  SharedBudgetCategory,
  SharedKeywordMapping,
} from '@/shared/types'

let shouldRejectSave = false
let shouldRejectDelete = false

jest.mock('@/shared/lib', () => ({
  showMutationRollbackToast: jest.fn(),
}))

jest.mock('@/shared/api', () => ({
  queryKeys: {
    keywordMappings: { all: ['keyword-mappings'] },
    sharedKeywordMappings: {
      list: (sharedBudgetId: string) => [
        'shared-keyword-mappings',
        sharedBudgetId,
      ],
    },
    categories: { all: ['categories'] },
    sharedBudgetCategories: {
      list: (sharedBudgetId: string) => [
        'shared-budget-categories',
        sharedBudgetId,
      ],
    },
  },
  getKeywordMappings: jest.fn(),
  getSharedKeywordMappings: jest.fn(),
  saveKeywordMapping: jest.fn(async () => {
    if (shouldRejectSave) {
      throw new Error('save failed')
    }
  }),
  saveSharedKeywordMapping: jest.fn(async () => {
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

const sharedMappings: SharedKeywordMapping[] = [
  {
    id: 'shared-mapping-1',
    keyword: 'молоко',
    categoryId: 'shared-category-1',
    categoryName: 'Продукты общие',
    categoryEmoji: '🧺',
  },
]

const sharedCategories: SharedBudgetCategory[] = [
  {
    id: 'shared-category-1',
    sharedBudgetId: 'shared-1',
    name: 'Продукты общие',
    emoji: '🧺',
    createdAt: '2026-06-19T00:00:00.000Z',
  },
  {
    id: 'shared-category-2',
    sharedBudgetId: 'shared-1',
    name: 'Кафе',
    emoji: '☕',
    createdAt: '2026-06-19T00:00:00.000Z',
  },
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

  it('adds shared mapping optimistically per shared budget', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(
      ['shared-keyword-mappings', 'shared-1'],
      sharedMappings
    )
    queryClient.setQueryData(
      ['shared-budget-categories', 'shared-1'],
      sharedCategories
    )

    const { result } = renderHook(
      () => useSaveSharedKeywordMapping('shared-1'),
      {
        wrapper: createWrapper(queryClient),
      }
    )

    act(() => {
      result.current.mutate({
        keyword: 'кофе',
        categoryId: 'shared-category-2',
      })
    })

    await waitFor(() => {
      const optimistic = queryClient.getQueryData<SharedKeywordMapping[]>([
        'shared-keyword-mappings',
        'shared-1',
      ])
      expect(optimistic).toHaveLength(2)
      expect(optimistic?.[1]).toEqual(
        expect.objectContaining({
          keyword: 'кофе',
          categoryName: 'Кафе',
          categoryEmoji: '☕',
        })
      )
    })
  })

  it('rolls back shared mapping save on error and shows toast', async () => {
    shouldRejectSave = true

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(
      ['shared-keyword-mappings', 'shared-1'],
      sharedMappings
    )
    queryClient.setQueryData(
      ['shared-budget-categories', 'shared-1'],
      sharedCategories
    )

    const { result } = renderHook(
      () => useSaveSharedKeywordMapping('shared-1'),
      {
        wrapper: createWrapper(queryClient),
      }
    )

    act(() => {
      result.current.mutate({
        keyword: 'кофе',
        categoryId: 'shared-category-2',
      })
    })

    await waitFor(() => {
      expect(
        queryClient.getQueryData(['shared-keyword-mappings', 'shared-1'])
      ).toEqual(sharedMappings)
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })
})
