import { FileText, DollarSign, Hash } from 'lucide-react';

interface OcrPanelProps {
  text: string;
  currencyAmounts: string[];
  numbersFound: string[];
}

export function OcrPanel({ text, currencyAmounts, numbersFound }: OcrPanelProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/50">
        <FileText className="w-5 h-5 text-blue-400" />
        <h3 className="text-slate-200 font-medium">OCR Text Extraction</h3>
        <span className="ml-auto text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
          Tesseract OCR
        </span>
      </div>

      <div className="p-5 space-y-4">
        {currencyAmounts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-medium uppercase tracking-wide">
                Currency Amounts Detected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currencyAmounts.map((amt, i) => (
                <span key={i} className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-full text-sm font-mono">
                  {amt}
                </span>
              ))}
            </div>
          </div>
        )}

        {numbersFound.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-xs font-medium uppercase tracking-wide">
                Numeric Values Found
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {numbersFound.slice(0, 20).map((num, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs font-mono">
                  {num}
                </span>
              ))}
              {numbersFound.length > 20 && (
                <span className="text-slate-500 text-xs px-2 py-0.5">
                  +{numbersFound.length - 20} more
                </span>
              )}
            </div>
          </div>
        )}

        <div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-2">
            Extracted Text
          </p>
          <pre className="text-slate-300 text-xs font-mono whitespace-pre-wrap bg-slate-900/50 rounded-lg p-4 max-h-48 overflow-y-auto border border-slate-700/50">
            {text.trim() || 'No text could be extracted from this image.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
