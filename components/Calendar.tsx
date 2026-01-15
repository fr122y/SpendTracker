
import React from 'react';
import { Currency } from '../types';

interface CalendarProps {
  viewDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  dailyTotals: Record<number, number>;
  currency: Currency;
  salaryDay?: number;
  advanceDay?: number;
}

const Calendar: React.FC<CalendarProps> = ({ 
  viewDate, selectedDate, onSelectDate, dailyTotals, salaryDay, advanceDay
}) => {
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-11 border border-zinc-900 bg-zinc-950/20" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      const isSelected = isSameDay(date, selectedDate);
      const isToday = isSameDay(date, new Date());
      const total = dailyTotals[day] || 0;
      const isSalary = day === salaryDay;
      const isAdvance = day === advanceDay;

      let cellStyle = "border border-zinc-800 transition-all flex flex-col items-center justify-center relative ";
      if (isSelected) cellStyle += "bg-blue-600 text-white z-10 shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-[1.05]";
      else if (isToday) cellStyle += "bg-zinc-800 text-blue-400 border-blue-900/50";
      else cellStyle += "bg-zinc-900/50 hover:bg-zinc-800 text-zinc-100";

      days.push(
        <button key={day} onClick={() => onSelectDate(date)} className={`h-11 ${cellStyle}`}>
          <span className="text-xs font-mono font-black">{day}</span>
          {total > 0 && !isSelected && (
            <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
          )}
          {(isSalary || isAdvance) && !isSelected && (
             <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isSalary ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          )}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="w-full border border-zinc-800 bg-zinc-900/30 p-3">
      <div className="grid grid-cols-7 gap-px mb-3">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => (
          <div key={d} className="text-center text-[9px] font-black text-zinc-500 uppercase font-mono tracking-tighter">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px border-l border-t border-zinc-900">
        {renderDays()}
      </div>
    </div>
  );
};

export default Calendar;
