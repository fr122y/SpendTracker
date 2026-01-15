
export interface Project {
  id: string;
  name: string;
  budget: number;
  color: string;
  createdAt: string;
}

export interface AllocationBucket {
  id: string;
  label: string;
  percentage: number;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  emoji: string;
  isCategorizing: boolean;
  projectId?: string; 
}

export enum Currency {
  RUB = '₽',
  USD = '$',
  EUR = '€'
}

export type WidgetId = 
  | 'CALENDAR' 
  | 'PROJECTS' 
  | 'ANALYSIS' 
  | 'DYNAMICS' 
  | 'EXPENSE_LOG' 
  | 'WEEKLY_BUDGET' 
  | 'SAVINGS' 
  | 'CATEGORIES' 
  | 'SETTINGS';

export interface ColumnConfig {
  id: string;
  width: number; // Percentage
  widgets: WidgetId[];
}

export interface LayoutConfig {
  columns: ColumnConfig[];
}
