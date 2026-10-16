import type { LayoutConfig, WidgetId } from '@/shared/types'

export const ALL_WIDGET_IDS: WidgetId[] = [
  'CALENDAR',
  'EXPENSE_LOG',
  'ANALYSIS',
  'DYNAMICS',
  'WEEKLY_BUDGET',
  'SAVINGS',
  'PROJECTS',
  'POCKETS',
  'CATEGORIES',
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
      widgets: ['WEEKLY_BUDGET', 'SAVINGS', 'POCKETS'],
    },
  ],
}

export function cloneLayout(layout: LayoutConfig): LayoutConfig {
  const clone: LayoutConfig = {
    columns: layout.columns.map((column) => ({
      id: column.id,
      width: column.width,
      widgets: [...column.widgets],
    })),
  }
  if (layout.hidden?.length) {
    clone.hidden = [...layout.hidden]
  }
  return clone
}

function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === 'string' && ALL_WIDGET_IDS.includes(value as WidgetId)
}

function sanitizeHidden(value: unknown): WidgetId[] {
  if (!Array.isArray(value)) return []
  const hidden: WidgetId[] = []
  for (const item of value) {
    if (isWidgetId(item) && !hidden.includes(item)) hidden.push(item)
  }
  // At least one widget must stay visible.
  return hidden.length >= ALL_WIDGET_IDS.length ? [] : hidden
}

/**
 * Throws when `hidden` is not a valid list of widget ids or hides every
 * widget. Missing `hidden` is valid and means nothing is hidden.
 */
export function assertValidHidden(value: unknown): void {
  if (value === undefined) return
  if (!Array.isArray(value)) {
    throw new Error('Invalid layout: hidden must be an array')
  }
  if (!value.every(isWidgetId)) {
    throw new Error('Invalid layout: hidden contains an unknown widget')
  }
  if (new Set(value).size >= ALL_WIDGET_IDS.length) {
    throw new Error('Invalid layout: at least one widget must stay visible')
  }
}

export function getVisibleWidgetIds(layout: LayoutConfig): WidgetId[] {
  return layout.columns.flatMap((column) => column.widgets)
}

export function normalizeLayoutConfig(input: LayoutConfig): LayoutConfig {
  if (!input.columns.length) {
    return cloneLayout(DEFAULT_LAYOUT)
  }

  const hidden = sanitizeHidden(input.hidden)

  const normalized: LayoutConfig = {
    columns: input.columns.map((column) => ({
      id: column.id,
      width: column.width,
      widgets: [] as WidgetId[],
    })),
  }

  const seen = new Set<WidgetId>(hidden)

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

  // Keep old configs without `hidden` byte-identical after normalization.
  if (hidden.length) {
    normalized.hidden = hidden
  }

  return normalized
}

/** Hides a visible widget. The last visible widget cannot be hidden. */
export function hideWidget(
  layout: LayoutConfig,
  widgetId: WidgetId
): LayoutConfig {
  const visible = getVisibleWidgetIds(layout)
  if (!visible.includes(widgetId) || visible.length <= 1) {
    return layout
  }
  return {
    columns: layout.columns.map((column) => ({
      ...column,
      widgets: column.widgets.filter((id) => id !== widgetId),
    })),
    hidden: [...(layout.hidden ?? []), widgetId],
  }
}

/**
 * Shows a hidden widget at its default column position: before the first
 * widget that follows it in the default column, otherwise at the column end.
 */
export function showWidget(
  layout: LayoutConfig,
  widgetId: WidgetId
): LayoutConfig {
  if (!layout.hidden?.includes(widgetId)) return layout

  const defaultColumn = DEFAULT_LAYOUT.columns.find((column) =>
    column.widgets.includes(widgetId)
  )
  const targetColumn =
    layout.columns.find((column) => column.id === defaultColumn?.id) ??
    layout.columns.reduce((smallest, column) =>
      column.widgets.length < smallest.widgets.length ? column : smallest
    )
  const followers = defaultColumn
    ? defaultColumn.widgets.slice(defaultColumn.widgets.indexOf(widgetId) + 1)
    : []

  const remainingHidden = layout.hidden.filter((id) => id !== widgetId)
  const next: LayoutConfig = {
    columns: layout.columns.map((column) => {
      if (column !== targetColumn) return column
      const widgets = [...column.widgets]
      const insertAt = widgets.findIndex((id) => followers.includes(id))
      widgets.splice(insertAt === -1 ? widgets.length : insertAt, 0, widgetId)
      return { ...column, widgets }
    }),
  }
  if (remainingHidden.length) next.hidden = remainingHidden
  return next
}

/** Default layout with every widget visible. */
export function resetLayout(): LayoutConfig {
  return cloneLayout(DEFAULT_LAYOUT)
}

export function isLayoutEqual(a: LayoutConfig, b: LayoutConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
