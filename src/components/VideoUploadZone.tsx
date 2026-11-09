import { useRef, useState, DragEvent } from 'react';
import { Upload, X, Film, AlertCircle, FileCheck } from 'lucide-react';

interface VideoUploadZoneProps {
  file: File | null;
  onChange: (file: File | null) => void;
  onError?: (err: string | null) => void;
}

const MAX_SIZE_MB = 100;

export function VideoUploadZone({ file, onChange, onError }: VideoUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    setLocalError(null);
    if (onError) onError(null);

    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.mp4' && ext !== '.avi') {
      const msg = `Unsupported video format '${ext}'. Please upload an MP4 or AVI video file.`;
      setLocalError(msg);
      if (onError) onError(msg);
      return;
    }

    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      const msg = `Video file size (${(f.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${MAX_SIZE_MB} MB limit.`;
      setLocalError(msg);
      if (onError) onError(msg);
      return;
    }

    onChange(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleRemove = () => {
    onChange(null);
    setLocalError(null);
    if (onError) onError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-700 text-xs font-semibold uppercase tracking-wider">
          Video Sequence for Temporal Analysis
        </p>
        <span className="text-slate-400 text-[11px]">MP4, AVI • Max 60s • 100 MB</span>
      </div>

      {localError && (
        <div className="flex items-center gap-2 mb-3 px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{localError}</span>
        </div>
      )}

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 h-56 bg-white ${
            dragging
              ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70 shadow-2xs'
          }`}
        >
          <div className={`p-3.5 rounded-full transition-colors ${dragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center px-4">
            <p className="text-slate-800 text-sm font-semibold">
              Drop video here or <span className="text-blue-600 underline decoration-blue-300 underline-offset-2">browse</span>
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Supports MP4 or AVI • Samples 1 frame/sec for temporal diff and SSIM metrics
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".mp4,.avi,video/mp4,video/x-msvideo"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white h-56 flex flex-col items-center justify-center p-6 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2">
            <Film className="w-6 h-6" />
          </div>
          <p className="text-slate-800 font-semibold text-sm truncate max-w-md">{file.name}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            Size: {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for temporal extraction
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Remove Video
            </button>
          </div>

          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200/80 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                Valid video format
              </span>
              <span className="font-mono text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
