import { Download, FileText } from 'lucide-react';

interface ReportButtonProps {
  report: string;
  filename?: string;
}

export function ReportButton({ report, filename = 'forensic_report.txt' }: ReportButtonProps) {
  const handleDownload = () => {
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shrink-0">
          <FileText className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-slate-200 font-medium mb-1">Forensic Report</h3>
          <p className="text-slate-400 text-sm mb-4">
            Download a detailed forensic analysis report including all findings, confidence scores, detected anomalies, and legal relevance under IT Act 2000 and Indian Evidence Act.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-600/20"
            >
              <Download className="w-4 h-4" />
              Download Report (.txt)
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-2">Legal Reference</p>
        <div className="flex flex-wrap gap-2">
          {['IT Act 2000 - Sec 66C', 'IT Act 2000 - Sec 66D', 'Indian Evidence Act - Sec 65B', 'IPC Sec 463 (Forgery)'].map((ref) => (
            <span key={ref} className="px-2.5 py-1 bg-slate-700/50 border border-slate-600/50 rounded-full text-slate-400 text-xs">
              {ref}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
