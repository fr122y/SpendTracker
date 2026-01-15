
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Expense, Category, Project, AllocationBucket, Currency } from '../types';
import { storage } from '../services/storageService';
import { categorizeExpense } from '../services/aiService';

interface FinanceContextType {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  buckets: AllocationBucket[];
  weeklyLimit: number;
  salaryDay: number;
  advanceDay: number;
  isProcessing: boolean;
  
  addExpense: (description: string, amount: number, projectId?: string, selectedDate?: Date) => Promise<void>;
  deleteExpense: (id: string) => void;
  addCategory: (name: string, emoji: string) => void;
  removeCategory: (id: string) => void;
  addProject: (name: string, budget: number) => void;
  deleteProject: (id: string) => void;
  addBucket: (label: string, percentage: number) => void;
  removeBucket: (id: string) => void;
  updateBucket: (id: string, updates: Partial<AllocationBucket>) => void;
  setWeeklyLimit: (limit: number) => void;
  setSalaryDay: (day: number) => void;
  setAdvanceDay: (day: number) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚕' },
  { id: '3', name: 'Кафе и еда', emoji: '☕' },
  { id: '4', name: 'Развлечения', emoji: '🎬' },
  { id: '5', name: 'Здоровье', emoji: '💊' },
  { id: '6', name: 'Другое', emoji: '📝' },
];

const DEFAULT_BUCKETS: AllocationBucket[] = [
  { id: '1', label: 'Savings', percentage: 20 },
  { id: '2', label: 'Investments', percentage: 10 },
];

const COLORS = ['bg-purple-600', 'bg-pink-600', 'bg-orange-600', 'bg-indigo-600', 'bg-blue-600', 'bg-emerald-600'];

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>(() => storage.get('expenses', []));
  const [categories, setCategories] = useState<Category[]>(() => storage.get('user_categories', DEFAULT_CATEGORIES));
  const [projects, setProjects] = useState<Project[]>(() => storage.get('projects', []));
  const [buckets, setBuckets] = useState<AllocationBucket[]>(() => storage.get('allocation_buckets', DEFAULT_BUCKETS));
  const [weeklyLimit, setWeeklyLimit] = useState<number>(() => storage.get('weeklyLimit', 0));
  const [salaryDay, setSalaryDay] = useState<number>(() => storage.get('salaryDay', 5));
  const [advanceDay, setAdvanceDay] = useState<number>(() => storage.get('advanceDay', 20));
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { storage.set('expenses', expenses); }, [expenses]);
  useEffect(() => { storage.set('user_categories', categories); }, [categories]);
  useEffect(() => { storage.set('projects', projects); }, [projects]);
  useEffect(() => { storage.set('allocation_buckets', buckets); }, [buckets]);
  useEffect(() => { storage.set('weeklyLimit', weeklyLimit); }, [weeklyLimit]);
  useEffect(() => { storage.set('salaryDay', salaryDay); }, [salaryDay]);
  useEffect(() => { storage.set('advanceDay', advanceDay); }, [advanceDay]);

  const addExpense = async (description: string, amount: number, projectId?: string, selectedDate: Date = new Date()) => {
    const newId = crypto.randomUUID();
    const now = new Date();
    const expenseDate = new Date(selectedDate);
    
    if (expenseDate.toDateString() === now.toDateString()) {
      expenseDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    } else {
      expenseDate.setHours(12, 0, 0, 0); 
    }

    const tempExpense: Expense = {
      id: newId,
      description,
      amount,
      date: expenseDate.toISOString(),
      category: '...',
      emoji: '⏳',
      isCategorizing: true,
      projectId,
    };

    setExpenses(prev => [tempExpense, ...prev]);
    if (!projectId) setIsProcessing(true);

    try {
      const { category, emoji } = await categorizeExpense(description, amount, categories);
      setExpenses(prev => prev.map(exp => 
        exp.id === newId ? { ...exp, category, emoji, isCategorizing: false } : exp
      ));
    } catch (error) {
      setExpenses(prev => prev.map(exp => 
        exp.id === newId ? { ...exp, category: 'Другое', emoji: '📝', isCategorizing: false } : exp
      ));
    } finally {
      if (!projectId) setIsProcessing(false);
    }
  };

  const deleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  const addCategory = (name: string, emoji: string) => {
    setCategories(prev => [...prev, { id: crypto.randomUUID(), name, emoji }]);
  };

  const removeCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  const addProject = (name: string, budget: number) => {
    setProjects(prev => [...prev, {
      id: crypto.randomUUID(),
      name,
      budget,
      color: COLORS[prev.length % COLORS.length],
      createdAt: new Date().toISOString()
    }]);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setExpenses(prev => prev.filter(e => e.projectId !== id));
  };

  const addBucket = (label: string, percentage: number) => {
    setBuckets(prev => [...prev, { id: crypto.randomUUID(), label, percentage }]);
  };

  const removeBucket = (id: string) => setBuckets(prev => prev.filter(b => b.id !== id));

  const updateBucket = (id: string, updates: Partial<AllocationBucket>) => {
    setBuckets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const value = {
    expenses, categories, projects, buckets, weeklyLimit, salaryDay, advanceDay, isProcessing,
    addExpense, deleteExpense, addCategory, removeCategory, addProject, deleteProject,
    addBucket, removeBucket, updateBucket, setWeeklyLimit, setSalaryDay, setAdvanceDay
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};
