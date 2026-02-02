// Mock all widgets to avoid importing the entire widget tree
jest.mock('@/widgets/analysis', () => ({
  AnalysisDashboard: () => null,
}))
jest.mock('@/widgets/calendar', () => ({
  Calendar: () => null,
}))
jest.mock('@/widgets/categories-settings', () => ({
  CategoriesSection: () => null,
}))
jest.mock('@/widgets/dynamics-chart', () => ({
  DailySpendingChart: () => null,
}))
jest.mock('@/widgets/expense-log', () => ({
  ExpenseLog: () => null,
}))
jest.mock('@/widgets/financial-settings', () => ({
  FinancialSettingsSection: () => null,
}))
jest.mock('@/widgets/projects', () => ({
  ProjectsSection: () => null,
}))
jest.mock('@/widgets/savings', () => ({
  SavingsSection: () => null,
}))
jest.mock('@/widgets/weekly-budget', () => ({
  WeeklyBudget: () => null,
}))

import { WIDGET_REGISTRY, type WidgetRegistryEntry } from '../index'

import type { WidgetId } from '@/shared/types'

// All widget IDs defined in the system
const ALL_WIDGET_IDS: WidgetId[] = [
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

describe('Widget Registry', () => {
  describe('registry completeness', () => {
    it('should have entries for all widget IDs', () => {
      ALL_WIDGET_IDS.forEach((widgetId) => {
        expect(WIDGET_REGISTRY[widgetId]).toBeDefined()
      })
    })

    it('should have exactly 9 widgets registered', () => {
      expect(Object.keys(WIDGET_REGISTRY)).toHaveLength(9)
    })

    it('should only contain valid widget IDs', () => {
      const registryKeys = Object.keys(WIDGET_REGISTRY) as WidgetId[]
      registryKeys.forEach((key) => {
        expect(ALL_WIDGET_IDS).toContain(key)
      })
    })
  })

  describe('registry entry structure', () => {
    it.each(ALL_WIDGET_IDS)(
      'should have valid entry structure for %s',
      (widgetId) => {
        const entry: WidgetRegistryEntry = WIDGET_REGISTRY[widgetId]

        expect(entry).toHaveProperty('component')
        expect(entry).toHaveProperty('title')
        expect(entry).toHaveProperty('icon')

        expect(typeof entry.component).toBe('function')
        expect(typeof entry.title).toBe('string')
        expect(entry.title.length).toBeGreaterThan(0)
        // Icons from lucide-react are ForwardRef components (objects with $$typeof)
        expect(entry.icon).toBeDefined()
        expect(
          entry.icon.$$typeof || typeof entry.icon === 'function'
        ).toBeTruthy()
      }
    )
  })

  describe('widget titles', () => {
    it('should have unique titles for all widgets', () => {
      const titles = Object.values(WIDGET_REGISTRY).map((entry) => entry.title)
      const uniqueTitles = new Set(titles)
      expect(uniqueTitles.size).toBe(titles.length)
    })

    it('should have Russian titles', () => {
      // Check that titles contain Cyrillic characters
      const cyrillicRegex = /[а-яА-ЯёЁ]/
      Object.values(WIDGET_REGISTRY).forEach((entry) => {
        expect(cyrillicRegex.test(entry.title)).toBe(true)
      })
    })
  })
})
