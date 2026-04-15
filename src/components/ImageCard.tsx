import { useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCardProps {
  title: string;
  subtitle?: string;
  src: string;
  isBase64?: boolean;
  accent?: 'blue' | 'red' | 'amber' | 'green' | 'slate';
}

const accentMap = {
  blue: 'border-blue-500/30 bg-blue-500/5',
  red: 'border-red-500/30 bg-red-500/5',
  amber: 'border-amber-500/30 bg-amber-500/5',
  green: 'border-green-500/30 bg-green-500/5',
  slate: 'border-slate-600/50 bg-slate-800/50',
};

export function ImageCard({ title, subtitle, src, isBase64 = true, accent = 'slate' }: ImageCardProps) {
  const [zoomed, setZoomed] = useState(false);
  const imgSrc = isBase64 ? `data:image/png;base64,${src}` : src;

  return (
    <>
      <div className={`rounded-xl border overflow-hidden ${accentMap[accent]}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <div>
            <p className="text-slate-200 text-sm font-medium">{title}</p>
            {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={() => setZoomed(true)}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-slate-900/50 p-2">
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-48 object-contain rounded cursor-zoom-in"
            onClick={() => setZoomed(true)}
          />
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomed(false)}
              className="absolute -top-10 right-0 flex items-center gap-2 text-slate-300 hover:text-white text-sm"
            >
              <ZoomOut className="w-4 h-4" /> Close
            </button>
            <img src={imgSrc} alt={title} className="max-w-full max-h-screen object-contain rounded-xl" />
            <p className="text-center text-slate-400 text-sm mt-3">{title}</p>
          </div>
        </div>
      )}
    </>
  );
}
