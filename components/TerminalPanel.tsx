import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Move } from 'lucide-react';

interface TerminalPanelProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
  initialCollapsed?: boolean;
  maxHeight?: string;
  className?: string;
  isEditMode?: boolean;
  widgetId?: string;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onResize?: (increment: number) => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ 
  title, 
  icon, 
  children, 
  headerExtra, 
  initialCollapsed = false,
  maxHeight = "500px",
  className = "",
  isEditMode = false,
  widgetId,
  onDragStart,
  onDragEnd,
  onResize
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  return (
    <div 
      draggable={isEditMode}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`border border-zinc-700 bg-zinc-900/20 shadow-lg transition-all overflow-hidden flex flex-col relative group 
        ${isEditMode ? 'ring-1 ring-blue-500/30' : ''} 
        ${className}`}
    >
      {/* Panel Header */}
      <div 
        className={`flex justify-between items-center p-4 select-none shrink-0 z-10 ${!isEditMode ? 'cursor-pointer hover:bg-zinc-800/20' : 'bg-zinc-950 border-b border-zinc-800'}`} 
        onClick={() => !isEditMode && setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          {isEditMode && (
            <div 
              className="p-1.5 bg-blue-600/20 border border-blue-500/40 text-blue-400 cursor-move hover:bg-blue-600 hover:text-white transition-colors"
              title="Drag to move"
            >
              <Move className="w-3.5 h-3.5" />
            </div>
          )}
          {icon && <div className={`${isEditMode ? 'text-blue-400' : 'text-zinc-400'} transition-colors`}>{icon}</div>}
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-100 font-mono">{title}</h4>
        </div>
        
        <div className="flex items-center gap-3">
          {headerExtra && <div onClick={(e) => e.stopPropagation()}>{headerExtra}</div>}
          {isEditMode ? (
            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
              <button onClick={() => onResize?.(50)} className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-white"><Maximize2 className="w-3 h-3" /></button>
              <button onClick={() => onResize?.(-50)} className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-white"><Minimize2 className="w-3 h-3" /></button>
            </div>
          ) : (
            <div className="text-zinc-500">
              {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </div>
          )}
        </div>
      </div>

      {/* Panel Body */}
      {(!isCollapsed || isEditMode) && (
        <div 
          className={`p-4 pt-2 animate-in fade-in duration-200 overflow-y-auto scrollbar-hide ${isEditMode ? 'opacity-40 grayscale-[0.5]' : ''}`}
          style={{ maxHeight }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default TerminalPanel;