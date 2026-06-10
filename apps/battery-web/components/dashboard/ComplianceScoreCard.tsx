"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import type { BatchChartData, ComplianceGap } from "@/lib/types";

interface ComplianceData {
  batch_id: string;
  compliance_score: number;
  compliance_gaps: ComplianceGap[];
}

interface ComplianceScoreCardProps {
  batches: BatchChartData[];
}

export function ComplianceScoreCard({ batches }: ComplianceScoreCardProps) {
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [totalGaps, setTotalGaps] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeBatches = batches.filter((b) => b.status === "ACTIVE");
    if (activeBatches.length === 0) {
      setAvgScore(null);
      setLoading(false);
      return;
    }

    const fetchCompliance = async () => {
      try {
        const results = await Promise.allSettled(
          activeBatches
            .slice(0, 10)
            .map((b) => api.get<ComplianceData>(`/batches/${b.id}/compliance`)),
        );

        let scoreSum = 0;
        let scoreCount = 0;
        let gaps = 0;

        results.forEach((r) => {
          if (r.status === "fulfilled" && r.value.data.compliance_score > 0) {
            scoreSum += r.value.data.compliance_score;
            scoreCount++;
            gaps += r.value.data.compliance_gaps?.length ?? 0;
          }
        });

        setAvgScore(scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null);
        setTotalGaps(gaps);
      } catch {
        console.warn("Compliance data unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchCompliance();
  }, [batches]);

  const scoreColor =
    avgScore === null
      ? "text-muted-foreground"
      : avgScore >= 80
        ? "text-emerald-500"
        : avgScore >= 50
          ? "text-amber-500"
          : "text-red-500";

  const barColor =
    avgScore === null
      ? "bg-border"
      : avgScore >= 80
        ? "bg-emerald-500/100"
        : avgScore >= 50
          ? "bg-amber-500/100"
          : "bg-red-500/100";

  const StatusIcon =
    avgScore === null ? Shield : avgScore >= 80 ? CheckCircle : AlertTriangle;

  return (
    <div className="relative bg-transparent border border-border rounded-none p-5 overflow-visible">
      <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider code-label">
          Compliance
        </span>
        <StatusIcon className={`h-4 w-4 ${scoreColor}`} />
      </div>

      {loading ? (
        <div className="h-8 bg-muted animate-pulse" />
      ) : avgScore === null ? (
        <>
          <div className="text-2xl text-muted-foreground">—</div>
          <div className="text-xs text-muted-foreground mt-2">
            No active batches
          </div>
        </>
      ) : (
        <>
          <div className={`text-2xl ${scoreColor}`}>{avgScore}%</div>
          <div className="w-full bg-muted h-1.5 mt-2">
            <div
              className={`h-1.5 ${barColor}`}
              style={{ width: `${avgScore}%` }}
            />
          </div>
          {totalGaps > 0 && (
            <div className="text-xs text-amber-500 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {totalGaps} gap{totalGaps !== 1 ? "s" : ""} to resolve
            </div>
          )}
        </>
      )}
    </div>
  );
}
