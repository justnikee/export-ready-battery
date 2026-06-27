"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { getObligation, type EPRObligation } from "@/lib/api/epr";

export function EPRObligationCard({ complianceHref }: { complianceHref: string }) {
  const [obligation, setObligation] = useState<EPRObligation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getObligation(new Date().getFullYear())
      .then(setObligation)
      .catch(() => setObligation(null))
      .finally(() => setLoading(false));
  }, []);

  const requiredKg = obligation?.net_obligation_kg ?? 0;
  const certifiedKg = (obligation?.fulfilled_via_recycling_kg ?? 0) + (obligation?.fulfilled_via_refurbishment_kg ?? 0);
  const progressPct = requiredKg > 0 ? Math.min(100, (certifiedKg / requiredKg) * 100) : 0;

  return (
    <div className="relative bg-transparent border border-border rounded-none overflow-visible p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          EPR Obligation
        </span>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : !obligation || requiredKg === 0 ? (
        <div className="text-sm text-muted-foreground">No obligation data for this year</div>
      ) : (
        <>
          <div className="text-xs text-muted-foreground mb-2">
            {certifiedKg.toFixed(0)} / {requiredKg.toFixed(0)} kg certified
          </div>
          <div className="w-full bg-muted h-1.5">
            <div
              className={`h-1.5 ${certifiedKg >= requiredKg ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </>
      )}
      <Link href={complianceHref} className="mt-3 inline-flex text-xs font-medium text-blue-500 hover:underline">
        View Compliance →
      </Link>
    </div>
  );
}
