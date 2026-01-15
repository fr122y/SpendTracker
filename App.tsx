
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header';
import { FinanceProvider, useFinance } from './store/FinanceContext';
import { WidgetRenderer } from './components/WidgetRegistry';
import { LayoutConfig, WidgetId, Currency } from './types';
import { storage } from './services/storageService';
import { X } from 'lucide-react';

const getInitialLayout = (): LayoutConfig => ({
  columns: [
    { id: 'col-1', width: 25, widgets: ['CALENDAR', 'PROJECTS'] },
    { id: 'col-2', width: 50, widgets: ['ANALYSIS', 'DYNAMICS', 'EXPENSE_LOG'] },
    { id: 'col-3', width: 25, widgets: ['WEEKLY_BUDGET', 'SAVINGS', 'CATEGORIES', 'SETTINGS'] }
  ]
});

const Dashboard: React.FC = () => {
  const finance = useFinance();
  const [layout, setLayout] = useState<LayoutConfig>(() => storage.get('app_layout_v2', getInitialLayout()));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);
  
  const resizingRef = useRef<{ index: number; startX: number; startWidthLeft: number; startWidthRight: number } | null>(null);

  useEffect(() => { storage.set('app_layout_v2', layout); }, [layout]);

  const monthlyTotal = useMemo(() => {
    return finance.expenses
      .filter(exp => !exp.projectId)
      .filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [finance.expenses, viewDate]);

  // Layout Management
  const handleAddWorkspace = () => {
    const currentCount = layout.columns.length;
    const newWidth = Math.floor(100 / (currentCount + 1));
    const updatedColumns = layout.columns.map(c => ({ ...c, width: newWidth }));
    updatedColumns.push({ id: `col-${crypto.randomUUID()}`, width: newWidth, widgets: [] });
    setLayout({ columns: updatedColumns });
  };

  const handleRemoveWorkspace = (colId: string) => {
    if (layout.columns.length <= 1) return;
    const colIndex = layout.columns.findIndex(c => c.id === colId);
    const widgetsToMove = layout.columns[colIndex].widgets;
    let updatedColumns = layout.columns.filter(c => c.id !== colId);
    updatedColumns = updatedColumns.map((col, idx) => idx === 0 ? { ...col, widgets: [...col.widgets, ...widgetsToMove] } : col);
    const newWidth = Math.floor(100 / updatedColumns.length);
    updatedColumns = updatedColumns.map(c => ({ ...c, width: newWidth }));
    setLayout({ columns: updatedColumns });
  };

  const handleDrop = (targetColId: string, targetIndex?: number) => {
    if (!draggedWidget) return;
    let widget: WidgetId | null = null;
    const updatedColumns = layout.columns.map(col => {
      const idx = col.widgets.indexOf(draggedWidget);
      if (idx !== -1) {
        widget = col.widgets[idx];
        return { ...col, widgets: col.widgets.filter(w => w !== draggedWidget) };
      }
      return col;
    });

    if (widget) {
      const finalColumns = updatedColumns.map(col => {
        if (col.id === targetColId) {
          const newWidgets = [...col.widgets];
          if (targetIndex !== undefined) newWidgets.splice(targetIndex, 0, widget!);
          else newWidgets.push(widget!);
          return { ...col, widgets: newWidgets };
        }
        return col;
      });
      setLayout({ columns: finalColumns });
    }
    setDraggedWidget(null);
  };

  const onResizeStart = (e: React.MouseEvent, index: number) => {
    resizingRef.current = {
      index, startX: e.clientX,
      startWidthLeft: layout.columns[index].width,
      startWidthRight: layout.columns[index + 1].width
    };
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
  };

  const onResizeMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { index, startX, startWidthLeft, startWidthRight } = resizingRef.current;
    const containerWidth = document.getElementById('dashboard-container')?.clientWidth || 1;
    const deltaPercent = ((e.clientX - startX) / containerWidth) * 100;
    const minWidth = 10;
    if (startWidthLeft + deltaPercent > minWidth && startWidthRight - deltaPercent > minWidth) {
      const updatedColumns = layout.columns.map((col, i) => {
        if (i === index) return { ...col, width: startWidthLeft + deltaPercent };
        if (i === index + 1) return { ...col, width: startWidthRight - deltaPercent };
        return col;
      });
      setLayout({ columns: updatedColumns });
    }
  };

  const onResizeEnd = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
  };

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-200 overflow-hidden flex flex-col md:grid md:grid-cols-12 md:grid-rows-[64px_1fr]">
      <Header 
        total={monthlyTotal} 
        currency={Currency.RUB} 
        viewDate={viewDate}
        onViewDateChange={setViewDate}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onResetLayout={() => setLayout(getInitialLayout())}
        onAddWorkspace={handleAddWorkspace}
      />

      <div id="dashboard-container" className="md:col-span-12 flex h-full overflow-hidden bg-zinc-950 relative">
        {layout.columns.map((col, index) => (
          <React.Fragment key={col.id}>
            <div 
              style={{ width: `${col.width}%` }}
              className={`flex flex-col h-full overflow-y-auto scrollbar-hide px-3 py-6 space-y-6 border-r border-zinc-900 transition-all duration-300
                ${isEditMode ? 'bg-zinc-900/10 ring-1 ring-inset ring-blue-500/5' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="flex justify-between items-center px-1 mb-2">
                <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-widest">Workspace_{index + 1}</span>
                {isEditMode && layout.columns.length > 1 && (
                  <button onClick={() => handleRemoveWorkspace(col.id)} className="p-1 text-zinc-700 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                )}
              </div>
              
              {col.widgets.map((w, wIdx) => (
                <div 
                  key={w} 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.stopPropagation(); handleDrop(col.id, wIdx); }}
                  className={`${draggedWidget === w ? 'opacity-20 scale-95' : ''} transition-all`}
                >
                  <WidgetRenderer 
                    id={w}
                    isEditMode={isEditMode}
                    onDragStart={() => setDraggedWidget(w)}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    viewDate={viewDate}
                    setViewDate={setViewDate}
                  />
                </div>
              ))}
            </div>

            {index < layout.columns.length - 1 && (
              <div 
                className={`w-1 cursor-col-resize z-40 transition-all ${isEditMode ? 'bg-zinc-800 hover:bg-blue-500/50' : 'bg-transparent'}`}
                onMouseDown={(e) => isEditMode && onResizeStart(e, index)}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      {isEditMode && <div className="fixed inset-0 pointer-events-none border-4 border-blue-500/20 z-[60] animate-pulse" />}
    </div>
  );
};

const App: React.FC = () => (
  <FinanceProvider>
    <Dashboard />
  </FinanceProvider>
);

export default App;
