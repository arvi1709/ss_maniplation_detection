import { useRef, useState, DragEvent } from 'react';
import { Upload, X, Image as ImageIcon, FileCheck } from 'lucide-react';

interface UploadZoneProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
}

export function UploadZone({ label, file, onChange, accept = 'image/png,image/jpg,image/jpeg' }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (f: File) => {
    onChange(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-700 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <span className="text-slate-400 text-[11px]">PNG, JPG, JPEG</span>
      </div>

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 h-52 bg-white ${
            dragging
              ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70 shadow-2xs'
          }`}
        >
          <div className={`p-3 rounded-full transition-colors ${dragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center px-4">
            <p className="text-slate-800 text-sm font-semibold">
              Drop image here or <span className="text-blue-600 underline decoration-blue-300 underline-offset-2">browse</span>
            </p>
            <p className="text-slate-500 text-xs mt-1">Supports screenshots and standard digital images</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white h-52 group shadow-2xs">
          {preview ? (
            <img src={preview} alt="Uploaded preview" className="w-full h-full object-contain bg-slate-100 p-2" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-2xs">
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Remove Image
            </button>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center justify-between bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-slate-800 text-xs font-medium truncate">{file.name}</p>
              </div>
              <span className="text-slate-500 text-[11px] shrink-0 font-mono ml-2">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
