import 'server-only'

import {
  allocationBuckets,
  categories,
  keywordMappings,
  layoutConfigs,
  userSettings,
} from '@/shared/db'
import { DEFAULT_LAYOUT } from '@/shared/lib'

import type { db } from '@/shared/db'

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

const DEFAULT_KEYWORD_MAPPINGS: Record<string, string[]> = {
  Продукты: [
    'молоко',
    'хлеб',
    'яйца',
    'сыр',
    'мясо',
    'рыба',
    'овощи',
    'фрукты',
    'масло',
    'крупа',
    'макароны',
    'сахар',
    'соль',
    'кефир',
    'йогурт',
    'колбаса',
    'курица',
    'картошка',
    'лук',
    'морковь',
    'магнит',
    'пятёрочка',
    'перекрёсток',
    'ашан',
    'лента',
  ],
  Транспорт: [
    'такси',
    'метро',
    'автобус',
    'бензин',
    'яндекс такси',
    'uber',
    'парковка',
    'каршеринг',
    'электричка',
  ],
  Еда: [
    'кофе',
    'обед',
    'ужин',
    'завтрак',
    'ресторан',
    'кафе',
    'пицца',
    'суши',
    'бургер',
    'доставка еды',
    'яндекс еда',
  ],
  Здоровье: [
    'аптека',
    'лекарства',
    'врач',
    'стоматолог',
    'анализы',
    'витамины',
    'клиника',
  ],
  Развлечения: [
    'кино',
    'театр',
    'концерт',
    'музей',
    'подписка',
    'netflix',
    'spotify',
    'игра',
  ],
}

export async function seedUserDefaults(
  tx: SeedTransaction,
  userId: string
): Promise<void> {
  const categoryRows = DEFAULT_CATEGORIES.map((category) => ({
    id: crypto.randomUUID(),
    userId,
    ...category,
  }))

  await tx.insert(categories).values(categoryRows)

  const categoryIdByName = new Map(
    categoryRows.map((category) => [category.name, category.id])
  )
  const keywordRows = Object.entries(DEFAULT_KEYWORD_MAPPINGS).flatMap(
    ([categoryName, keywords]) => {
      const categoryId = categoryIdByName.get(categoryName)
      if (!categoryId) return []

      return keywords.map((keyword) => ({
        id: crypto.randomUUID(),
        userId,
        keyword: keyword.trim().toLowerCase(),
        categoryId,
      }))
    }
  )

  if (keywordRows.length > 0) {
    await tx.insert(keywordMappings).values(keywordRows)
  }

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
