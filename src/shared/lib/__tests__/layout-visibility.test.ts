import {
  ALL_WIDGET_IDS,
  DEFAULT_LAYOUT,
  assertValidHidden,
  getVisibleWidgetIds,
  hideWidget,
  normalizeLayoutConfig,
  resetLayout,
  showWidget,
} from '../layout-config'

import type { LayoutConfig, WidgetId } from '@/shared/types'

const withHidden = (hidden: unknown): LayoutConfig =>
  ({ ...DEFAULT_LAYOUT, hidden }) as unknown as LayoutConfig

describe('layout widget visibility', () => {
  describe('normalizeLayoutConfig', () => {
    it('keeps an old config without hidden unchanged', () => {
      const normalized = normalizeLayoutConfig(DEFAULT_LAYOUT)
      expect(normalized).toEqual(DEFAULT_LAYOUT)
      expect('hidden' in normalized).toBe(false)
    })

    it('removes hidden widgets from columns', () => {
      const normalized = normalizeLayoutConfig(withHidden(['ANALYSIS']))
      expect(normalized.hidden).toEqual(['ANALYSIS'])
      expect(getVisibleWidgetIds(normalized)).not.toContain('ANALYSIS')
    })

    it('drops unknown, duplicate and non-string hidden ids', () => {
      const normalized = normalizeLayoutConfig(
        withHidden(['ANALYSIS', 'UNKNOWN', 'ANALYSIS', 42])
      )
      expect(normalized.hidden).toEqual(['ANALYSIS'])
    })

    it('treats a non-array hidden as nothing hidden', () => {
      const normalized = normalizeLayoutConfig(withHidden('ANALYSIS'))
      expect(normalized.hidden).toBeUndefined()
      expect(getVisibleWidgetIds(normalized)).toHaveLength(
        ALL_WIDGET_IDS.length
      )
    })

    it('shows every widget when hidden would hide all of them', () => {
      const normalized = normalizeLayoutConfig(withHidden([...ALL_WIDGET_IDS]))
      expect(normalized.hidden).toBeUndefined()
      expect(getVisibleWidgetIds(normalized)).toHaveLength(
        ALL_WIDGET_IDS.length
      )
    })

    it('shows a widget missing from both columns and hidden', () => {
      const layout: LayoutConfig = {
        columns: DEFAULT_LAYOUT.columns.map((column) => ({
          ...column,
          widgets: column.widgets.filter((id) => id !== 'POCKETS'),
        })),
        hidden: ['ANALYSIS'],
      }
      const normalized = normalizeLayoutConfig(layout)
      expect(getVisibleWidgetIds(normalized)).toContain('POCKETS')
      expect(normalized.hidden).toEqual(['ANALYSIS'])
    })
  })

  describe('hideWidget', () => {
    it('moves a widget from its column to hidden', () => {
      const next = hideWidget(DEFAULT_LAYOUT, 'DYNAMICS')
      expect(next.columns[1].widgets).toEqual(['ANALYSIS', 'PROJECTS'])
      expect(next.hidden).toEqual(['DYNAMICS'])
    })

    it('does not hide the last visible widget', () => {
      let layout: LayoutConfig = DEFAULT_LAYOUT
      const [last, ...rest] = ALL_WIDGET_IDS
      for (const id of rest) layout = hideWidget(layout, id)
      expect(getVisibleWidgetIds(layout)).toEqual([last])
      expect(hideWidget(layout, last)).toBe(layout)
    })
  })

  describe('showWidget', () => {
    it('returns a widget to its default position', () => {
      const hidden = hideWidget(DEFAULT_LAYOUT, 'DYNAMICS')
      const shown = showWidget(hidden, 'DYNAMICS')
      expect(shown).toEqual(DEFAULT_LAYOUT)
      expect(shown.hidden).toBeUndefined()
    })

    it('appends to the end of its column when followers moved away', () => {
      const layout: LayoutConfig = {
        columns: [
          { id: 'col-1', width: 33, widgets: ['CALENDAR', 'EXPENSE_LOG'] },
          { id: 'col-2', width: 33, widgets: ['ANALYSIS', 'PROJECTS'] },
          {
            id: 'col-3',
            width: 34,
            widgets: ['WEEKLY_BUDGET', 'SAVINGS', 'POCKETS', 'CATEGORIES'],
          },
        ],
        hidden: ['DYNAMICS'] as WidgetId[],
      }
      const moved = {
        ...layout,
        columns: layout.columns.map((c) =>
          c.id === 'col-2' ? { ...c, widgets: ['ANALYSIS'] as WidgetId[] } : c
        ),
      }
      const shown = showWidget(moved, 'DYNAMICS')
      expect(shown.columns[1].widgets).toEqual(['ANALYSIS', 'DYNAMICS'])
    })
  })

  it('resetLayout restores the default and shows every widget', () => {
    const reset = resetLayout()
    expect(reset).toEqual(DEFAULT_LAYOUT)
    expect(reset).not.toBe(DEFAULT_LAYOUT)
  })

  describe('assertValidHidden', () => {
    it('accepts missing and valid hidden', () => {
      expect(() => assertValidHidden(undefined)).not.toThrow()
      expect(() => assertValidHidden(['ANALYSIS'])).not.toThrow()
    })

    it.each([
      ['a non-array', 'ANALYSIS'],
      ['an unknown id', ['NOPE']],
      ['every widget', [...ALL_WIDGET_IDS]],
    ])('rejects %s', (_label, value) => {
      expect(() => assertValidHidden(value)).toThrow()
    })
  })
})
