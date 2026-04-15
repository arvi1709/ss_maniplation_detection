interface ConfidenceGaugeProps {
  score: number;
  verdict: string;
}

export function ConfidenceGauge({ score, verdict }: ConfidenceGaugeProps) {
  const isManipulated = score >= 30;
  const color = score >= 70 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#22c55e';
  const bgColor = score >= 70 ? 'bg-red-500/10 border-red-500/20' : score >= 30 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-green-500/10 border-green-500/20';
  const textColor = score >= 70 ? 'text-red-400' : score >= 30 ? 'text-amber-400' : 'text-green-400';
  const badgeBg = score >= 70 ? 'bg-red-500/20 text-red-300' : score >= 30 ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300';

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className={`rounded-xl border p-6 ${bgColor}`}>
      <h3 className="text-slate-300 text-sm font-medium uppercase tracking-widest mb-4">
        Manipulation Confidence Score
      </h3>
      <div className="flex items-center gap-6">
        <div className="relative w-40 h-40 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
            <circle
              cx="80" cy="80" r={radius} fill="none"
              stroke={color} strokeWidth="12"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${textColor}`}>{Math.round(score)}%</span>
            <span className="text-slate-500 text-xs mt-0.5">confidence</span>
          </div>
        </div>
        <div className="flex-1">
          <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold mb-3 ${badgeBg}`}>
            {verdict}
          </span>
          <div className="space-y-2">
            <ScoreBar label="Tamper Risk" value={score} color={color} />
            <ScoreBar label="Integrity" value={100 - score} color={isManipulated ? '#94a3b8' : '#22c55e'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
