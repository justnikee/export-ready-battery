"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Leaf,
  CheckCircle,
} from "lucide-react";
import type { Batch, ComplianceGap } from "@/lib/types";
import type { ActivationBlockers, DetailTab } from "./types";
import { formatBlockerLabel, normalizeGapField } from "./hooks/useBatchDetail";
import { DashboardPanel } from "./DashboardPanel";

interface ActivationChecklistProps {
  batch: Batch;
  activationResult: ActivationBlockers;
  complianceGaps: ComplianceGap[];
  onNavigate: (tab: DetailTab, scrollTarget?: string) => void;
  onSettingsCompliance: () => void;
  onSettingsProfile: () => void;
}

export function ActivationChecklist({
  batch,
  activationResult,
  onNavigate,
  onSettingsCompliance,
  onSettingsProfile,
}: ActivationChecklistProps) {
  const [expanded, setExpanded] = useState(true);
  const { blocking, warnings } = activationResult;
  const hasIssues = blocking.length > 0 || warnings.length > 0;

  if (!hasIssues) return null;

  const getBlockerAction = (
    key: string,
  ): { label: string; icon: React.ReactNode; onClick: () => void } | null => {
    const normalized = normalizeGapField(key);

    const settingsComplianceKeys = [
      "tenant.epr_registration_number",
      "tenant.bis_r_number",
      "tenant.iec_code",
      "tenant.morth_manufacturer_code",
    ];
    const settingsProfileKeys = [
      "tenant.company_name",
      "tenant.address",
      "tenant.eu_authorized_representative_name",
      "tenant.eu_authorized_representative_address",
      "tenant.eu_contact_email",
    ];

    if (settingsComplianceKeys.includes(normalized)) {
      return {
        label: "Fix in Settings",
        icon: <ExternalLink className="h-3 w-3" />,
        onClick: onSettingsCompliance,
      };
    }
    if (settingsProfileKeys.includes(normalized)) {
      return {
        label: "Fix in Settings",
        icon: <ExternalLink className="h-3 w-3" />,
        onClick: onSettingsProfile,
      };
    }
    if (normalized === "carbon_footprint_result") {
      return {
        label: "Use Calculator",
        icon: <Leaf className="h-3 w-3" />,
        onClick: () => onNavigate("compliance", "carbon-calculator"),
      };
    }
    if (
      normalized === "specs.material_composition" ||
      normalized.startsWith("specs.material_composition.") ||
      normalized === "specs.hazardous_substances.declaration" ||
      normalized === "specs.expected_lifetime_cycles" ||
      normalized === "specs.warranty_months" ||
      normalized === "specs.battery_category" ||
      normalized === "specs.cell_source" ||
      normalized === "specs.bill_of_entry_no" ||
      normalized === "specs.country_of_origin" ||
      normalized === "specs.customs_date" ||
      normalized === "specs.bis_number" ||
      normalized === "specs.epr_number" ||
      normalized === "domestic_value_add"
    ) {
      return {
        label: "View in Overview",
        icon: <ExternalLink className="h-3 w-3" />,
        onClick: () => onNavigate("overview"),
      };
    }
    if (
      normalized === "specs.certifications: AIS-156" ||
      normalized === "specs.certifications: AIS-038"
    ) {
      return {
        label: "Declare",
        icon: <CheckCircle className="h-3 w-3" />,
        onClick: () => onNavigate("overview"),
      };
    }
    return null;
  };

  return (
    <DashboardPanel noPadding id="activation-checklist">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {blocking.length > 0 ? (
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {blocking.length} Blocking Issue
                {blocking.length > 1 ? "s" : ""}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-500">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">
                {warnings.length} Warning
                {warnings.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {blocking.length > 0 && (
            <div className="space-y-2">
              {blocking.map((key, index) => {
                const action = getBlockerAction(key);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 py-2 px-3 bg-red-500/5 border border-red-500/10"
                  >
                    <div className="flex items-center gap-2 text-sm text-red-500 min-w-0">
                      <span className="w-1.5 h-1.5 bg-red-500 shrink-0" />
                      <span className="truncate">
                        {formatBlockerLabel(key)}
                      </span>
                    </div>
                    {action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={action.onClick}
                        className="shrink-0 h-7 text-xs border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 gap-1"
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-amber-500 uppercase tracking-wider mb-2">
                Warnings (non-blocking)
              </p>
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-amber-500"
                >
                  <span className="mt-1.5 w-1 h-1 bg-amber-500 shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardPanel>
  );
}
