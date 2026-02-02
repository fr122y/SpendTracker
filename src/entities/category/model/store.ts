import { atom, action, wrap, withLocalStorage } from '@reatom/core'
import { useSyncExternalStore } from 'react'

import type { Category } from '@/shared/types'

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚕' },
  { id: '3', name: 'Еда', emoji: '☕' },
  { id: '4', name: 'Здоровье', emoji: '💊' },
  { id: '5', name: 'Развлечения', emoji: '🎬' },
  { id: '6', name: 'Другое', emoji: '📝' },
]

// Pure validation function
export function isCategoryNameDuplicate(
  name: string,
  categories: Category[]
): boolean {
  const normalized = name.trim().toLowerCase()
  return categories.some((cat) => cat.name.toLowerCase() === normalized)
}

// Atoms with persistence
export const categoriesAtom = atom(DEFAULT_CATEGORIES, 'categoriesAtom').extend(
  withLocalStorage('smartspend-categories')
)

// Actions
export const addCategory = action((category: Category) => {
  const current = categoriesAtom()
  categoriesAtom.set([...current, category])
}, 'addCategory')

export const deleteCategory = action((id: string) => {
  const current = categoriesAtom()
  categoriesAtom.set(current.filter((c) => c.id !== id))
}, 'deleteCategory')

export const addCategoryIfUnique = action((category: Category) => {
  const current = categoriesAtom()

  if (isCategoryNameDuplicate(category.name, current)) {
    return false // Duplicate found
  }

  categoriesAtom.set([...current, category])
  return true // Success
}, 'addCategoryIfUnique')

// Store state type
interface CategoryState {
  categories: Category[]
  addCategory: (category: Category) => void
  addCategoryIfUnique: (category: Category) => boolean
  deleteCategory: (id: string) => void
}

// Action wrappers (stable references)
const actionAddCategory = (category: Category) => wrap(addCategory)(category)
const actionAddCategoryIfUnique = (category: Category) =>
  wrap(addCategoryIfUnique)(category)
const actionDeleteCategory = (id: string) => wrap(deleteCategory)(id)

// Cached state for useSyncExternalStore
let cachedState: CategoryState | null = null
let cachedCategories: Category[] | undefined

const getState = (): CategoryState => {
  const categories = categoriesAtom()

  if (cachedState === null || cachedCategories !== categories) {
    cachedCategories = categories
    cachedState = {
      categories,
      addCategory: actionAddCategory,
      addCategoryIfUnique: actionAddCategoryIfUnique,
      deleteCategory: actionDeleteCategory,
    }
  }

  return cachedState
}

const subscribe = (callback: () => void) => {
  return categoriesAtom.subscribe(callback)
}

// Adapter Hook (Matches old Zustand API with selector support)
export function useCategoryStore(): CategoryState
export function useCategoryStore<T>(selector: (state: CategoryState) => T): T
export function useCategoryStore<T>(selector?: (state: CategoryState) => T) {
  const state = useSyncExternalStore(subscribe, getState, getState)

  if (selector) {
    return selector(state)
  }
  return state
}
