import { getCategoryColor, type CategoryStat } from '@/shared/lib'

import type { Category, SharedBudgetCategory } from '@/shared/types'

/**
 * The tile color of an analysis category. Stats are grouped by category name,
 * so a tile can mix personal and shared expenses: the personal category's
 * color wins when the tile has personal or project spending, otherwise the
 * shared category's. Without a stored color the tile gets the stable palette
 * color by name, the same one the category settings show.
 */
export function getCategoryTileColor(
  stat: Pick<
    CategoryStat,
    'name' | 'personalValue' | 'sharedValue' | 'projectValue'
  >,
  personalCategories: Pick<Category, 'name' | 'color'>[],
  sharedCategories: Pick<SharedBudgetCategory, 'name' | 'color'>[]
): string {
  const personal = personalCategories.filter((item) => item.name === stat.name)
  const shared = sharedCategories.filter((item) => item.name === stat.name)
  const hasPersonalSpending = stat.personalValue + stat.projectValue > 0
  const candidates = hasPersonalSpending
    ? [...personal, ...shared]
    : [...shared, ...personal]
  const stored = candidates.find((item) => item.color)?.color

  return getCategoryColor(stat.name, stored)
}

export type CategoryTileScope = 'personal' | 'shared' | 'project'

const SCOPE_LABELS: Record<CategoryTileScope, string> = {
  personal: 'Личные',
  shared: 'Общие',
  project: 'Проекты',
}

/** The scopes present on a tile, in a fixed order, as short labels. */
export function getCategoryTileScopeLabel(
  stat: Pick<CategoryStat, 'personalValue' | 'sharedValue' | 'projectValue'>
): string {
  const scopes: CategoryTileScope[] = []
  if (stat.personalValue > 0) scopes.push('personal')
  if (stat.sharedValue > 0) scopes.push('shared')
  if (stat.projectValue > 0) scopes.push('project')
  return scopes.map((scope) => SCOPE_LABELS[scope]).join(' · ')
}
