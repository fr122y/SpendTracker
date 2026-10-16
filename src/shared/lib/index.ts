// Shared Library - Utilities
export {
  getMonthlyExpenses,
  getDailyExpenses,
  getDailyOperations,
  getDailyExpenseTotal,
  getScopedExpenses,
  getScopedOperations,
  getCategoryStats,
  getPersonalExpenses,
  getProjectExpenses,
  getProjectOperations,
  getProjectSpent,
  getProjectCashOnHand,
  getWeeklyStats,
  getWeeklyPersonalStats,
  getWeeklyBudgetCoverage,
  getSharedWeeklyBudgetCoverage,
  getPocketMonthSummary,
  getEffectiveWeeklyLimit,
  getWeekBoundaries,
  getWeeklyBudgetSummary,
  isValidWeeklyLimitAmount,
  isWeekStartDate,
  formatDate,
  type CategoryStat,
  type ExpenseScope,
  type WeeklyStat,
  type WeeklyBudgetCoverage,
  type WeeklyBudgetSummary,
  type WeeklyProjectTopUpSegment,
  type WeeklyLimitSetting,
  type PocketMonthSummary,
} from './finance-selectors'

export {
  getPocketMonthHistory,
  type PocketHistoryMonth,
} from './pocket-history'

export { cn } from './cn'

// Reatom
export { ReatomProvider } from './reatom'

// Hooks
export {
  useViewport,
  isMobile,
  isTabletOrSmaller,
  useSubmitLock,
  type Viewport,
} from './hooks'

// Note: WIDGET_REGISTRY has been moved to @/features/widget-registry
// Import it directly from '@/features/widget-registry' where needed

export { evaluateMathExpression } from './math-eval'
export {
  AMOUNT_FORMAT_ERROR,
  AMOUNT_NEGATIVE_ERROR,
  AMOUNT_POSITIVE_ERROR,
  MAX_MONEY_AMOUNT,
  getAmountMaxError,
  isValidMoneyAmount,
  normalizeMoneyAmount,
  parseAmountInput,
  roundToKopecks,
  type MoneyAmountRules,
  type ParsedAmountInput,
} from './money-amount'
export { getSafeCallbackUrl } from './auth-redirect'
export { showMutationRollbackToast } from './mutation-toast'

// Layout config helpers
export {
  ALL_WIDGET_IDS,
  DEFAULT_LAYOUT,
  normalizeLayoutConfig,
  isLayoutEqual,
  assertValidHidden,
  cloneLayout,
  getVisibleWidgetIds,
  hideWidget,
  showWidget,
  resetLayout,
} from './layout-config'

// Income allocation math (kopecks)
export {
  rublesToKopecks,
  percentageToHundredths,
  percentageToKopecks,
  amountToPercentage,
  formatPercentage,
  formatKopecks,
  formatEditableKopecks,
  getBucketAmountKopecks,
  calculateAllocation,
  assertAllocationRepresentable,
} from './allocation'

// Salary and advance day rules
export {
  PAYDAY_MIN,
  PAYDAY_MAX,
  isValidPaydayDay,
  getPaydayInMonth,
} from './payday'

export {
  findPocketNameConflict,
  getPocketNameKey,
  POCKET_NAME_CONFLICT_MESSAGE,
} from './pocket-name'
export { pluralizeRu } from './plural'
export { accountNameSchema, accountPasswordSchema } from './credentials-schema'
