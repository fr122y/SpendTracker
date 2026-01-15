
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Currency } from '../types';

interface ChartPoint {
  day: number;
  amount: number;
  fullDate: Date;
}

interface DailySpendingChartProps {
  data: ChartPoint[];
  weekStartDays: number[];
  currency: Currency;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const DailySpendingChart: React.FC<DailySpendingChartProps> = ({ 
  data, weekStartDays, currency, selectedDate, onSelectDate 
}) => {
  return (
    <div className="h-full w-full flex flex-col p-2">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 font-mono flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-500" /> MONTH_DYNAMICS
      </h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} onClick={(s) => s?.activePayload && onSelectDate(s.activePayload[0].payload.fullDate)}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#71717a', fontWeight: 600, fontFamily: 'JetBrains Mono' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#71717a', fontWeight: 600, fontFamily: 'JetBrains Mono' }} />
            <Tooltip 
              cursor={{ fill: '#18181b' }}
              content={({ active, payload }) => active && payload?.[0] ? (
                <div className="bg-zinc-900 border border-zinc-800 p-2 text-[10px] font-mono text-zinc-400">
                  <p className="font-bold text-zinc-100">{payload[0].payload.amount.toLocaleString()} {currency}</p>
                </div>
              ) : null}
            />
            {weekStartDays.map(day => (
              <ReferenceLine key={day} x={day} stroke="#27272a" strokeWidth={1} />
            ))}
            <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => {
                const isSelected = entry.fullDate.toDateString() === selectedDate.toDateString();
                const isToday = entry.fullDate.toDateString() === new Date().toDateString();
                let fill = entry.amount > 0 ? '#52525b' : '#18181b';
                if (isSelected) fill = '#3b82f6';
                else if (isToday) fill = '#10b981';
                return <Cell key={index} fill={fill} className="cursor-pointer" />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailySpendingChart;
