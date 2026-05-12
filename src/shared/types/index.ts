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
  operationType?: MoneyOperationType
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
