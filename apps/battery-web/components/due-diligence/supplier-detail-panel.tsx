"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Mail,
  MapPin,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { useSupplierRisk, useSupplierCMRTReports, useDueDiligenceAssessments } from "@/hooks/use-queries";
import CorrectiveActionsDashboard from "@/components/due-diligence/corrective-actions-dashboard";
import type { Supplier } from "@/components/due-diligence/supplier-list";

const OECD_STEPS = [
  { key: "policy", label: "Policy" },
  { key: "identify", label: "Identify" },
  { key: "assess", label: "Assess" },
  { key: "respond", label: "Respond" },
  { key: "audit", label: "Audit" },
];

interface SupplierDetailPanelProps {
  supplier: Supplier;
  onOpenWizard: () => void;
  onOpenCMRT: () => void;
}

export default function SupplierDetailPanel({ supplier, onOpenWizard, onOpenCMRT }: SupplierDetailPanelProps) {
  const { data: riskProfile } = useSupplierRisk(supplier.id);
  const { data: assessments = [] } = useDueDiligenceAssessments(supplier.id);
  const { data: cmrtData } = useSupplierCMRTReports(supplier.id);

  const stepStatus = (key: string) => assessments.find((a) => a.step === key)?.status || "not_started";
  const completedSteps = OECD_STEPS.filter((s) => stepStatus(s.key) === "complete").length;
  const reports = (cmrtData?.reports || []) as Array<{ id: string; reporting_year: number; unknown_smelters: number; rmi_conformant_pct?: number; created_at: string }>;

  const riskBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-red-500 text-white text-xs">High Risk ({score})</Badge>;
    if (score >= 40) return <Badge className="bg-amber-500 text-white text-xs">Elevated ({score})</Badge>;
    return <Badge className="bg-green-500 text-white text-xs">Low Risk ({score})</Badge>;
  };

  return (
    <div className="rounded-md h-full overflow-y-auto bg-muted">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-base font-medium">{supplier.company_name}</h2>
          </div>
          {riskProfile && riskBadge(riskProfile.overall_score)}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mail className="w-3 h-3" />
            {supplier.email}
          </span>
          {supplier.country && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {supplier.country}
            </span>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onOpenWizard}>
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Due Diligence Wizard
          </Button>
          <Button size="sm" variant="outline" onClick={onOpenCMRT}>
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
            Upload CMRT
          </Button>
        </div>
      </div>

      {/* DD Progress */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">OECD Due Diligence</h3>
          <span className="text-xs text-muted-foreground">{completedSteps}/{OECD_STEPS.length} steps complete</span>
        </div>
        <div className="flex items-center gap-1">
          {OECD_STEPS.map((step, idx) => {
            const status = stepStatus(step.key);
            return (
              <div key={step.key} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-1 flex-1">
                  {status === "complete" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : status === "in_progress" || status === "not_started" ? (
                    <Circle className={`w-4 h-4 ${status === "in_progress" ? "text-amber-500" : "text-muted-foreground"}`} />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-[10px] text-muted-foreground">{step.label}</span>
                </div>
                {idx < OECD_STEPS.length - 1 && <div className="h-px flex-1 bg-border -mt-3.5" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* CMRT Reports */}
      <div className="p-4 border-b border-border space-y-2">
        <h3 className="text-sm font-medium">CMRT Reports</h3>
        {reports.length === 0 ? (
          <p className="text-xs text-muted-foreground">No CMRT reports uploaded yet.</p>
        ) : (
          <div className="space-y-1.5">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground">Reporting year {r.reporting_year}</span>
                <span className="text-muted-foreground">
                  {r.unknown_smelters > 0 ? `${r.unknown_smelters} unknown smelters` : "All smelters identified"}
                  {typeof r.rmi_conformant_pct === "number" && ` · ${r.rmi_conformant_pct}% RMI conformant`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Corrective Actions for this supplier */}
      <div className="p-4">
        <CorrectiveActionsDashboard supplierId={supplier.id} />
      </div>
    </div>
  );
}
