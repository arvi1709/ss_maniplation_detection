import { Scan, Film } from 'lucide-react';

interface LoadingOverlayProps {
  mode: string;
}

const imageSteps = [
  'Preprocessing input pixel tensors...',
  'Computing Error Level Analysis (ELA) residuals...',
  'Evaluating spatial noise variance...',
  'Extracting edge gradients (Canny)...',
  'Executing OCR character recognition...',
  'Calculating consistency score & confidence...',
  'Formatting laboratory analysis summary...',
];

const videoSteps = [
  'Validating video container & reading stream...',
  'Sampling representative frames at 1.0s interval...',
  'Converting frames into normalized color buffers...',
  'Computing consecutive inter-frame SSIM...',
  'Generating JET difference heatmaps...',
  'Evaluating localized disparity metrics...',
  'Synthesizing temporal visual transition summary...',
];

export function LoadingOverlay({ mode }: LoadingOverlayProps) {
  const isVideo = mode === 'video';
  const steps = isVideo ? videoSteps : imageSteps;

  const title =
    mode === 'compare'
      ? 'Comparing Image Pair'
      : mode === 'video'
      ? 'Processing Video Sequence'
      : 'Executing Image Analysis Pipeline';

  const subtitle = isVideo
    ? 'Sampling temporal frames and calculating inter-frame difference metrics...'
    : 'Computing multi-modal image processing features...';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-7 max-w-sm w-full text-center shadow-xl">
        <div className="relative mb-5 flex justify-center">
          <div className="w-14 h-14 rounded-full border-3 border-blue-100 border-t-blue-600 animate-spin" />
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xs">
            {isVideo ? <Film className="w-5 h-5" /> : <Scan className="w-5 h-5" />}
          </div>
        </div>
        <h3 className="text-slate-900 font-bold text-base mb-1">{title}</h3>
        <p className="text-slate-500 text-xs mb-5 leading-relaxed">{subtitle}</p>
        <div className="space-y-2 text-left bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
              <span className="text-slate-600 text-[11px] font-medium">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
