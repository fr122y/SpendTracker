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

export {
  createTempId,
  getKnownId,
  isPendingId,
  isPendingIdLostError,
  isTempId,
  PendingIdLostError,
  replaceRecordId,
  resolveId,
  resolveIdFields,
  subscribePendingIds,
  trackPendingId,
  type PendingIdHandle,
} from './pending-ids'

// Reatom
export { ReatomProvider } from './reatom'

// Hooks
export {
  useViewport,
  useResolvedViewport,
  getViewport,
  isMobile,
  isTabletOrSmaller,
  useSubmitLock,
  useFormDraft,
  resetFormDrafts,
  hasUnsavedFormInput,
  holdSubmittedDraft,
  useBackDismiss,
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
export {
  SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_REASON,
  handleRequestFailure,
  isLeavingForLogin,
} from './session-expiry'

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
export {
  CATEGORY_COLORS,
  getCategoryColor,
  getFallbackCategoryColor,
  isCategoryColor,
  type CategoryColor,
} from './category-color'
export { countGraphemes, limitGraphemes } from './grapheme'

export { normalizeKeywordPhrase } from './keyword-phrase'
export {
  CATEGORY_NAME_MAX_LENGTH,
  CATEGORY_NAME_TOO_LONG_MESSAGE,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_DESCRIPTION_TOO_LONG_MESSAGE,
  getTextLimitMessage,
  isCategoryNameTooLong,
  isExpenseDescriptionTooLong,
} from './text-limits'
export { requestWidgetReveal, subscribeWidgetReveal } from './widget-reveal'
