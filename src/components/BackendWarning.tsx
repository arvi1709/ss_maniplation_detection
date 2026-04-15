import { AlertTriangle, Terminal, X } from 'lucide-react';
import { useState } from 'react';

export function BackendWarning() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-amber-300 font-medium text-sm">Python Backend Required</p>
        <p className="text-amber-400/80 text-xs mt-1">
          This tool requires the Python Flask backend running at{' '}
          <code className="bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">localhost:5000</code>.
          Start it with:
        </p>
        <div className="mt-2 flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-700/50">
          <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <code className="text-slate-300 text-xs font-mono">
            cd backend && pip install -r requirements.txt && python app.py
          </code>
        </div>
      </div>
      <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-300 transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
