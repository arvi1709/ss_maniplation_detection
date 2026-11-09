import { AnalysisMode } from '../types';

interface ConfidenceGaugeProps {
  score: number;
  verdict: string;
  mode?: AnalysisMode;
}

export function ConfidenceGauge({ score, verdict, mode }: ConfidenceGaugeProps) {
  const isCompare =
    mode === 'compare' ||
    verdict === 'Differences Detected' ||
    verdict === 'No Significant Differences Detected' ||
    verdict === 'Unable to Compare Reliably';

  const isUnable = verdict === 'Unable to Compare Reliably';
  const isDifferences =
    verdict === 'Differences Detected' ||
    verdict === 'Possible Manipulation Detected' ||
    (!isCompare && score >= 30);
  const isClean =
    verdict === 'No Significant Differences Detected' ||
    (!isCompare && score < 30 && !isUnable);

  const color = isUnable
    ? '#f59e0b'
    : isDifferences
    ? score >= 70
      ? '#ef4444'
      : '#f59e0b'
    : '#22c55e';

  const bgColor = isUnable
    ? 'bg-amber-500/10 border-amber-500/20'
    : isDifferences
    ? score >= 70
      ? 'bg-red-500/10 border-red-500/20'
      : 'bg-amber-500/10 border-amber-500/20'
    : 'bg-green-500/10 border-green-500/20';

  const textColor = isUnable
    ? 'text-amber-400'
    : isDifferences
    ? score >= 70
      ? 'text-red-400'
      : 'text-amber-400'
    : 'text-green-400';

  const badgeBg = isUnable
    ? 'bg-amber-500/20 text-amber-300'
    : isDifferences
    ? score >= 70
      ? 'bg-red-500/20 text-red-300'
      : 'bg-amber-500/20 text-amber-300'
    : 'bg-green-500/20 text-green-300';

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  const headerTitle = isCompare
    ? 'Comparison Assessment Score'
    : 'Manipulation Confidence Score';

  const primaryLabel = isCompare ? 'Discrepancy Level' : 'Tamper Risk';
  const secondaryLabel = isCompare ? 'Consistency Match' : 'Integrity';

  return (
    <div className={`rounded-xl border p-6 ${bgColor}`}>
      <h3 className="text-slate-300 text-sm font-medium uppercase tracking-widest mb-4">
        {headerTitle}
      </h3>
      <div className="flex items-center gap-6">
        <div className="relative w-40 h-40 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="12"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${textColor}`}>
              {Math.round(score)}%
            </span>
            <span className="text-slate-500 text-xs mt-0.5">
              {isCompare ? 'difference' : 'confidence'}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <span
            className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold mb-3 ${badgeBg}`}
          >
            {verdict}
          </span>
          <div className="space-y-2">
            <ScoreBar label={primaryLabel} value={score} color={color} />
            <ScoreBar
              label={secondaryLabel}
              value={100 - score}
              color={isClean ? '#22c55e' : '#94a3b8'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
