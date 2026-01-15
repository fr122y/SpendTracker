
import React, { useState } from 'react';
import { Currency } from '../types';
import { Edit2, Check, X, Target } from 'lucide-react';
import TerminalPanel from './TerminalPanel';

interface WeeklyBudgetProps {
  spent: number;
  limit: number;
  startDate: Date;
  endDate: Date;
  onUpdateLimit: (limit: number) => void;
  currency: Currency;
  isEditMode?: boolean;
  widgetId?: string;
  onDragStart?: (e: React.DragEvent) => void;
  onResize?: (increment: number) => void;
  maxHeight?: string;
}

const WeeklyBudget: React.FC<WeeklyBudgetProps> = ({ 
  spent, limit, startDate, endDate, onUpdateLimit, currency,
  isEditMode, widgetId, onDragStart, onResize, maxHeight = "300px"
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newLimit, setNewLimit] = useState(limit.toString());

  const percent = limit > 0 ? (spent / limit) * 100 : 0;

  const headerExtra = (
    <>
      {isEditing ? (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <input 
            value={newLimit} 
            onChange={e => setNewLimit(e.target.value)} 
            className="w-16 bg-zinc-950 border border-zinc-700 text-[10px] font-mono p-1 outline-none text-zinc-100" 
            autoFocus 
          />
          <button onClick={() => { onUpdateLimit(parseFloat(newLimit)); setIsEditing(false); }} className="text-emerald-400 p-1"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => setIsEditing(false)} className="text-red-400 p-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
          className="p-1 hover:bg-zinc-800 rounded-sm transition-colors text-zinc-500 hover:text-white"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}
    </>
  );

  return (
    <TerminalPanel title="Weekly_Quota" icon={<Target className="w-4 h-4" />} headerExtra={headerExtra} maxHeight={maxHeight} isEditMode={isEditMode} widgetId={widgetId} onDragStart={onDragStart} onResize={onResize}>
      <div className="mt-2">
        <div className="flex justify-between items-end mb-3 font-mono">
          <span className="text-xl font-black text-white leading-none tracking-tighter">
            {spent.toLocaleString()} {currency}
          </span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-tighter font-black bg-zinc-900 px-2 py-0.5 border border-zinc-800">
            {limit}
          </span>
        </div>
        
        <div className="h-3 w-full bg-zinc-950 border border-zinc-800 overflow-hidden mb-3 rounded-sm p-0.5">
          <div 
            className={`h-full transition-all duration-700 rounded-sm ${percent > 100 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]'}`} 
            style={{ width: `${Math.min(100, percent)}%` }} 
          />
        </div>
        
        <div className="flex justify-between text-[9px] font-mono text-zinc-500 uppercase font-black tracking-tight">
          <span>{startDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</span>
          <div className="h-px bg-zinc-800 flex-1 mx-3 self-center" />
          <span>{endDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</span>
        </div>
      </div>
    </TerminalPanel>
  );
};

export default WeeklyBudget;
