"use client";

interface CompletionRingProps {
  pct: number;
  /** Outer diameter in px. Default 64. */
  size?: number;
}

/**
 * Circular completion gauge shared by the Review step and the wizard summary
 * panel, so both render an identical ring for the same percentage.
 */
export function CompletionRing({ pct, size = 64 }: CompletionRingProps) {
  const stroke = 6;
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference;
  const colorClass = pct >= 100 ? "text-emerald-500" : pct >= 50 ? "text-foreground" : "text-amber-500";

  return (
    <div className="relative shrink-0" style={{ height: size, width: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-all duration-300`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
        {pct}%
      </div>
    </div>
  );
}
