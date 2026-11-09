import { AlertTriangle, Terminal, X } from 'lucide-react';
import { useState } from 'react';
import { API_BASE } from '../services/api';

export function BackendWarning() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
      <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-amber-900 font-bold text-sm">Flask Backend Connection Notice</p>
        <p className="text-amber-800/90 text-xs mt-1 leading-relaxed">
          The processing pipeline connects to the Python Flask backend at{' '}
          <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">
            {API_BASE}
          </code>
          . If you are developing locally, start the local server with:
        </p>
        <div className="mt-2.5 flex items-center gap-2 bg-slate-900 rounded-xl px-3.5 py-2 border border-slate-800 shadow-inner">
          <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <code className="text-slate-200 text-xs font-mono select-all">
            cd backend &amp;&amp; pip install -r requirements.txt &amp;&amp; python app.py
          </code>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-amber-600 hover:text-amber-900 p-1 rounded-lg hover:bg-amber-100/50 transition-colors shrink-0"
        title="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
