"use client";

import {
  Check,
  AlertTriangle,
  Circle,
  FileCheck,
  Battery,
  Shield,
  Leaf,
} from "lucide-react";
import { clsx } from "clsx";
import type { Batch, RegistryVerification } from "@/lib/types";
import type { MarketRegion } from "./types";

interface CheckItem {
  id: string;
  label: string;
  done: boolean;
  icon: React.ReactNode;
}

interface BatchReadinessBarProps {
  batch: Batch;
  passportCount: number;
  complianceScore: number | null;
  region: MarketRegion;
  verifications?: RegistryVerification[];
  user?: {
    bis_r_number?: string;
    epr_registration_number?: string;
    iec_code?: string;
  } | null;
}

export function BatchReadinessBar({
  batch,
  passportCount,
  complianceScore,
  region,
  verifications,
  user,
}: BatchReadinessBarProps) {
  const s = batch.specs;
  const isEU = region === "EU";
  const isGlobal = region === "GLOBAL";

  const hasBatchCert = !!(
    s.bis_certificate_issue_date ||
    s.un38_3_test_date ||
    s.iec_62133_test_date ||
    s.msds_issue_date
  );
  const hasOrgCert = !!(
    user?.bis_r_number ||
    user?.epr_registration_number ||
    user?.iec_code
  );
  const hasVerifiedRegistry = (verifications || []).some(
    (v) => v.status === "verified",
  );

  const items: CheckItem[] = [
    {
      id: "specs",
      label: "Specs",
      done: !!(s.chemistry && s.capacity && batch.model_name),
      icon: <Battery className="h-3 w-3" />,
    },
    {
      id: "compliance",
      label: "Compliance",
      done: complianceScore !== null && complianceScore >= 80,
      icon: <Shield className="h-3 w-3" />,
    },
    {
      id: "activate",
      label: "Activated",
      done: batch.status === "ACTIVE" || batch.status === "ARCHIVED",
      icon: <FileCheck className="h-3 w-3" />,
    },
    {
      id: "passports",
      label: "Passports",
      done: passportCount > 0,
      icon: <Battery className="h-3 w-3" />,
    },
    {
      id: "certificates",
      label: "Certificates",
      done: hasBatchCert || hasOrgCert,
      icon: <FileCheck className="h-3 w-3" />,
    },
  ];

  if (hasBatchCert) {
    items.push({
      id: "registry",
      label: "Registry",
      done: hasVerifiedRegistry,
      icon: <Shield className="h-3 w-3" />,
    });
  }

  if (isEU || isGlobal) {
    items.push({
      id: "carbon",
      label: "Carbon",
      done: !!(
        batch.carbon_footprint_result &&
        Object.keys(batch.carbon_footprint_result).length > 0
      ),
      icon: <Leaf className="h-3 w-3" />,
    });
  }

  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);

  const barColor =
    pct >= 90 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="border border-border bg-transparent p-4 relative">
      <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />

      {/* Top row: label + percentage */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Export Readiness
        </span>
        <span
          className={clsx(
            "text-xs font-mono font-semibold",
            pct >= 90 && "text-emerald-500",
            pct >= 60 && pct < 90 && "text-amber-500",
            pct < 60 && "text-red-500",
          )}
        >
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted mb-3">
        <div
          className={clsx("h-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Check items */}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={clsx(
              "inline-flex items-center gap-1.5 px-2 py-1 border text-[10px] font-medium uppercase tracking-wider transition-colors",
              item.done
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                : "border-border bg-transparent text-muted-foreground",
            )}
            title={item.label}
          >
            {item.done ? (
              <Check className="h-3 w-3" />
            ) : (
              <Circle className="h-3 w-3" />
            )}
            {item.label}
          </div>
        ))}
      </div>

      {/* Warning if not fully ready */}
      {pct < 100 && batch.status === "ACTIVE" && (
        <div className="mt-3 flex items-start gap-2 text-xs text-amber-500">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            {items.find((i) => !i.done)?.label} incomplete — batch not fully
            export-ready
          </span>
        </div>
      )}
    </div>
  );
}
