import { CheckCircle, Activity, Layers, ScanLine, FileText, Compass, AlertCircle } from 'lucide-react';

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
      icon: <Layers className="w-4 h-4 text-blue-600" />,
      label: 'ELA Intensity',
      value: elaIntensity.toFixed(2),
      status: (elaIntensity > 15 ? 'high' : elaIntensity > 8 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      desc: 'Compression residual variance',
    },
    {
      icon: <Activity className="w-4 h-4 text-teal-600" />,
      label: 'Noise Variance',
      value: `${(noiseScore * 100).toFixed(1)}%`,
      status: (noiseScore > 0.2 ? 'high' : noiseScore > 0.1 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      desc: 'High-frequency residual noise',
    },
    {
      icon: <ScanLine className="w-4 h-4 text-indigo-600" />,
      label: isCompare ? 'Changed Regions' : 'Salient Discrepancies',
      value: String(suspiciousRegions),
      status: getRegionStatus(suspiciousRegions),
      desc: isCompare ? 'Segmented contour regions' : 'Flagged anomalous regions',
    },
    ...(ssimScore !== undefined
      ? [{
          icon: <FileText className="w-4 h-4 text-violet-600" />,
          label: 'SSIM Score',
          value: ssimScore.toFixed(4),
          status: getSsimStatus(ssimScore, suspiciousRegions),
          desc: 'Structural similarity index (0 to 1)',
        }]
      : []),
  ];

  const statusBadge: Record<string, string> = {
    high: 'text-rose-700 bg-rose-50 border-rose-200',
    medium: 'text-amber-700 bg-amber-50 border-amber-200',
    low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  };

  return (
    <div className="space-y-4">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider">{m.label}</span>
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">{m.icon}</div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-800 font-mono">{m.value}</p>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${statusBadge[m.status]}`}>
                  {m.status}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {alignmentInfo && alignmentInfo.description && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 text-xs">
          <Compass className="w-4 h-4 shrink-0 text-blue-600" />
          <span className="leading-relaxed font-medium">{alignmentInfo.description}</span>
        </div>
      )}

      {/* Observations & Findings Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <h4 className="text-slate-800 text-sm font-bold uppercase tracking-wider">
            Image Processing Observations
          </h4>
          <span className="text-slate-400 text-xs font-medium">Diagnostic Insights</span>
        </div>

        {findings.length === 0 ? (
          <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium">No significant visual anomalies or structural discrepancies detected.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {findings.map((finding, i) => (
              <li key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
