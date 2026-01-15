import React from 'react';
import TerminalPanel from './TerminalPanel';
import { Settings } from 'lucide-react';

interface FinancialSettingsProps {
  salaryDay: number;
  advanceDay: number;
  onUpdateSalaryDay: (day: number) => void;
  onUpdateAdvanceDay: (day: number) => void;
  isEditMode?: boolean;
  widgetId?: string;
  onDragStart?: (e: React.DragEvent) => void;
  onResize?: (increment: number) => void;
  maxHeight?: string;
}

const FinancialSettings: React.FC<FinancialSettingsProps> = ({ 
  salaryDay, advanceDay, onUpdateSalaryDay, onUpdateAdvanceDay,
  isEditMode, widgetId, onDragStart, onResize, maxHeight = "250px"
}) => {
  return (
    <TerminalPanel 
      title="System_Triggers" 
      icon={<Settings className="w-4 h-4" />}
      maxHeight={maxHeight}
      isEditMode={isEditMode}
      widgetId={widgetId}
      onDragStart={onDragStart}
      onResize={onResize}
    >
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-zinc-500 block font-mono tracking-widest">Salary_Ev</label>
          <select 
            value={salaryDay} 
            onChange={(e) => onUpdateSalaryDay(parseInt(e.target.value))} 
            className="w-full bg-zinc-950 border border-zinc-800 text-xs font-mono p-2 outline-none text-zinc-100 font-bold focus:border-blue-500"
          >
            {[...Array(31)].map((_, i) => <option key={i+1} value={i+1} className="bg-zinc-900">D_{i+1}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-zinc-500 block font-mono tracking-widest">Advance_Ev</label>
          <select 
            value={advanceDay} 
            onChange={(e) => onUpdateAdvanceDay(parseInt(e.target.value))} 
            className="w-full bg-zinc-950 border border-zinc-800 text-xs font-mono p-2 outline-none text-zinc-100 font-bold focus:border-blue-500"
          >
            {[...Array(31)].map((_, i) => <option key={i+1} value={i+1} className="bg-zinc-900">D_{i+1}</option>)}
          </select>
        </div>
      </div>
    </TerminalPanel>
  );
};

export default FinancialSettings;