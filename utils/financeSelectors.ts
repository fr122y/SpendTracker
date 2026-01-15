
import { Expense, Category } from '../types';

export const getMonthlyExpenses = (expenses: Expense[], viewDate: Date) => {
  return expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
  });
};

export const getDailyExpenses = (expenses: Expense[], selectedDate: Date) => {
  const dateStr = selectedDate.toDateString();
  return expenses.filter(exp => new Date(exp.date).toDateString() === dateStr);
};

export const getWeekRange = (date: Date) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(current.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const getWeeklyStats = (expenses: Expense[], selectedDate: Date) => {
  const { start, end } = getWeekRange(selectedDate);
  const spent = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    })
    .reduce((s, e) => s + e.amount, 0);
  return { spent, start, end };
};

export const getCategoryStats = (expenses: Expense[], viewDate: Date) => {
  const monthly = getMonthlyExpenses(expenses, viewDate);
  const map: Record<string, { amount: number; emoji: string }> = {};
  
  monthly.forEach(exp => {
    const cat = exp.isCategorizing ? '...' : exp.category;
    if (!map[cat]) map[cat] = { amount: 0, emoji: exp.emoji };
    map[cat].amount += exp.amount;
  });

  return Object.entries(map)
    .map(([name, info]) => ({ name, value: info.amount, emoji: info.emoji }))
    .sort((a, b) => b.value - a.value);
};

export const getDailyTotalsMap = (expenses: Expense[], viewDate: Date) => {
  const monthly = getMonthlyExpenses(expenses, viewDate);
  const map: Record<number, number> = {};
  monthly.forEach(exp => {
    const day = new Date(exp.date).getDate();
    map[day] = (map[day] || 0) + exp.amount;
  });
  return map;
};

export const getChartData = (expenses: Expense[], viewDate: Date) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyData = [];
  const weekStartDays: number[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const total = expenses
      .filter(exp => {
        const d = new Date(exp.date);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    dailyData.push({ day, amount: total, fullDate: currentDate });
    if (currentDate.getDay() === 1) weekStartDays.push(day);
  }
  return { dailyData, weekStartDays };
};
