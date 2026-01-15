import React from 'react';
import { Currency } from '../types';
import { ChevronLeft, ChevronRight, LayoutGrid, Settings, RotateCcw, PlusSquare } from 'lucide-react';

interface HeaderProps {
  total: number;
  currency: Currency;
  viewDate: Date;
  onViewDateChange: (date: Date) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onResetLayout: () => void;
  onAddWorkspace: () => void;
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const Header: React.FC<HeaderProps> = ({ 
  total, currency, viewDate, onViewDateChange, isEditMode, onToggleEditMode, onResetLayout, onAddWorkspace
}) => {
  const handlePrevMonth = () => onViewDateChange(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => onViewDateChange(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  return (
    <header className="md:col-span-12 h-16 border-b border-zinc-800 flex items-center px-6 justify-between bg-zinc-950 z-50">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-sm shadow-lg transition-all ${isEditMode ? 'bg-blue-600 animate-pulse' : 'bg-zinc-800'}`}>
          <LayoutGrid className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:flex flex-col">
          <h1 className="text-sm font-black uppercase tracking-tighter text-zinc-100 leading-none">SmartSpend Terminal</h1>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">System_Status: {isEditMode ? 'LAYOUT_MODIFICATION' : 'STABLE'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-sm">
          <button onClick={handlePrevMonth} className="p-1 hover:text-white text-zinc-400 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-xs font-bold font-mono min-w-[120px] text-center uppercase text-zinc-100 tracking-tight">
            {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
          </div>
          <button onClick={handleNextMonth} className="p-1 hover:text-white text-zinc-400 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-zinc-800 mx-2" />

        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <button 
                onClick={onAddWorkspace}
                className="p-2 border border-blue-500/50 text-blue-400 hover:text-white hover:bg-blue-600 rounded-sm transition-all flex items-center gap-2"
                title="Add Workspace"
              >
                <PlusSquare className="w-4 h-4" />
                <span className="text-[10px] font-mono font-black uppercase hidden lg:inline">Add_Workspace</span>
              </button>
              <button 
                onClick={onResetLayout}
                className="p-2 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-sm transition-all flex items-center gap-2"
                title="Reset Layout"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-[10px] font-mono font-black uppercase hidden lg:inline">Reset</span>
              </button>
            </>
          )}
          <button 
            onClick={onToggleEditMode}
            className={`p-2 border transition-all rounded-sm flex items-center gap-2 ${isEditMode ? 'bg-blue-600 border-blue-400 text-white' : 'border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
          >
            <Settings className={`w-4 h-4 ${isEditMode ? 'animate-spin-slow' : ''}`} />
            <span className="text-[10px] font-mono font-black uppercase hidden lg:inline">
              {isEditMode ? 'Save_Config' : 'Edit_Layout'}
            </span>
          </button>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-end">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Registry_Sum</span>
        <div className="text-lg font-black text-emerald-400 font-mono leading-none tracking-tighter">
          {total.toLocaleString('ru-RU')} {currency}
        </div>
      </div>
    </header>
  );
};

export default Header;