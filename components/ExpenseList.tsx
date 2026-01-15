import React from 'react';
import { Expense, Currency } from '../types';
import { Trash2 } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  currency: Currency;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, currency }) => {
  if (expenses.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 opacity-30">
        <span className="text-sm font-mono font-black uppercase tracking-[0.3em] italic text-zinc-500">_registry_null</span>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800 border-t border-zinc-800">
      {expenses.map((expense) => (
        <div key={expense.id} className="group py-5 flex items-center gap-6 hover:bg-zinc-800/40 px-4 -mx-4 transition-colors">
          <div className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-zinc-700 text-2xl shrink-0 rounded-sm">
            {expense.emoji}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-6 mb-1">
              <h4 className="text-sm font-black text-zinc-100 uppercase truncate tracking-tight leading-none">{expense.description}</h4>
              <span className="text-base font-black text-zinc-50 font-mono tracking-tighter">
                {expense.amount.toLocaleString('ru-RU')} {currency}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 uppercase tracking-tight">
              <span className="text-blue-400 font-black bg-blue-400/10 px-1.5 py-0.5 border border-blue-400/20">{expense.category}</span>
              <span className="text-zinc-700">•</span>
              <span className="font-bold">{new Date(expense.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <button
            onClick={() => onDelete(expense.id)}
            className="p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;