"use client";

import { clsx } from "clsx";

interface ComplianceScoreRingProps {
  score: number;
}

export function ComplianceScoreRing({ score }: ComplianceScoreRingProps) {
  const roundedScore = Math.round(score);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (roundedScore / 100) * circumference;

  const colorClass =
    roundedScore >= 80
      ? "text-emerald-500"
      : roundedScore >= 50
        ? "text-amber-500"
        : "text-red-500";

  const bgClass =
    roundedScore >= 80
      ? "bg-emerald-500/10"
      : roundedScore >= 50
        ? "bg-amber-500/10"
        : "bg-red-500/10";

  const label =
    roundedScore >= 80 ? "Passed" : roundedScore >= 50 ? "Partial" : "Failing";

  return (
    <div className="flex items-center gap-5">
      <div className={`relative w-20 h-20 rounded-full ${bgClass}`}>
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={clsx(colorClass, "transition-all duration-700")}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={clsx("text-lg font-bold leading-none", colorClass)}>
            {roundedScore}%
          </span>
        </div>
      </div>
      <div>
        <p className={clsx("text-sm font-semibold", colorClass)}>{label}</p>
        <p className="text-xs text-muted-foreground">
          {roundedScore >= 80
            ? "All checks passed"
            : roundedScore >= 50
              ? "Some issues need attention"
              : "Critical issues found"}
        </p>
      </div>
    </div>
  );
}
