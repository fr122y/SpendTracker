export const queryKeys = {
  expenses: {
    all: ['expenses'] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  keywordMappings: {
    all: ['keyword-mappings'] as const,
  },
  projects: {
    all: ['projects'] as const,
  },
  buckets: {
    all: ['buckets'] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  sharedBudgets: {
    all: ['shared-budgets'] as const,
  },
  sharedBudgetCategories: {
    list: (sharedBudgetId: string) =>
      ['shared-budget-categories', sharedBudgetId] as const,
  },
  layout: {
    all: ['layout'] as const,
  },
}
