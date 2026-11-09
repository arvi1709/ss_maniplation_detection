import { Shield, Eye } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
            <Eye className="w-3.5 h-3.5 text-blue-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight tracking-tight">
              Screenshot Manipulation Detection
            </h1>
            <p className="text-slate-400 text-xs tracking-widest uppercase">
              Digital Forensic Analysis System
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <span className="text-slate-400">Computer Vision + Forensics</span>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            v1.0
          </span>
        </div>
      </div>
    </header>
  );
}
