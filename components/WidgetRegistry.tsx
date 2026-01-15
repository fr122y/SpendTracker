
import React, { useMemo } from 'react';
import { WidgetId, Currency } from '../types';
import Calendar from './Calendar';
import ProjectSection from './ProjectSection';
import AnalysisDashboard from './AnalysisDashboard';
import DailySpendingChart from './DailySpendingChart';
import WeeklyBudget from './WeeklyBudget';
import SavingsCalculator from './SavingsCalculator';
import CategorySettings from './CategorySettings';
import FinancialSettings from './FinancialSettings';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import TerminalPanel from './TerminalPanel';
import { useFinance } from '../store/FinanceContext';
import { 
  getDailyExpenses, 
  getCategoryStats, 
  getDailyTotalsMap, 
  getChartData, 
  getWeeklyStats 
} from '../utils/financeSelectors';
import { Calendar as CalendarIcon, Activity, FileText, Target, PieChart, Settings2, Settings, Briefcase } from 'lucide-react';

interface WidgetProps {
  id: WidgetId;
  isEditMode: boolean;
  onDragStart: () => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewDate: Date;
  setViewDate: (date: Date) => void;
}

export const WidgetRenderer: React.FC<WidgetProps> = ({ 
  id, isEditMode, onDragStart, selectedDate, setSelectedDate, viewDate, setViewDate 
}) => {
  const finance = useFinance();
  const currency = Currency.RUB;

  const common = {
    isEditMode,
    widgetId: id,
    onDragStart,
  };

  // Фильтруем основные расходы (без проектов) один раз
  const regularExpenses = useMemo(() => 
    finance.expenses.filter(exp => !exp.projectId), 
    [finance.expenses]
  );

  switch (id) {
    case 'CALENDAR':
      const dailyTotals = useMemo(() => getDailyTotalsMap(regularExpenses, viewDate), [regularExpenses, viewDate]);
      return (
        <TerminalPanel title="Date_Nav" icon={<CalendarIcon className="w-4 h-4" />} {...common}>
          <Calendar 
            viewDate={viewDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            dailyTotals={dailyTotals}
            currency={currency}
            salaryDay={finance.salaryDay}
            advanceDay={finance.advanceDay}
          />
        </TerminalPanel>
      );
    case 'PROJECTS':
      return (
        <ProjectSection 
          projects={finance.projects}
          expenses={finance.expenses}
          onAddProject={finance.addProject}
          onDeleteProject={finance.deleteProject}
          onAddProjectExpense={(pid, d, a) => finance.addExpense(d, a, pid, selectedDate)}
          onDeleteExpense={finance.deleteExpense}
          currency={currency}
          {...common}
        />
      );
    case 'ANALYSIS':
      const stats = useMemo(() => getCategoryStats(regularExpenses, selectedDate), [regularExpenses, selectedDate]);
      return (
        <TerminalPanel title="Category_Schema" icon={<Activity className="w-4 h-4" />} {...common}>
           <AnalysisDashboard stats={stats} currency={currency} />
        </TerminalPanel>
      );
    case 'DYNAMICS':
      const chartData = useMemo(() => getChartData(regularExpenses, viewDate), [regularExpenses, viewDate]);
      return (
        <TerminalPanel title="Month_Dynamics" icon={<Activity className="w-4 h-4" />} {...common}>
          <DailySpendingChart 
            data={chartData.dailyData}
            weekStartDays={chartData.weekStartDays}
            currency={currency}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </TerminalPanel>
      );
    case 'EXPENSE_LOG':
      const dailyExpenses = useMemo(() => getDailyExpenses(regularExpenses, selectedDate), [regularExpenses, selectedDate]);
      const dailyTotal = dailyExpenses.reduce((s, e) => s + e.amount, 0);
      return (
        <TerminalPanel title={`System_Log: ${selectedDate.toLocaleDateString()}`} icon={<FileText className="w-4 h-4" />} {...common}>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-xs font-mono text-zinc-500 uppercase font-black">Daily Total:</span>
              <span className="text-sm font-mono text-emerald-400 font-black">
                {dailyTotal.toLocaleString()} {currency}
              </span>
            </div>
            <ExpenseForm onAdd={(d, a) => finance.addExpense(d, a, undefined, selectedDate)} isProcessing={finance.isProcessing} />
            <ExpenseList 
              expenses={dailyExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())} 
              onDelete={finance.deleteExpense} 
              currency={currency}
            />
          </div>
        </TerminalPanel>
      );
    case 'WEEKLY_BUDGET':
      const weekly = useMemo(() => getWeeklyStats(regularExpenses, selectedDate), [regularExpenses, selectedDate]);
      return (
        <WeeklyBudget 
          spent={weekly.spent}
          limit={finance.weeklyLimit}
          startDate={weekly.start}
          endDate={weekly.end}
          onUpdateLimit={finance.setWeeklyLimit}
          currency={currency}
          {...common}
        />
      );
    case 'SAVINGS':
      return (
        <SavingsCalculator 
          currency={currency}
          buckets={finance.buckets}
          onAddBucket={finance.addBucket}
          onRemoveBucket={finance.removeBucket}
          onUpdateBucket={finance.updateBucket}
          {...common}
        />
      );
    case 'CATEGORIES':
      return (
        <CategorySettings 
          categories={finance.categories}
          onAddCategory={finance.addCategory}
          onRemoveCategory={finance.removeCategory}
          {...common}
        />
      );
    case 'SETTINGS':
      return (
        <FinancialSettings 
          salaryDay={finance.salaryDay}
          advanceDay={finance.advanceDay}
          onUpdateSalaryDay={finance.setSalaryDay}
          onUpdateAdvanceDay={finance.setAdvanceDay}
          {...common}
        />
      );
    default: return null;
  }
};
