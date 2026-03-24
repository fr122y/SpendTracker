/**
 * Backfills keyword_mapping for users that currently have no mappings.
 *
 * Usage: node scripts/backfill-keyword-mappings.mjs
 */

import fs from 'fs'
import path from 'path'
import postgres from 'postgres'

const DEFAULT_KEYWORD_MAPPINGS = {
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

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (!match) continue
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: false,
  prepare: false,
  connect_timeout: 10,
})

const users = await sql`
  SELECT u.id, COUNT(km.id)::int AS mapping_count
  FROM "user" u
  LEFT JOIN keyword_mapping km ON km."userId" = u.id
  GROUP BY u.id
`

let processedUsers = 0
let seededUsers = 0
let insertedRows = 0

for (const user of users) {
  processedUsers++
  if (user.mapping_count > 0) continue

  const categories = await sql`
    SELECT id, name
    FROM category
    WHERE "userId" = ${user.id}
  `

  const categoryIdByName = new Map(categories.map((row) => [row.name, row.id]))

  const rows = []
  for (const [categoryName, keywords] of Object.entries(
    DEFAULT_KEYWORD_MAPPINGS
  )) {
    const categoryId = categoryIdByName.get(categoryName)
    if (!categoryId) continue

    for (const keyword of keywords) {
      rows.push({
        id: crypto.randomUUID(),
        userId: user.id,
        keyword: keyword.trim().toLowerCase(),
        categoryId,
      })
    }
  }

  if (rows.length === 0) continue

  const inserted = await sql`
    INSERT INTO keyword_mapping (id, "userId", keyword, "categoryId")
    VALUES ${sql(rows.map((row) => [row.id, row.userId, row.keyword, row.categoryId]))}
    ON CONFLICT ("userId", keyword) DO UPDATE
    SET "categoryId" = EXCLUDED."categoryId"
    RETURNING id
  `

  seededUsers++
  insertedRows += inserted.length
}

console.log(
  `Processed ${processedUsers} users, seeded ${seededUsers} users, inserted ${insertedRows} rows.`
)

await sql.end()
