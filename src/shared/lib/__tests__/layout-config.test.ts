import {
  ALL_WIDGET_IDS,
  DEFAULT_LAYOUT,
  normalizeLayoutConfig,
} from '../layout-config'

import type { LayoutConfig } from '@/shared/types'

describe('dashboard layout configuration', () => {
  it('includes pockets in the default layout', () => {
    expect(
      DEFAULT_LAYOUT.columns.flatMap((column) => column.widgets)
    ).toContain('POCKETS')
  })

  it('adds pockets when normalizing a saved layout created before the widget existed', () => {
    const legacyLayout = {
      columns: [
        {
          id: 'col-1',
          width: 50,
          widgets: ['CALENDAR', 'EXPENSE_LOG', 'CATEGORIES'],
        },
        {
          id: 'col-2',
          width: 50,
          widgets: ['ANALYSIS', 'DYNAMICS', 'PROJECTS'],
        },
      ],
    } as LayoutConfig

    const normalized = normalizeLayoutConfig(legacyLayout)
    const widgets = normalized.columns.flatMap((column) => column.widgets)

    expect(widgets).toContain('POCKETS')
    expect(widgets).toHaveLength(ALL_WIDGET_IDS.length)
    expect(new Set(widgets).size).toBe(widgets.length)
  })
})
