"use client";

import { Tier } from "@/lib/types";

const tierColor: Record<Tier, string> = {
  PASS: "var(--pass)",
  CAUTION: "var(--caution)",
  AVOID: "var(--avoid)",
};

interface ScoreRingProps {
  score: number;
  tier: Tier;
  size?: number;
}

export function ScoreRing({ score, tier, size = 56 }: ScoreRingProps) {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const strokeWidth = 4;
  const viewBox = `0 0 ${2 * (r + strokeWidth)} ${2 * (r + strokeWidth)}`;
  const center = r + strokeWidth;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox={viewBox} className="w-full h-full -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={tierColor[tier]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring-animate"
          style={{ strokeDashoffset: offset } as React.CSSProperties}
        />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums">{score}</span>
    </div>
  );
}
