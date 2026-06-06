"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertTriangle,
  FlaskConical,
  ShieldCheck,
  ShieldAlert,
  Upload,
  FileText,
  Circle,
} from "lucide-react";
import {
  useDueDiligenceAssessments,
  useCreateDDAssessment,
  useTransitionDDAssessment,
  useSupplierRisk,
} from "@/hooks/use-queries";

const OECD_STEPS = [
  { key: "policy", label: "Establish Policy", desc: "Adopt and communicate a supply chain due diligence policy." },
  { key: "identify", label: "Identify Risks", desc: "Identify and assess risks in the supply chain." },
  { key: "assess", label: "Assess Risks", desc: "Evaluate supplier risk profiles against OECD guidelines." },
  { key: "respond", label: "Respond & Mitigate", desc: "Design and implement a strategy to respond to identified risks." },
  { key: "audit", label: "Independent Audit", desc: "Carry out an independent third-party audit of smelters and refiners." },
];

interface OECDWizardDialogProps {
  supplierId: string;
  supplierName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OECDWizardDialog({ supplierId, supplierName, open, onOpenChange }: OECDWizardDialogProps) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data: assessments = [], isLoading: assessmentsLoading } = useDueDiligenceAssessments(supplierId);
  const { data: riskProfile } = useSupplierRisk(supplierId);
  const createAssessment = useCreateDDAssessment();
  const transitionAssessment = useTransitionDDAssessment();

  const stepMap = useMemo(() => {
    const map: Record<string, typeof assessments[0]> = {};
    for (const a of assessments) map[a.step] = a;
    return map;
  }, [assessments]);

  const progress = useMemo(() => {
    const completed = assessments.filter((a) => a.status === "complete").length;
    return (completed / OECD_STEPS.length) * 100;
  }, [assessments]);

  const getStepStatus = (key: string) => stepMap[key]?.status || "not_started";

  const canStart = (idx: number) => {
    if (idx === 0) return true;
    return getStepStatus(OECD_STEPS[idx - 1].key) === "complete";
  };

  const handleCreate = async (step: string) => {
    try {
      await createAssessment.mutateAsync({ supplierId, data: { step, notes: notes[step] || "" } });
      toast.success(`Assessment for "${step}" created`);
    } catch {
      toast.error("Failed to create assessment");
    }
  };

  const handleTransition = async (id: string, status: string) => {
    try {
      await transitionAssessment.mutateAsync({ id, data: { status, notes: notes[stepMap[id]?.step] || "" } });
      toast.success(`Step marked as ${status}`);
    } catch {
      toast.error("Failed to transition step");
    }
  };

  const riskScoreBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-red-500 text-white text-xs">High Risk ({score})</Badge>;
    if (score >= 40) return <Badge className="bg-amber-500 text-white text-xs">Elevated ({score})</Badge>;
    return <Badge className="bg-green-500 text-white text-xs">Low Risk ({score})</Badge>;
  };

  const countryTierBadge = (tier: number) => {
    const labels = ["", "Low", "Medium", "High", "Extreme"];
    const colors = ["", "bg-green-500", "bg-amber-500", "bg-orange-500", "bg-red-500"];
    return (
      <Badge className={`${colors[tier] || "bg-gray-500"} text-white text-xs`}>
        Tier {tier} — {labels[tier] || "Unknown"}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>OECD Due Diligence — {supplierName}</DialogTitle>
          <DialogDescription>5-Step Supply Chain Due Diligence Assessment</DialogDescription>
        </DialogHeader>

        {assessmentsLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading assessments...</div>
        ) : (
          <div className="space-y-6">
            {/* Risk Profile */}
            {riskProfile ? (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Supplier Risk Profile</span>
                  {riskScoreBadge(riskProfile.overall_score)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Country Tier:</span>
                  {countryTierBadge(riskProfile.country_risk_tier)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">RMAP:</span>
                  {riskProfile.rmap_valid ? (
                    <Badge className="bg-green-500 text-white text-xs"><ShieldCheck className="w-3 h-3 mr-1" />Valid</Badge>
                  ) : (
                    <Badge className="bg-red-500 text-white text-xs"><ShieldAlert className="w-3 h-3 mr-1" />Missing</Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 text-sm text-muted-foreground text-center bg-muted/30">
                No risk profile computed yet.
              </div>
            )}

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">OECD Progress</span>
                <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {OECD_STEPS.map((step, idx) => {
                const assessment = stepMap[step.key];
                const status = getStepStatus(step.key);
                const isComplete = status === "complete";
                const isFailed = status === "failed";
                const isInProgress = status === "in_progress";
                const stepCanStart = canStart(idx);

                return (
                  <div
                    key={step.key}
                    className={`border rounded-lg p-4 space-y-3 ${
                      isFailed ? "border-red-300 bg-red-50" : isComplete ? "border-green-300 bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : isFailed ? (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : isInProgress ? (
                          <ArrowRight className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <div className="text-sm font-medium">{idx + 1}. {step.label}</div>
                          <div className="text-xs text-muted-foreground">{step.desc}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize whitespace-nowrap">
                        {status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    {/* Evidence docs */}
                    {assessment && assessment.evidence_docs.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {assessment.evidence_docs.map((doc, i) => (
                          <Badge key={i} variant="secondary" className="text-xs gap-1">
                            <FileText className="w-3 h-3" />
                            {doc.split("/").pop()}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {assessment && (
                      <Textarea
                        placeholder="Add notes about this step..."
                        value={notes[step.key] ?? assessment.notes ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [step.key]: e.target.value }))}
                        className="text-xs min-h-[60px]"
                      />
                    )}

                    {/* Completed info */}
                    {assessment?.completed_at && (
                      <div className="text-xs text-muted-foreground">
                        Completed by {assessment.completed_by} on{" "}
                        {new Date(assessment.completed_at).toLocaleDateString()}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {!assessment && stepCanStart && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreate(step.key)}
                          disabled={createAssessment.isPending}
                        >
                          <FlaskConical className="w-3.5 h-3.5 mr-1" />
                          Initiate
                        </Button>
                      )}
                      {assessment?.status === "not_started" && stepCanStart && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTransition(assessment.id, "in_progress")}
                          disabled={transitionAssessment.isPending}
                        >
                          <ArrowRight className="w-3.5 h-3.5 mr-1" />
                          Start
                        </Button>
                      )}
                      {assessment?.status === "in_progress" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTransition(assessment.id, "complete")}
                            disabled={transitionAssessment.isPending}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleTransition(assessment.id, "failed")}
                            disabled={transitionAssessment.isPending}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Mark Failed
                          </Button>
                        </>
                      )}
                      {assessment?.status === "failed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTransition(assessment.id, "in_progress")}
                          disabled={transitionAssessment.isPending}
                        >
                          <ArrowRight className="w-3.5 h-3.5 mr-1" />
                          Retry
                        </Button>
                      )}
                      {assessment && (
                        <Button size="sm" variant="ghost" className="text-muted-foreground" disabled title="Evidence upload coming soon">
                          <Upload className="w-3.5 h-3.5 mr-1" />
                          Upload Evidence
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
