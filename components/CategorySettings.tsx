import React, { useState } from 'react';
import { Category } from '../types';
import { Trash2, Settings2, Plus } from 'lucide-react';
import TerminalPanel from './TerminalPanel';

interface CategorySettingsProps {
  categories: Category[];
  onAddCategory: (name: string, emoji: string) => void;
  onRemoveCategory: (id: string) => void;
  isEditMode?: boolean;
  widgetId?: string;
  onDragStart?: (e: React.DragEvent) => void;
  onResize?: (increment: number) => void;
  maxHeight?: string;
}

const CategorySettings: React.FC<CategorySettingsProps> = ({ 
  categories, onAddCategory, onRemoveCategory,
  isEditMode, widgetId, onDragStart, onResize, maxHeight = "400px"
}) => {
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📁');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCategory(newName.trim(), newEmoji || '📁');
    setNewName('');
    setNewEmoji('📁');
    setIsAdding(false);
  };

  return (
    <TerminalPanel 
      title="Schema_Categories" 
      icon={<Settings2 className="w-4 h-4 text-zinc-400" />}
      maxHeight={maxHeight}
      isEditMode={isEditMode}
      widgetId={widgetId}
      onDragStart={onDragStart}
      onResize={onResize}
      headerExtra={
        <button 
          onClick={(e) => { e.stopPropagation(); setIsAdding(!isAdding); }}
          className={`p-1 transition-colors rounded-sm ${isAdding ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-500 hover:text-white'}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      }
    >
      <div className="space-y-4 pt-2">
        {isAdding && (
          <form onSubmit={handleSubmit} className="animate-in slide-in-from-top-2 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-sm mb-4">
              <input 
                type="text"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                className="w-10 bg-zinc-900 border border-zinc-800 text-center py-1 text-sm outline-none"
                maxLength={2}
              />
              <input 
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="NAME"
                className="flex-1 bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px] font-mono font-black text-white uppercase outline-none focus:border-blue-500"
                autoFocus
              />
              <button 
                type="submit"
                className="px-2 bg-blue-600 text-zinc-950 hover:bg-blue-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 gap-2">
          {categories.map(c => (
            <div key={c.id} className="flex items-center justify-between p-2 bg-zinc-950/50 border border-zinc-800 group hover:border-zinc-700 transition-all rounded-sm">
              <div className="flex items-center gap-3">
                <span className="text-lg w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-sm">
                  {c.emoji}
                </span>
                <span className="text-[10px] font-black uppercase text-zinc-200 font-mono tracking-tighter">{c.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemoveCategory(c.id); }} 
                className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </TerminalPanel>
  );
};

export default CategorySettings;