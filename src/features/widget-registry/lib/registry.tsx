import {
  Calendar as CalendarIcon,
  Receipt,
  PieChart,
  TrendingUp,
  Wallet,
  PiggyBank,
  Folder,
  Tags,
  Settings,
} from 'lucide-react'

import { AnalysisDashboard } from '@/widgets/analysis'
import { Calendar } from '@/widgets/calendar'
import { CategoriesSection } from '@/widgets/categories-settings'
import { DailySpendingChart } from '@/widgets/dynamics-chart'
import { ExpenseLog } from '@/widgets/expense-log'
import { FinancialSettingsSection } from '@/widgets/financial-settings'
import { ProjectsSection } from '@/widgets/projects'
import { SavingsSection } from '@/widgets/savings'
import { WeeklyBudget } from '@/widgets/weekly-budget'

import type { WidgetId } from '@/shared/types'
import type { LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'

export interface WidgetRegistryEntry {
  component: ComponentType
  title: string
  icon: LucideIcon
}

export const WIDGET_REGISTRY: Record<WidgetId, WidgetRegistryEntry> = {
  CALENDAR: {
    component: Calendar,
    title: 'Календарь',
    icon: CalendarIcon,
  },
  EXPENSE_LOG: {
    component: ExpenseLog,
    title: 'Журнал расходов',
    icon: Receipt,
  },
  ANALYSIS: {
    component: AnalysisDashboard,
    title: 'Анализ',
    icon: PieChart,
  },
  DYNAMICS: {
    component: DailySpendingChart,
    title: 'Динамика',
    icon: TrendingUp,
  },
  WEEKLY_BUDGET: {
    component: WeeklyBudget,
    title: 'Недельный бюджет',
    icon: Wallet,
  },
  SAVINGS: {
    component: SavingsSection,
    title: 'Накопления',
    icon: PiggyBank,
  },
  PROJECTS: {
    component: ProjectsSection,
    title: 'Проекты',
    icon: Folder,
  },
  CATEGORIES: {
    component: CategoriesSection,
    title: 'Категории',
    icon: Tags,
  },
  SETTINGS: {
    component: FinancialSettingsSection,
    title: 'Настройки',
    icon: Settings,
  },
}
