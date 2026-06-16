// Shared Types - Global TypeScript Definitions

export type MoneyOperationType =
  | 'expense'
  | 'project_withdrawal'
  | 'project_return'

// Expense entity
export interface Expense {
  id: string
  description: string
  amount: number
  date: string // ISO date string
  category: string // Name of the category
  emoji: string
  projectId?: string // Optional
  sharedBudgetId?: string
  sharedBudgetCategoryId?: string
  authorUserId?: string
  authorName?: string
  sharedBudgetName?: string
  operationType?: MoneyOperationType
}

export type SharedBudgetRole = 'owner' | 'member'

export interface SharedBudgetMember {
  userId: string
  name?: string
  email?: string
  role: SharedBudgetRole
  isActive: boolean
  joinedAt: string
}

export interface SharedWeeklyLimitSetting {
  effectiveWeekStart: string
  amount: number
}

export interface SharedBudget {
  id: string
  name: string
  createdByUserId: string
  archivedAt?: string
  createdAt: string
  role: SharedBudgetRole
  isActive: boolean
  members: SharedBudgetMember[]
  weeklyLimits: SharedWeeklyLimitSetting[]
}

export interface CreateSharedBudgetInput {
  name: string
  initialWeeklyLimit: number
  effectiveWeekStart: string
}

export type SharedBudgetInviteStatus =
  | 'valid'
  | 'invalid'
  | 'expired'
  | 'used'
  | 'archived'
  | 'duplicate-member'
  | 'accepted'

export interface SharedBudgetInvitePreview {
  status: SharedBudgetInviteStatus
  sharedBudgetName?: string
}

export interface SharedBudgetInviteResult {
  inviteUrl: string
  expiresAt: string
}

export interface SharedBudgetCategory {
  id: string
  sharedBudgetId: string
  name: string
  emoji: string
  archivedAt?: string
  createdAt: string
}

// Category entity
export interface Category {
  id: string
  name: string
  emoji: string
}

// Project entity
export interface Project {
  id: string
  name: string
  budget: number
  color: string
  createdAt: string
}

// Savings bucket
export interface AllocationBucket {
  id: string
  label: string
  percentage: number
}

// Dashboard Config
export type WidgetId =
  | 'CALENDAR'
  | 'EXPENSE_LOG'
  | 'ANALYSIS'
  | 'DYNAMICS'
  | 'WEEKLY_BUDGET'
  | 'SAVINGS'
  | 'PROJECTS'
  | 'CATEGORIES'

export interface ColumnConfig {
  id: string
  width: number
  widgets: WidgetId[]
}

export interface LayoutConfig {
  columns: ColumnConfig[]
}

export interface KeywordMapping {
  id: string
  keyword: string
  categoryId: string
  categoryName: string
  categoryEmoji: string
}
