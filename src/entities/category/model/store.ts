import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Category } from '@/shared/types'

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚕' },
  { id: '3', name: 'Еда', emoji: '☕' },
  { id: '4', name: 'Здоровье', emoji: '💊' },
  { id: '5', name: 'Развлечения', emoji: '🎬' },
  { id: '6', name: 'Другое', emoji: '📝' },
]

interface CategoryState {
  categories: Category[]
  addCategory: (category: Category) => void
  deleteCategory: (id: string) => void
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      categories: DEFAULT_CATEGORIES,

      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, category],
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'smartspend-categories',
    }
  )
)
