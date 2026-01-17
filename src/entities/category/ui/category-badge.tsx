'use client'

import type { Category } from '@/shared/types'

interface CategoryBadgeProps {
  category: Category
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-200">
      <span>{category.emoji}</span>
      <span>{category.name}</span>
    </span>
  )
}
