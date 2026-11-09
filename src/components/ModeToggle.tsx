import { Layers, SplitSquareVertical, Film, Check } from 'lucide-react';
import { AnalysisMode } from '../types';

interface ModeToggleProps {
  mode: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const modes = [
    {
      id: 'single' as AnalysisMode,
      title: 'Image Analysis',
      subtitle: 'Single image processing',
      description: 'ELA, edge detection, noise analysis, and visual observations',
      icon: <Layers className="w-5 h-5" />,
      badge: 'Spatial Analysis',
    },
    {
      id: 'compare' as AnalysisMode,
      title: 'Image Comparison',
      subtitle: 'Dual image verification',
      description: 'SSIM, image alignment, difference maps, and highlighted changes',
      icon: <SplitSquareVertical className="w-5 h-5" />,
      badge: 'SSIM & Registration',
    },
    {
      id: 'video' as AnalysisMode,
      title: 'Video Processing',
      subtitle: 'Temporal sequence analysis',
      description: 'Frame extraction, temporal SSIM, and transition heatmaps',
      icon: <Film className="w-5 h-5" />,
      badge: 'Temporal Differencing',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
      {modes.map((m) => {
        const isSelected = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={`text-left p-4 rounded-xl border transition-all duration-200 relative flex flex-col justify-between ${
              isSelected
                ? 'bg-blue-50/70 border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {m.icon}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-blue-100/80 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {m.badge}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
              </div>
              <h3
                className={`font-semibold text-sm ${
                  isSelected ? 'text-blue-950' : 'text-slate-800'
                }`}
              >
                {m.title}
              </h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                {m.description}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className={isSelected ? 'text-blue-700 font-medium' : 'text-slate-400'}>
                {isSelected ? 'Active Mode' : 'Click to select'}
              </span>
              <span className={isSelected ? 'text-blue-600 font-semibold' : 'text-slate-400'}>
                →
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
