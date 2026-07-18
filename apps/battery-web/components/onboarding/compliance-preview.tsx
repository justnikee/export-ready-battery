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
        ? "#10b981"
        : readiness.score >= 50
          ? "#f59e0b"
          : "#ef4444";

    const wrapStyle: React.CSSProperties =
      readiness.score >= 80
        ? { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }
        : readiness.score >= 50
          ? { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }
          : { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" };

    return (
      <div style={{ ...wrapStyle, borderRadius: "10px", padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#cbd5e1" }}>{label}</span>
          <span style={{ fontSize: "18px", fontWeight: 700, color: scoreColor }}>
            {readiness.score.toFixed(0)}%
          </span>
        </div>
        {readiness.valid ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#10b981" }}>
            <CheckCircle2 style={{ width: "14px", height: "14px" }} />
            Ready for activation
          </div>
        ) : (
          <ul style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
            {(readiness.gaps || []).map((gap, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  fontSize: "12px",
                  cursor: onGapClick ? "pointer" : "default",
                }}
                onClick={() => onGapClick?.(gap)}
              >
                {gap.severity === "ERROR" ? (
                  <XCircle style={{ width: "14px", height: "14px", color: "#ef4444", flexShrink: 0, marginTop: "1px" }} />
                ) : (
                  <AlertTriangle style={{ width: "14px", height: "14px", color: "#f59e0b", flexShrink: 0, marginTop: "1px" }} />
                )}
                <span style={{ color: gap.severity === "ERROR" ? "#f87171" : "#fbbf24" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <p style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Activation Readiness Preview
      </p>
      {hasIndia && renderScore("🇮🇳 India", india)}
      {hasEU && renderScore("🇪🇺 European Union", eu)}
    </div>
  );
}
