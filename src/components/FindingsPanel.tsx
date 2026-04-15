import { AlertTriangle, CheckCircle, Activity, Layers, ScanLine, FileText } from 'lucide-react';

interface FindingsPanelProps {
  findings: string[];
  elaIntensity: number;
  noiseScore: number;
  suspiciousRegions: number;
  ssimScore?: number;
}

export function FindingsPanel({ findings, elaIntensity, noiseScore, suspiciousRegions, ssimScore }: FindingsPanelProps) {
  const metrics = [
    {
      icon: <Layers className="w-4 h-4" />,
      label: 'ELA Intensity',
      value: elaIntensity.toFixed(2),
      status: elaIntensity > 15 ? 'high' : elaIntensity > 8 ? 'medium' : 'low',
      desc: 'Compression anomaly level',
    },
    {
      icon: <Activity className="w-4 h-4" />,
      label: 'Noise Score',
      value: `${(noiseScore * 100).toFixed(1)}%`,
      status: noiseScore > 0.2 ? 'high' : noiseScore > 0.1 ? 'medium' : 'low',
      desc: 'Abnormal noise regions',
    },
    {
      icon: <ScanLine className="w-4 h-4" />,
      label: 'Suspicious Regions',
      value: String(suspiciousRegions),
      status: suspiciousRegions > 5 ? 'high' : suspiciousRegions > 2 ? 'medium' : 'low',
      desc: 'Areas flagged for review',
    },
    ...(ssimScore !== undefined
      ? [{
          icon: <FileText className="w-4 h-4" />,
          label: 'SSIM Score',
          value: ssimScore.toFixed(4),
          status: (ssimScore < 0.85 ? 'high' : ssimScore < 0.95 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          desc: 'Structural similarity index',
        }]
      : []),
  ];

  const statusColors: Record<string, string> = {
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-green-400 bg-green-500/10 border-green-500/20',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className={`rounded-xl border p-3 ${statusColors[m.status]}`}>
            <div className="flex items-center gap-2 mb-1">
              {m.icon}
              <span className="text-xs font-medium uppercase tracking-wide">{m.label}</span>
            </div>
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-xs opacity-70 mt-0.5">{m.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
        <h4 className="text-slate-300 text-sm font-medium uppercase tracking-widest mb-3">
          Detection Findings
        </h4>
        {findings.length === 0 ? (
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">No significant anomalies detected in this image.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {findings.map((finding, i) => (
              <li key={i} className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-slate-300 text-sm">{finding}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
