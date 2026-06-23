"use client";

import { Check, Circle, Battery, Shield, FileCheck, Leaf } from "lucide-react";
import { clsx } from "clsx";
import type { Batch, RegistryVerification } from "@/lib/types";
import type { MarketRegion } from "./types";
import { BatchLifecycleTracker } from "./BatchLifecycleTracker";

interface BatchStatusCardProps {
  batch: Batch;
  activationBlockerCount: number;
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

interface Chip {
  id: string;
  label: string;
  done: boolean;
  icon: React.ReactNode;
}

/**
 * Single status hub for the batch detail page. Consolidates what used to be two
 * overlapping panels (the lifecycle stepper and the "Export Readiness" bar) into
 * one card: the lifecycle stage + next action on top, and the supporting
 * export-readiness signals (specs, compliance, certificates, registry, carbon)
 * as chips below. Stage-level signals (Activated, Passports) live only in the
 * stepper now, so nothing is shown twice and there is one readiness story.
 */
export function BatchStatusCard({
  batch,
  activationBlockerCount,
  passportCount,
  complianceScore,
  region,
  verifications,
  user,
}: BatchStatusCardProps) {
  const s = batch.specs;
  const isEU = region === "EU";
  const isGlobal = region === "GLOBAL";

  const hasBatchCert = !!(
    s.bis_certificate_issue_date ||
    s.un38_3_test_date ||
    s.iec_62133_test_date ||
    s.msds_issue_date
  );
  const hasOrgCert = !!(user?.bis_r_number || user?.epr_registration_number || user?.iec_code);
  const hasVerifiedRegistry = (verifications || []).some((v) => v.status === "verified");

  const chips: Chip[] = [
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
      id: "certificates",
      label: "Certificates",
      done: hasBatchCert || hasOrgCert,
      icon: <FileCheck className="h-3 w-3" />,
    },
  ];

  if (hasBatchCert) {
    chips.push({
      id: "registry",
      label: "Registry",
      done: hasVerifiedRegistry,
      icon: <Shield className="h-3 w-3" />,
    });
  }

  if (isEU || isGlobal) {
    chips.push({
      id: "carbon",
      label: "Carbon",
      done: !!(
        batch.carbon_footprint_result &&
        Object.keys(batch.carbon_footprint_result).length > 0
      ),
      icon: <Leaf className="h-3 w-3" />,
    });
  }

  return (
    <div className="border border-border bg-transparent p-4">
      <BatchLifecycleTracker
        embedded
        status={batch.status}
        activationBlockerCount={activationBlockerCount}
        passportCount={passportCount}
      />

      <div className="mt-3 border-t border-border pt-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Export readiness
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <div
              key={chip.id}
              className={clsx(
                "inline-flex items-center gap-1.5 px-2 py-1 border text-[10px] font-medium uppercase tracking-wider transition-colors",
                chip.done
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                  : "border-border bg-transparent text-muted-foreground",
              )}
              title={chip.label}
            >
              {chip.done ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              {chip.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
