import type { LayoutConfig, WidgetId } from '@/shared/types'

export const ALL_WIDGET_IDS: WidgetId[] = [
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

export const DEFAULT_LAYOUT: LayoutConfig = {
  columns: [
    {
      id: 'col-1',
      width: 33,
      widgets: ['CALENDAR', 'EXPENSE_LOG', 'CATEGORIES'],
    },
    { id: 'col-2', width: 33, widgets: ['ANALYSIS', 'DYNAMICS', 'PROJECTS'] },
    {
      id: 'col-3',
      width: 34,
      widgets: ['WEEKLY_BUDGET', 'SAVINGS', 'SETTINGS'],
    },
  ],
}

function cloneLayout(layout: LayoutConfig): LayoutConfig {
  return {
    columns: layout.columns.map((column) => ({
      id: column.id,
      width: column.width,
      widgets: [...column.widgets],
    })),
  }
}

function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === 'string' && ALL_WIDGET_IDS.includes(value as WidgetId)
}

export function normalizeLayoutConfig(input: LayoutConfig): LayoutConfig {
  if (!input.columns.length) {
    return cloneLayout(DEFAULT_LAYOUT)
  }

  const normalized = {
    columns: input.columns.map((column) => ({
      id: column.id,
      width: column.width,
      widgets: [] as WidgetId[],
    })),
  }

  const seen = new Set<WidgetId>()

  input.columns.forEach((column, columnIndex) => {
    column.widgets.forEach((widgetId) => {
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

export function isLayoutEqual(a: LayoutConfig, b: LayoutConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
