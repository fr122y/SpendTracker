import React, { useState } from 'react';
import { Currency, AllocationBucket } from '../types';
import { Plus, Trash2, PieChart, Percent, Cpu, Activity } from 'lucide-react';
import TerminalPanel from './TerminalPanel';

interface SavingsCalculatorProps {
  currency: Currency;
  buckets: AllocationBucket[];
  onAddBucket: (label: string, percentage: number) => void;
  onRemoveBucket: (id: string) => void;
  onUpdateBucket: (id: string, updates: Partial<AllocationBucket>) => void;
  isEditMode?: boolean;
  widgetId?: string;
  onDragStart?: (e: React.DragEvent) => void;
  onResize?: (increment: number) => void;
  maxHeight?: string;
}

const SavingsCalculator: React.FC<SavingsCalculatorProps> = ({ 
  currency, buckets, onAddBucket, onRemoveBucket, onUpdateBucket,
  isEditMode, widgetId, onDragStart, onResize, maxHeight = "550px"
}) => {
  const [income, setIncome] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newPercent, setNewPercent] = useState('');

  const userBuckets = buckets.filter(b => b.label !== 'OPERATIONS');
  const userBucketsSum = userBuckets.reduce((sum, b) => sum + b.percentage, 0);
  
  const operationsPercentage = Math.max(0, 100 - userBucketsSum);
  const incomeValue = parseFloat(income) || 0;
  const operationsAmount = (incomeValue * operationsPercentage) / 100;

  const handleAdd = () => {
    if (!newLabel || !newPercent) return;
    const label = newLabel.toUpperCase();
    if (label === 'OPERATIONS') {
      alert("Identifier 'OPERATIONS' is reserved for system use.");
      return;
    }
    onAddBucket(label, parseFloat(newPercent));
    setNewLabel('');
    setNewPercent('');
    setIsAdding(false);
  };

  const headerExtra = (
    <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 border ${userBucketsSum <= 100 ? 'border-emerald-500/50 text-emerald-500' : 'border-red-500/50 text-red-500'}`}>
      {userBucketsSum}%
    </span>
  );

  return (
    <TerminalPanel 
      title="Allocation_Processor" 
      icon={<PieChart className="w-4 h-4 text-blue-400" />}
      headerExtra={headerExtra}
      maxHeight={maxHeight}
      isEditMode={isEditMode}
      widgetId={widgetId}
      onDragStart={onDragStart}
      onResize={onResize}
    >
      <div className="relative mb-4 mt-2">
        <input 
          type="number" 
          value={income} 
          onChange={e => setIncome(e.target.value)} 
          placeholder="ENTER_INCOME" 
          className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 text-lg font-mono outline-none focus:border-blue-500 text-emerald-400 placeholder-zinc-800 font-black" 
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-zinc-600 font-bold">{currency}</span>
      </div>

      <div className="space-y-2 mb-4">
        {userBuckets.map((bucket) => {
          const val = incomeValue ? (incomeValue * bucket.percentage) / 100 : 0;
          return (
            <div key={bucket.id} className="group bg-zinc-950/40 border border-zinc-800 p-3 hover:border-zinc-700 transition-all rounded-sm">
              <div className="flex justify-between items-start mb-2">
                <input 
                  className="bg-transparent text-[11px] font-mono font-black text-zinc-300 uppercase outline-none focus:text-white flex-1 mr-2"
                  value={bucket.label}
                  onChange={(e) => onUpdateBucket(bucket.id, { label: e.target.value.toUpperCase() })}
                />
                <button 
                  onClick={() => onRemoveBucket(bucket.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-2">
                  <Percent className="w-3.5 h-3.5 text-zinc-600" />
                  <input 
                    type="number"
                    className="w-12 bg-zinc-900 border border-zinc-700 px-1 py-1 text-[10px] font-mono font-black text-blue-400 outline-none focus:border-blue-500"
                    value={bucket.percentage}
                    onChange={(e) => onUpdateBucket(bucket.id, { percentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <span className="text-sm font-mono font-black text-white">
                  {val.toLocaleString()} <span className="text-[9px] font-normal text-zinc-600">{currency}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-4">
        {isAdding ? (
          <div className="bg-zinc-950 border border-zinc-700 p-4 space-y-3 rounded-sm shadow-xl">
            <input 
              placeholder="LABEL"
              className="w-full bg-zinc-900 border border-zinc-800 p-2 text-[10px] font-mono font-black text-white outline-none focus:border-blue-500 uppercase"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <input 
                type="number"
                placeholder="%"
                className="flex-1 bg-zinc-900 border border-zinc-800 p-2 text-[10px] font-mono font-black text-blue-400 outline-none focus:border-blue-500"
                value={newPercent}
                onChange={e => setNewPercent(e.target.value)}
              />
              <button 
                onClick={handleAdd}
                className="px-3 bg-emerald-600 text-zinc-950 text-[10px] font-black uppercase hover:bg-emerald-500"
              >
                Apply
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full border border-dashed border-zinc-800 py-3 flex items-center justify-center gap-2 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700 transition-all group rounded-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase font-mono tracking-widest">New_Allocation</span>
          </button>
        )}
      </div>

      <div className="mt-4 border-t border-zinc-800 pt-4">
        <div className="bg-blue-600/5 border border-blue-500/10 p-4 rounded-sm relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <h5 className="text-[10px] font-black text-blue-400 font-mono tracking-tight uppercase">OPERATIONS</h5>
              <div className="flex items-center gap-1 text-[8px] font-mono font-black text-blue-500/50 uppercase">
                Calculated_Matrix
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-white font-mono leading-none tracking-tighter mb-1">
                {operationsAmount.toLocaleString()} <span className="text-[10px] text-zinc-600">{currency}</span>
              </div>
              <div className="text-[9px] font-mono font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 border border-blue-500/20 inline-block">
                {operationsPercentage}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </TerminalPanel>
  );
};

export default SavingsCalculator;