import { Shield } from 'lucide-react';

interface LoadingOverlayProps {
  mode: string;
}

const steps = [
  'Preprocessing image data...',
  'Running Error Level Analysis...',
  'Performing pixel difference detection...',
  'Analyzing noise inconsistencies...',
  'Running edge detection (Canny)...',
  'Extracting text via OCR...',
  'Calculating confidence score...',
  'Generating forensic report...',
];

export function LoadingOverlay({ mode }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="relative mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
          <Shield className="w-7 h-7 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">
          {mode === 'compare' ? 'Comparing Images' : 'Analyzing Image'}
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          Running forensic analysis pipeline...
        </p>
        <div className="space-y-2 text-left">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
              <span className="text-slate-400 text-xs">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
