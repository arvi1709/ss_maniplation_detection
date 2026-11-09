import { Download, FileSpreadsheet } from 'lucide-react';

interface ReportButtonProps {
  report: string;
  filename?: string;
}

export function ReportButton({ report, filename = 'ivp_analysis_report.txt' }: ReportButtonProps) {
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold text-sm">Laboratory Processing Report</h3>
            <p className="text-slate-500 text-xs mt-0.5 max-w-2xl leading-relaxed">
              Export a complete text documentation of all computed metrics, including structural similarity (SSIM), ELA intensity, noise variance, OCR extractions, and diagnostic findings.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download Report (.txt)
        </button>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-700">Lab Framework References:</span>
        <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-slate-600">
          Image &amp; Video Processing (IVP)
        </span>
        <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-slate-600">
          Classical CV Algorithms
        </span>
        <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-slate-600">
          Indian Evidence Act Sec 65B
        </span>
        <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-slate-600">
          IT Act 2000
        </span>
      </div>
    </div>
  );
}
