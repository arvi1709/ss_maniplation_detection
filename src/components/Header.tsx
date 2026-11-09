import { Scan, BookOpen } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Scan className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-slate-900 font-bold text-lg leading-tight tracking-tight">
                ImageGuard Studio
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-semibold tracking-wide uppercase">
                IVP Lab
              </span>
            </div>
            <p className="text-slate-500 text-xs font-medium">
              Image &amp; Video Processing Laboratory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>B.Tech Academic Project</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Interactive Lab
          </span>
        </div>
      </div>
    </header>
  );
}
