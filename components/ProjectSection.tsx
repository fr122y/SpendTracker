import React, { useState, useMemo } from 'react';
import { Project, Expense, Currency } from '../types';
import { Plus, X, Trash2, ArrowLeft, CornerDownLeft, ReceiptText, Briefcase } from 'lucide-react';
import TerminalPanel from './TerminalPanel';

interface ProjectSectionProps {
  projects: Project[];
  expenses: Expense[];
  onAddProject: (name: string, budget: number) => void;
  onDeleteProject: (id: string) => void;
  onAddProjectExpense: (projectId: string, description: string, amount: number) => void;
  onDeleteExpense: (id: string) => void;
  currency: Currency;
  isEditMode?: boolean;
  widgetId?: string;
  onDragStart?: (e: React.DragEvent) => void;
  onResize?: (increment: number) => void;
  maxHeight?: string;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({ 
  projects, expenses, onAddProject, onDeleteProject, onAddProjectExpense, onDeleteExpense, currency,
  isEditMode, widgetId, onDragStart, onResize, maxHeight = "600px"
}) => {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [entryDesc, setEntryDesc] = useState('');
  const [entryAmount, setEntryAmount] = useState('');

  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
    [projects, selectedProjectId]
  );

  const projectExpenses = useMemo(() => 
    expenses.filter(e => e.projectId === selectedProjectId),
    [expenses, selectedProjectId]
  );

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !newProjectBudget) return;
    onAddProject(newProjectName, parseFloat(newProjectBudget));
    setNewProjectName(''); 
    setNewProjectBudget(''); 
    setIsCreatingProject(false);
  };

  const handleAddExpenseToProject = () => {
    if (!selectedProjectId || !entryDesc || !entryAmount) return;
    onAddProjectExpense(selectedProjectId, entryDesc, parseFloat(entryAmount));
    setEntryDesc('');
    setEntryAmount('');
  };

  const content = selectedProject ? (
    <div className="flex flex-col gap-5 pt-2 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setSelectedProjectId(null)}
          className="p-1.5 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-all rounded-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 overflow-hidden">
          <h3 className="text-xs font-black text-white uppercase truncate tracking-tighter leading-none">{selectedProject.name}</h3>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-sm">
        <div className="flex justify-between items-end mb-2">
          <span className="text-base font-mono font-black text-emerald-400">
            {(projectExpenses.reduce((s, e) => s + e.amount, 0)).toLocaleString()} {currency}
          </span>
          <span className="text-[9px] font-mono font-black text-zinc-500 uppercase">Limit: {selectedProject.budget.toLocaleString()}</span>
        </div>
        <div className="h-2 w-full bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${Math.min(100, (projectExpenses.reduce((s, e) => s + e.amount, 0) / selectedProject.budget) * 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <input 
          className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-[10px] font-mono text-white placeholder-zinc-700 outline-none focus:border-blue-500 uppercase font-black"
          placeholder="DESCRIPTION..."
          value={entryDesc}
          onChange={(e) => setEntryDesc(e.target.value)}
        />
        <div className="flex gap-2">
          <input 
            type="number"
            className="flex-1 bg-zinc-900 border border-zinc-800 px-3 py-2 text-[10px] font-mono text-emerald-400 placeholder-zinc-700 outline-none focus:border-blue-500 font-black"
            placeholder="AMOUNT"
            value={entryAmount}
            onChange={(e) => setEntryAmount(e.target.value)}
          />
          <button 
            onClick={handleAddExpenseToProject} 
            className="bg-blue-600 px-4 text-zinc-950 hover:bg-blue-500 transition-colors"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1 mt-2">
        {projectExpenses.length === 0 ? (
          <div className="text-center py-6 opacity-20 text-[9px] font-mono uppercase tracking-[0.2em]">_log_empty</div>
        ) : (
          projectExpenses.map(exp => (
            <div key={exp.id} className="p-2 bg-zinc-950 border border-zinc-800 flex justify-between items-center group">
              <span className="text-[9px] font-black uppercase text-zinc-100 truncate flex-1 mr-2">{exp.description}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black text-zinc-400">{exp.amount.toLocaleString()}</span>
                <button onClick={() => onDeleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  ) : (
    <div className="space-y-3 pt-2">
      {projects.length === 0 ? (
        <div className="text-center py-10 opacity-20 text-[10px] font-mono uppercase tracking-[0.2em]">_null_active_ops</div>
      ) : (
        projects.map(p => {
          const spent = expenses.filter(e => e.projectId === p.id).reduce((s, e) => s + e.amount, 0);
          return (
            <div 
              key={p.id} 
              onClick={() => setSelectedProjectId(p.id)}
              className="p-3 border border-zinc-800 bg-zinc-950/90 hover:border-blue-600 transition-all cursor-pointer group rounded-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase text-white group-hover:text-blue-400 transition-colors">{p.name}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, (spent/p.budget)*100)}%` }} />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 uppercase font-black">
                <span className="text-emerald-500">{spent.toLocaleString()}</span>
                <span>/ {p.budget.toLocaleString()}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <>
      <TerminalPanel 
        title="Operations_Core" 
        icon={<Briefcase className="w-4 h-4" />}
        widgetId={widgetId}
        isEditMode={isEditMode}
        onDragStart={onDragStart}
        onResize={onResize}
        maxHeight={maxHeight}
        headerExtra={
          <button 
            onClick={(e) => { e.stopPropagation(); setIsCreatingProject(true); }} 
            className="p-1 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-all rounded-sm"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        }
      >
        {content}
      </TerminalPanel>

      {isCreatingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-700 w-full max-w-sm p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black uppercase tracking-widest font-mono text-white">New_Operation</h2>
              <button onClick={() => setIsCreatingProject(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6">
              <input 
                value={newProjectName} 
                onChange={e => setNewProjectName(e.target.value)} 
                placeholder="ID_NAME" 
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm font-mono outline-none focus:border-blue-500 uppercase text-white" 
              />
              <input 
                type="number" 
                value={newProjectBudget} 
                onChange={e => setNewProjectBudget(e.target.value)} 
                placeholder="BUDGET" 
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm font-mono outline-none focus:border-blue-500 text-emerald-400" 
              />
              <button 
                onClick={handleCreateProject}
                className="w-full bg-blue-600 text-white font-black py-4 uppercase text-xs hover:bg-blue-500 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectSection;