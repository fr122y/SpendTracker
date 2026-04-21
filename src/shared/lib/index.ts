// Shared Library - Utilities
export {
  getMonthlyExpenses,
  getDailyExpenses,
  getCategoryStats,
  getPersonalExpenses,
  getProjectExpenses,
  getWeeklyStats,
  getWeeklyPersonalStats,
  formatDate,
  type CategoryStat,
  type WeeklyStat,
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
