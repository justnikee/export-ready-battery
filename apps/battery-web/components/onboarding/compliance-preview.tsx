"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface Gap {
  field: string;
  market?: string;
  regulation?: string;
  message: string;
  severity: string;
}

interface MarketReadiness {
  score: number;
  valid: boolean;
  gaps?: Gap[];
}

interface CompliancePreviewProps {
  india?: MarketReadiness;
  eu?: MarketReadiness;
  markets: string[];
  onGapClick?: (gap: Gap) => void;
}

export function CompliancePreview({ india, eu, markets, onGapClick }: CompliancePreviewProps) {
  const hasIndia = markets.includes("india");
  const hasEU = markets.includes("eu");

  const renderScore = (label: string, readiness?: MarketReadiness) => {
    if (!readiness) return null;

    const scoreColor =
      readiness.score >= 80
        ? "text-emerald-500"
        : readiness.score >= 50
          ? "text-amber-500"
          : "text-red-500";

    const bgColor =
      readiness.score >= 80
        ? "bg-emerald-500/10 border-emerald-500/20"
        : readiness.score >= 50
          ? "bg-amber-500/10 border-amber-500/20"
          : "bg-red-500/10 border-red-500/20";

    return (
      <div className={`p-4 rounded-none border ${bgColor}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className={`text-lg font-bold ${scoreColor}`}>
            {readiness.score.toFixed(0)}%
          </span>
        </div>
        {readiness.valid ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            Ready for activation
          </div>
        ) : (
          <ul className="space-y-2 mt-2">
            {(readiness.gaps || []).map((gap, i) => (
              <li
                key={i}
                className={`flex items-start gap-2 text-sm ${onGapClick ? "cursor-pointer hover:opacity-80" : ""}`}
                onClick={() => onGapClick?.(gap)}
              >
                {gap.severity === "ERROR" ? (
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <span className={gap.severity === "ERROR" ? "text-red-700" : "text-amber-700"}>
                  {gap.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">
        Activation Readiness Preview
      </p>
      {hasIndia && renderScore("🇮🇳 India", india)}
      {hasEU && renderScore("🇪🇺 European Union", eu)}
    </div>
  );
}
