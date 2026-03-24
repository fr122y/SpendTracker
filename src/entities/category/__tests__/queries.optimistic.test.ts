import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { showMutationRollbackToast } from '@/shared/lib'

import { useAddCategory, useDeleteCategory } from '../model/queries'

import type { Category } from '@/shared/types'

let shouldRejectAdd = false
let shouldRejectDelete = false

jest.mock('@/shared/lib', () => ({
  showMutationRollbackToast: jest.fn(),
}))

jest.mock('@/shared/api', () => ({
  queryKeys: {
    categories: { all: ['categories'] },
    keywordMappings: { all: ['keyword-mappings'] },
  },
  getCategories: jest.fn(),
  addCategory: jest.fn(async () => {
    if (shouldRejectAdd) {
      throw new Error('add failed')
    }
  }),
  deleteCategory: jest.fn(async () => {
    if (shouldRejectDelete) {
      throw new Error('delete failed')
    }
  }),
}))

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

const initialCategories: Category[] = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚕' },
]

describe('category optimistic mutations', () => {
  beforeEach(() => {
    shouldRejectAdd = false
    shouldRejectDelete = false
    ;(showMutationRollbackToast as jest.Mock).mockReset()
  })

  it('adds category optimistically with temp id and invalidates on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    queryClient.setQueryData(['categories'], initialCategories)

    const { result } = renderHook(() => useAddCategory(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ name: 'Здоровье', emoji: '💊' })
    })

    await waitFor(() => {
      const optimistic = queryClient.getQueryData<Category[]>(['categories'])
      expect(optimistic).toHaveLength(3)
      expect(optimistic?.[2]).toEqual(
        expect.objectContaining({
          name: 'Здоровье',
          emoji: '💊',
        })
      )
      expect(optimistic?.[2].id).toMatch(/^temp-/)
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] })
    })
  })

  it('rolls back add category on error and shows toast', async () => {
    shouldRejectAdd = true

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(['categories'], initialCategories)

    const { result } = renderHook(() => useAddCategory(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ name: 'Тест', emoji: '🧪' })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['categories'])).toEqual(
        initialCategories
      )
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })

  it('rolls back delete category on error and shows toast', async () => {
    shouldRejectDelete = true

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    queryClient.setQueryData(['categories'], initialCategories)

    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate('1')
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['categories'])).toEqual(
        initialCategories
      )
      expect(showMutationRollbackToast).toHaveBeenCalledTimes(1)
    })
  })
})
