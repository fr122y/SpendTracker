// Shared Library - Utilities
export {
  getMonthlyExpenses,
  getDailyExpenses,
  getCategoryStats,
  getWeeklyStats,
  type CategoryStat,
  type WeeklyStat,
} from './finance-selectors'

export { cn } from './cn'

// Reatom
export { ReatomProvider, createPersist } from './reatom'

// Note: WIDGET_REGISTRY is not exported here to avoid circular dependencies
// Import it directly from '@/shared/lib/widget-registry' where needed
