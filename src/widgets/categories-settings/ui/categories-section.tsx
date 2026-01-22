'use client'

import { CategoryManager } from '@/features/manage-categories'

export function CategoriesSection() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-lg font-medium text-zinc-100">
        Управление категориями
      </h2>
      <CategoryManager />
    </div>
  )
}
