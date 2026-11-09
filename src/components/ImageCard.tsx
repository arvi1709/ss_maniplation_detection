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
  blue: 'border-blue-200 bg-white',
  red: 'border-rose-200 bg-white',
  amber: 'border-amber-200 bg-white',
  green: 'border-emerald-200 bg-white',
  slate: 'border-slate-200 bg-white',
};

export function ImageCard({ title, subtitle, src, isBase64 = true, accent = 'slate' }: ImageCardProps) {
  const [zoomed, setZoomed] = useState(false);
  const imgSrc = isBase64 ? `data:image/png;base64,${src}` : src;

  return (
    <>
      <div className={`rounded-xl border shadow-2xs overflow-hidden flex flex-col justify-between ${accentMap[accent]}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
          <div>
            <p className="text-slate-800 text-sm font-semibold">{title}</p>
            {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors shadow-2xs"
            title="Inspect full image"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-slate-100/70 p-3 flex items-center justify-center">
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-52 object-contain rounded-lg cursor-zoom-in bg-white shadow-2xs"
            onClick={() => setZoomed(true)}
          />
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-w-5xl max-h-full bg-white p-4 rounded-2xl shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div>
                <h4 className="text-slate-900 font-bold text-sm">{title}</h4>
                {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={() => setZoomed(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" /> Close Preview
              </button>
            </div>
            <div className="max-h-[80vh] flex items-center justify-center overflow-auto bg-slate-50 rounded-xl p-2">
              <img src={imgSrc} alt={title} className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
