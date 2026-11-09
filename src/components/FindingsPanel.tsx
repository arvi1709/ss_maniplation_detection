import { AlertTriangle, CheckCircle, Activity, Layers, ScanLine, FileText, Compass } from 'lucide-react';

interface FindingsPanelProps {
  findings: string[];
  elaIntensity: number;
  noiseScore: number;
  suspiciousRegions: number;
  ssimScore?: number;
  alignmentInfo?: {
    status: string;
    method?: string;
    description?: string;
  };
}

export function FindingsPanel({
  findings,
  elaIntensity,
  noiseScore,
  suspiciousRegions,
  ssimScore,
  alignmentInfo,
}: FindingsPanelProps) {
  const isCompare = ssimScore !== undefined;

  const getRegionStatus = (count: number): 'high' | 'medium' | 'low' => {
    if (count >= 3) return 'high';
    if (count >= 1) return 'medium';
    return 'low';
  };

  const getSsimStatus = (score: number, regions: number): 'high' | 'medium' | 'low' => {
    if (score < 0.90) return 'high';
    if (score < 0.98 || regions > 0) return 'medium';
    return 'low';
  };

  const metrics = [
    {
      icon: <Layers className="w-4 h-4" />,
      label: 'ELA Intensity',
      value: elaIntensity.toFixed(2),
      status: (elaIntensity > 15 ? 'high' : elaIntensity > 8 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      desc: 'Compression anomaly level',
    },
    {
      icon: <Activity className="w-4 h-4" />,
      label: 'Noise Score',
      value: `${(noiseScore * 100).toFixed(1)}%`,
      status: (noiseScore > 0.2 ? 'high' : noiseScore > 0.1 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      desc: 'Abnormal noise regions',
    },
    {
      icon: <ScanLine className="w-4 h-4" />,
      label: isCompare ? 'Changed Regions' : 'Suspicious Regions',
      value: String(suspiciousRegions),
      status: getRegionStatus(suspiciousRegions),
      desc: isCompare ? 'Discrepant areas bounded' : 'Areas flagged for review',
    },
    ...(ssimScore !== undefined
      ? [{
          icon: <FileText className="w-4 h-4" />,
          label: 'SSIM Score',
          value: ssimScore.toFixed(4),
          status: getSsimStatus(ssimScore, suspiciousRegions),
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

      {alignmentInfo && alignmentInfo.description && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-300 text-xs">
          <Compass className="w-4 h-4 shrink-0 text-blue-400" />
          <span>{alignmentInfo.description}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
        <h4 className="text-slate-300 text-sm font-medium uppercase tracking-widest mb-3">
          Detection Findings
        </h4>
        {findings.length === 0 ? (
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">No significant anomalies detected in this analysis.</p>
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
