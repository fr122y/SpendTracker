import 'server-only'

import {
  allocationBuckets,
  categories,
  layoutConfigs,
  userSettings,
} from '@/shared/db'

import type { db } from '@/shared/db'
import type { LayoutConfig } from '@/shared/types'

type SeedTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const DEFAULT_CATEGORIES = [
  { name: 'Продукты', emoji: '🛒' },
  { name: 'Транспорт', emoji: '🚕' },
  { name: 'Еда', emoji: '☕' },
  { name: 'Здоровье', emoji: '💊' },
  { name: 'Развлечения', emoji: '🎬' },
  { name: 'Другое', emoji: '📝' },
]

const DEFAULT_BUCKETS = [
  { label: 'Накопления', percentage: 20 },
  { label: 'Инвестиции', percentage: 10 },
]

const DEFAULT_LAYOUT: LayoutConfig = {
  columns: [
    { id: 'col-1', width: 33, widgets: ['CALENDAR', 'EXPENSE_LOG'] },
    { id: 'col-2', width: 33, widgets: ['ANALYSIS', 'DYNAMICS'] },
    { id: 'col-3', width: 34, widgets: ['WEEKLY_BUDGET', 'SAVINGS'] },
  ],
}

export async function seedUserDefaults(
  tx: SeedTransaction,
  userId: string
): Promise<void> {
  await tx.insert(categories).values(
    DEFAULT_CATEGORIES.map((category) => ({
      id: crypto.randomUUID(),
      userId,
      ...category,
    }))
  )

  await tx.insert(allocationBuckets).values(
    DEFAULT_BUCKETS.map((bucket) => ({
      id: crypto.randomUUID(),
      userId,
      ...bucket,
    }))
  )

  await tx.insert(userSettings).values({
    id: crypto.randomUUID(),
    userId,
    weeklyLimit: 10000,
    salaryDay: 10,
    advanceDay: 25,
    salary: 0,
  })

  await tx.insert(layoutConfigs).values({
    id: crypto.randomUUID(),
    userId,
    config: DEFAULT_LAYOUT,
  })
}
