/**
 * Backfills layout_config for all users:
 * - keeps existing widget order where possible
 * - adds missing widgets (PROJECTS/CATEGORIES/SETTINGS, etc.)
 * - removes duplicates/invalid widget ids
 *
 * Usage: node scripts/backfill-layout-config.mjs
 */

import fs from 'fs'
import path from 'path'
import postgres from 'postgres'

const ALL_WIDGET_IDS = [
  'CALENDAR',
  'EXPENSE_LOG',
  'ANALYSIS',
  'DYNAMICS',
  'WEEKLY_BUDGET',
  'SAVINGS',
  'PROJECTS',
  'CATEGORIES',
  'SETTINGS',
]

function isWidgetId(value) {
  return typeof value === 'string' && ALL_WIDGET_IDS.includes(value)
}

function normalizeLayoutConfig(input) {
  if (!input || !Array.isArray(input.columns) || input.columns.length === 0) {
    return {
      columns: [
        {
          id: 'col-1',
          width: 33,
          widgets: ['CALENDAR', 'EXPENSE_LOG', 'CATEGORIES'],
        },
        {
          id: 'col-2',
          width: 33,
          widgets: ['ANALYSIS', 'DYNAMICS', 'PROJECTS'],
        },
        {
          id: 'col-3',
          width: 34,
          widgets: ['WEEKLY_BUDGET', 'SAVINGS', 'SETTINGS'],
        },
      ],
    }
  }

  const normalized = {
    columns: input.columns.map((column) => ({
      id: column.id,
      width: column.width,
      widgets: [],
    })),
  }

  const seen = new Set()

  input.columns.forEach((column, columnIndex) => {
    const widgets = Array.isArray(column.widgets) ? column.widgets : []
    widgets.forEach((widgetId) => {
      if (!isWidgetId(widgetId) || seen.has(widgetId)) return
      seen.add(widgetId)
      normalized.columns[columnIndex].widgets.push(widgetId)
    })
  })

  const missing = ALL_WIDGET_IDS.filter((widgetId) => !seen.has(widgetId))

  for (const widgetId of missing) {
    const targetColumn = normalized.columns.reduce((smallest, column) =>
      column.widgets.length < smallest.widgets.length ? column : smallest
    )
    targetColumn.widgets.push(widgetId)
  }

  return normalized
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

const rows = await sql`
  SELECT id, config
  FROM layout_config
`

let updated = 0

for (const row of rows) {
  const nextConfig = normalizeLayoutConfig(row.config)
  const hasChanges = JSON.stringify(row.config) !== JSON.stringify(nextConfig)

  if (!hasChanges) continue

  await sql`
    UPDATE layout_config
    SET config = ${sql.json(nextConfig)}
    WHERE id = ${row.id}
  `
  updated++
}

console.log(
  `Processed ${rows.length} layout_config rows, updated ${updated} rows.`
)

await sql.end()
