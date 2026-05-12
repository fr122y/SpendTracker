// Shared Library - Utilities
export {
  getMonthlyExpenses,
  getDailyExpenses,
  getDailyOperations,
  getDailyExpenseTotal,
  getCategoryStats,
  getPersonalExpenses,
  getProjectExpenses,
  getProjectOperations,
  getProjectSpent,
  getProjectCashOnHand,
  getWeeklyStats,
  getWeeklyPersonalStats,
  getWeeklyProjectEnvelopeStats,
  formatDate,
  type CategoryStat,
  type WeeklyStat,
  type WeeklyProjectEnvelopeStat,
} from './finance-selectors'

export { cn } from './cn'

// Reatom
export { ReatomProvider } from './reatom'

// Hooks
export {
  useViewport,
  isMobile,
  isTabletOrSmaller,
  type Viewport,
} from './hooks'

// Note: WIDGET_REGISTRY has been moved to @/features/widget-registry
// Import it directly from '@/features/widget-registry' where needed

export { evaluateMathExpression } from './math-eval'
export { showMutationRollbackToast } from './mutation-toast'

// Layout config helpers
export {
  ALL_WIDGET_IDS,
  DEFAULT_LAYOUT,
  normalizeLayoutConfig,
  isLayoutEqual,
} from './layout-config'
