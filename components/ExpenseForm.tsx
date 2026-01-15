import React, { useState } from 'react';
import { Terminal, Loader2, CornerDownLeft } from 'lucide-react';

interface ExpenseFormProps {
  onAdd: (description: string, amount: number) => Promise<void>;
  isProcessing: boolean;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd, isProcessing }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    await onAdd(description, numAmount);
    setDescription('');
    setAmount('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px] shrink-0">
        <Terminal className="w-3 h-3 text-emerald-500" />
        <span className="uppercase tracking-widest font-black">initiate_transaction:</span>
      </div>
      
      <div className="flex gap-2 items-center">
        <div className="flex-1 flex gap-px bg-zinc-800 border border-zinc-800 overflow-hidden shadow-sm">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="DESCRIPTION..."
            className="flex-1 bg-zinc-950 px-4 py-3 text-sm font-mono text-zinc-100 placeholder-zinc-700 outline-none focus:bg-zinc-900 transition-colors uppercase font-bold"
            disabled={isProcessing}
            autoFocus
          />
          <div className="w-px bg-zinc-800" />
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-28 bg-zinc-950 px-4 py-3 text-sm font-mono text-emerald-400 placeholder-zinc-700 outline-none focus:bg-zinc-900 transition-colors font-black"
            disabled={isProcessing}
          />
        </div>

        <button
          type="submit"
          disabled={!description || !amount || isProcessing}
          className="h-11 px-5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-black uppercase text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md shrink-0"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CornerDownLeft className="w-4 h-4" />}
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;