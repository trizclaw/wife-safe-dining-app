import { ScoreFactor } from "@/lib/types";

function barColor(score: number): string {
  if (score >= 75) return "bg-pass";
  if (score >= 50) return "bg-caution";
  return "bg-avoid";
}

export function ScoreBreakdown({ factors }: { factors: ScoreFactor[] }) {
  return (
    <div className="space-y-3">
      {factors.map((f) => (
        <div key={f.name}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm font-medium">{f.name}</span>
            <span className="text-xs text-muted tabular-nums">
              {f.score}/100 · w{Math.round(f.weight * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor(f.score)}`}
              style={{ width: `${f.score}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-0.5">{f.note}</p>
        </div>
      ))}
    </div>
  );
}
