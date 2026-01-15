
import React from 'react';
import { Currency } from '../types';

interface CategoryStat {
  name: string;
  value: number;
  emoji: string;
}

interface AnalysisDashboardProps {
  stats: CategoryStat[];
  currency: Currency;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ stats, currency }) => {
  const total = stats.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 font-mono flex items-center gap-2">
        <span className="w-3 h-3 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> CATEGORY_SCHEMA
      </h3>
      
      {stats.length > 0 ? (
        <div className="flex-1 flex flex-wrap gap-3 items-center justify-center p-4 bg-zinc-950/80 border border-zinc-800 overflow-y-auto scrollbar-hide">
          {stats.map((item) => {
            const size = Math.max(60, Math.min(130, (item.value / stats[0].value) * 130));
            return (
              <div 
                key={item.name} 
                className="group relative flex flex-col items-center justify-center border border-zinc-800 transition-all hover:border-blue-500 cursor-default bg-zinc-900 shadow-lg"
                style={{ width: `${size}px`, height: `${size}px` }}
              >
                <span className="text-xl mb-1">{item.emoji}</span>
                <span className="text-[10px] font-mono text-zinc-100 group-hover:text-blue-400 font-black">
                  {((item.value / total) * 100).toFixed(0)}%
                </span>
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-zinc-900 border border-zinc-700 px-3 py-1.5 z-50 whitespace-nowrap text-[10px] font-mono mb-2 pointer-events-none text-zinc-50 shadow-2xl">
                  {item.name.toUpperCase()}: <span className="text-emerald-400 font-black">{item.value.toLocaleString()} {currency}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-800 text-zinc-600 text-xs uppercase font-mono tracking-widest">
          _data_void_
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;
