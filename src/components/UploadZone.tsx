import { useRef, useState, DragEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

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
      <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">{label}</p>
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 h-48 ${
            dragging
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800'
          }`}
        >
          <div className={`p-3 rounded-full transition-colors ${dragging ? 'bg-blue-500/20' : 'bg-slate-700'}`}>
            <Upload className={`w-6 h-6 ${dragging ? 'text-blue-400' : 'text-slate-400'}`} />
          </div>
          <div className="text-center px-4">
            <p className="text-slate-300 text-sm font-medium">Drop image here or click to browse</p>
            <p className="text-slate-500 text-xs mt-1">PNG, JPG, JPEG supported</p>
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
        <div className="relative rounded-xl overflow-hidden border border-slate-700 h-48 group">
          {preview && (
            <img src={preview} alt="preview" className="w-full h-full object-contain bg-slate-800" />
          )}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
            >
              <X className="w-4 h-4" /> Remove
            </button>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm rounded-lg px-2 py-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <p className="text-white text-xs truncate">{file.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
