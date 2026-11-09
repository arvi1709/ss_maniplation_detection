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

  const strokeColor = isUnable
    ? '#d97706' // amber-600
    : isDifferences
    ? score >= 70
      ? '#e11d48' // rose-600
      : '#d97706'
    : '#059669'; // emerald-600

  const badgeClass = isUnable
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : isDifferences
    ? score >= 70
      ? 'bg-rose-50 text-rose-800 border-rose-200'
      : 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  const headerTitle = isCompare
    ? 'Comparative Discrepancy Assessment'
    : 'Image Consistency & Discrepancy Index';

  const primaryLabel = isCompare ? 'Visual Discrepancy Ratio' : 'Discrepancy Index';
  const secondaryLabel = isCompare ? 'Structural Continuity' : 'Visual Consistency';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-slate-800 font-bold text-base">
            {headerTitle}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Normalized heuristic metric calculated from SSIM, ELA residual variance, and edge distributions
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
        >
          {verdict}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 pt-2">
        <div className="relative w-36 h-36 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="12"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="12"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {Math.round(score)}%
            </span>
            <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wider mt-0.5">
              {isCompare ? 'Disparity' : 'Score'}
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
            <p className="text-slate-600 text-xs leading-relaxed">
              {isCompare
                ? 'Compares structural similarity (SSIM) and localized gradient shifts. Lower discrepancy corresponds to higher visual continuity with reference.'
                : 'Aggregates compression residual divergence (ELA), local noise variance, and Otsu contours to highlight unusual visual regions.'}
            </p>
          </div>

          <div className="space-y-3">
            <ScoreBar label={primaryLabel} value={score} color={strokeColor} />
            <ScoreBar
              label={secondaryLabel}
              value={100 - score}
              color={isClean ? '#059669' : '#64748b'}
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
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-800 font-semibold font-mono">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
