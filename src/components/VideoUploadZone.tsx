import { useRef, useState, DragEvent } from 'react';
import { Upload, X, Video, AlertCircle } from 'lucide-react';

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
      <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">
        Video File for Temporal Analysis
      </p>

      {localError && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
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
          className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 h-52 ${
            dragging
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800'
          }`}
        >
          <div className={`p-3.5 rounded-full transition-colors ${dragging ? 'bg-blue-500/20' : 'bg-slate-700'}`}>
            <Upload className={`w-6 h-6 ${dragging ? 'text-blue-400' : 'text-slate-400'}`} />
          </div>
          <div className="text-center px-4">
            <p className="text-slate-300 text-sm font-medium">Drop video here or click to browse</p>
            <p className="text-slate-500 text-xs mt-1">MP4 or AVI format • Maximum 60s duration • Up to 100 MB</p>
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
        <div className="relative rounded-xl overflow-hidden border border-slate-700 h-52 bg-slate-800/50 flex flex-col items-center justify-center p-6 group">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-3">
            <Video className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-white font-medium text-sm truncate max-w-md">{file.name}</p>
          <p className="text-slate-400 text-xs mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-xs transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Remove Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
