// Shared Types - Global TypeScript Definitions

// Expense entity
export interface Expense {
  id: string
  description: string
  amount: number
  date: string // ISO date string
  category: string // Name of the category
  emoji: string
  projectId?: string // Optional
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
  | 'SETTINGS'

export interface ColumnConfig {
  id: string
  width: number
  widgets: WidgetId[]
}

export interface LayoutConfig {
  columns: ColumnConfig[]
}

// AI Categorization Result
export interface CategorizationResult {
  category: string
  emoji: string
}
