import { Image as ImageIcon, GitCompare } from 'lucide-react';
import { AnalysisMode } from '../types';

interface ModeToggleProps {
  mode: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700/50">
      <button
        onClick={() => onChange('single')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          mode === 'single'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ImageIcon className="w-4 h-4" />
        Single Image
      </button>
      <button
        onClick={() => onChange('compare')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          mode === 'compare'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <GitCompare className="w-4 h-4" />
        Comparison Mode
      </button>
    </div>
  );
}
