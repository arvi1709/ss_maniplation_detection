import { FileText, DollarSign, Hash } from 'lucide-react';

interface OcrPanelProps {
  text: string;
  currencyAmounts: string[];
  numbersFound: string[];
}

export function OcrPanel({ text, currencyAmounts, numbersFound }: OcrPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold text-sm">Optical Character Recognition (OCR)</h3>
            <p className="text-slate-500 text-xs">Text extraction and numeric pattern parsing</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
          Tesseract Engine
        </span>
      </div>

      <div className="p-5 space-y-4">
        {currencyAmounts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <span className="text-slate-700 text-xs font-semibold uppercase tracking-wider">
                Financial Currency Amounts Detected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currencyAmounts.map((amt, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-semibold font-mono"
                >
                  {amt}
                </span>
              ))}
            </div>
          </div>
        )}

        {numbersFound.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-blue-600" />
              <span className="text-slate-700 text-xs font-semibold uppercase tracking-wider">
                Numeric Patterns Extracted
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {numbersFound.slice(0, 20).map((num, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs font-mono"
                >
                  {num}
                </span>
              ))}
              {numbersFound.length > 20 && (
                <span className="text-slate-400 text-xs px-2 py-0.5 self-center">
                  +{numbersFound.length - 20} more
                </span>
              )}
            </div>
          </div>
        )}

        <div>
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
            Raw Extracted Text
          </p>
          <pre className="text-slate-800 text-xs font-mono whitespace-pre-wrap bg-slate-50 rounded-xl p-4 max-h-48 overflow-y-auto border border-slate-200 leading-relaxed">
            {text.trim() || 'No text recognized or OCR is optional/skipped on this host.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
