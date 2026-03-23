import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { isCategoryNameDuplicate, useCategoryStore } from '../model/queries'

import type { Category } from '@/shared/types'

let categories: Category[] = []

jest.mock('@/shared/api', () => ({
  queryKeys: { categories: { all: ['categories'] } },
  getCategories: jest.fn(async () => categories),
  addCategory: jest.fn(async (category: Omit<Category, 'id'>) => {
    const nextCategory = {
      id: `category-${categories.length + 1}`,
      ...category,
    }
    categories = [...categories, nextCategory]
    return nextCategory
  }),
  deleteCategory: jest.fn(async (id: string) => {
    categories = categories.filter((category) => category.id !== id)
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('Category entity', () => {
  beforeEach(() => {
    categories = [
      { id: '1', name: 'Продукты', emoji: '🛒' },
      { id: '2', name: 'Транспорт', emoji: '🚕' },
    ]
    jest.clearAllMocks()
  })

  it('detects duplicate names', () => {
    expect(isCategoryNameDuplicate('Продукты', categories)).toBe(true)
    expect(isCategoryNameDuplicate('Здоровье', categories)).toBe(false)
  })

  it('reads and mutates categories through the query-backed store', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCategoryStore(), { wrapper })

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(2)
    })

    act(() => {
      result.current.addCategoryIfUnique({
        id: 'unused-local-id',
        name: 'Здоровье',
        emoji: '💊',
      })
    })

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(3)
      expect(result.current.categories[2].name).toBe('Здоровье')
    })

    act(() => {
      result.current.deleteCategory(result.current.categories[2].id)
    })

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(2)
    })
  })
})
