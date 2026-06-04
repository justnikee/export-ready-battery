"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  ExternalLink,
  Leaf,
  Clock,
} from "lucide-react";
import { ComplianceScoreRing } from "../sections/ComplianceScoreRing";
import { CertificateStatus } from "../sections/CertificateStatus";
import { BlockchainAnchors } from "../sections/BlockchainAnchors";
import { CarbonCalculator } from "@/components/batches/carbon-calculator";
import { normalizeGapField } from "../hooks/useBatchDetail";
import api from "@/lib/api";
import { toast } from "sonner";
import type { Batch, ComplianceGap, CertificateAnchor } from "@/lib/types";
import type { CertExpiryResult } from "../types";

interface ComplianceTabProps {
  batch: Batch;
  user?: {
    bis_r_number?: string;
    epr_registration_number?: string;
    iec_code?: string;
  } | null;
  complianceScore: number | null;
  complianceGaps: ComplianceGap[];
  complianceLoading: boolean;
  anchors: CertificateAnchor[];
  anchorsLoading: boolean;
  getCertificateExpiry: (
    dateStr: string | undefined,
    validityMonths: number,
  ) => CertExpiryResult;
  onDownloadComplianceReport: () => void;
  onFetchBatch: () => Promise<void>;
  onSetConfirmCert: (val: { key: string; cert: string } | null) => void;
  patchingKey: string | null;
  isEU: boolean;
  isGlobal: boolean;
}

const inlineFixableFields: Record<
  string,
  | { type: "select"; options: { value: string; label: string }[] }
  | { type: "number" }
  | { type: "text" }
> = {
  "specs.battery_category": {
    type: "select",
    options: [
      { value: "EV", label: "EV" },
      { value: "LMT", label: "LMT" },
      { value: "INDUSTRIAL", label: "Industrial" },
      { value: "PORTABLE", label: "Portable" },
      { value: "SLI", label: "SLI" },
    ],
  },
  "specs.cell_source": {
    type: "select",
    options: [
      { value: "IMPORTED", label: "Imported" },
      { value: "DOMESTIC", label: "Domestic" },
    ],
  },
  "specs.expected_lifetime_cycles": { type: "number" },
  "specs.warranty_months": { type: "number" },
  "specs.bis_number": { type: "text" },
  "specs.epr_number": { type: "text" },
  "specs.recycled_content_pct": { type: "number" },
  "domestic_value_add": { type: "number" },
};

function GapFixRow({
  gap,
  batchId,
  batch,
  onFetchBatch,
  onSetConfirmCert,
}: {
  gap: ComplianceGap;
  batchId: string;
  batch: Batch;
  onFetchBatch: () => Promise<void>;
  onSetConfirmCert: (val: { key: string; cert: string } | null) => void;
}) {
  const normalized = normalizeGapField(gap.field);
  const [inlineValue, setInlineValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inlineDef = inlineFixableFields[normalized];

  const handleSave = async () => {
    if (!inlineValue) return;
    setSaving(true);
    try {
      if (normalized === "domestic_value_add") {
        await api.patch(`/batches/${batchId}`, {
          domestic_value_add: parseFloat(inlineValue),
        });
      } else {
        const specKey = normalized.replace("specs.", "");
        const fragment: Record<string, unknown> = {};
        if (inlineDef?.type === "number") {
          fragment[specKey] = parseFloat(inlineValue);
        } else {
          fragment[specKey] = inlineValue;
        }
        await api.patch(`/batches/${batchId}`, { specs: fragment });
      }
      await onFetchBatch();
      toast.success("Updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (inlineDef) {
    return (
      <div className="flex items-center gap-2 mt-2">
        {inlineDef.type === "select" ? (
          <Select value={inlineValue} onValueChange={setInlineValue}>
            <SelectTrigger className="h-7 text-xs w-40 bg-background border-border">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {inlineDef.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={inlineDef.type === "number" ? "number" : "text"}
            placeholder="Enter value..."
            className="h-7 text-xs w-40 bg-background border-border"
            value={inlineValue}
            onChange={(e) => setInlineValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-border hover:bg-accent"
          disabled={!inlineValue || saving}
          onClick={handleSave}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Save
        </Button>
      </div>
    );
  }

  // Declare AIS certifications
  if (normalized === "specs.certifications: AIS-156") {
    const certs = batch.specs?.certifications || [];
    if (certs.includes("AIS-156")) return null;
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs mt-2 gap-1"
        onClick={() => onSetConfirmCert({ key: gap.field, cert: "AIS-156" })}
      >
        <CheckCircle className="h-3 w-3" />
        Declare AIS-156
      </Button>
    );
  }
  if (normalized === "specs.certifications: AIS-038") {
    const certs = batch.specs?.certifications || [];
    if (certs.includes("AIS-038")) return null;
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs mt-2 gap-1"
        onClick={() => onSetConfirmCert({ key: gap.field, cert: "AIS-038" })}
      >
        <CheckCircle className="h-3 w-3" />
        Declare AIS-038
      </Button>
    );
  }

  return null;
}

function GapSection({
  title,
  gaps,
  color,
  batchId,
  batch,
  onFetchBatch,
  onSetConfirmCert,
}: {
  title: string;
  gaps: ComplianceGap[];
  color: "red" | "amber";
  batchId: string;
  batch: Batch;
  onFetchBatch: () => Promise<void>;
  onSetConfirmCert: (val: { key: string; cert: string } | null) => void;
}) {
  const bgClass =
    color === "red" ? "bg-red-500/5" : "bg-amber-500/5";
  const borderClass =
    color === "red" ? "border-red-500/30" : "border-amber-500/30";
  const iconClass =
    color === "red" ? "text-red-500" : "text-amber-500";

  return (
    <div className="space-y-2">
      <h4
        className={`text-xs font-medium uppercase tracking-wider ${iconClass}`}
      >
        {title} ({gaps.length})
      </h4>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {gaps.map((gap, index) => (
          <div
            key={index}
            className={`flex items-start justify-between gap-3 text-sm p-3 ${bgClass} border ${borderClass}`}
          >
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle
                className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${iconClass}`}
              />
              <div className="min-w-0">
                <span className="font-medium text-foreground">{gap.field}</span>
                <span className="text-muted-foreground ml-1">
                  — {gap.message}
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {gap.regulation}
                </span>
                <GapFixRow
                  gap={gap}
                  batchId={batchId}
                  batch={batch}
                  onFetchBatch={onFetchBatch}
                  onSetConfirmCert={onSetConfirmCert}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface EUAttributeScore {
  score: number;
  filled: number;
  total: number;
  attributes: Array<{
    key: string;
    label: string;
    category: string;
    filled: boolean;
    value?: string | number | boolean;
  }>;
}

export function ComplianceTab({
  batch,
  user,
  complianceScore,
  complianceGaps,
  complianceLoading,
  anchors,
  anchorsLoading,
  getCertificateExpiry,
  onDownloadComplianceReport,
  onFetchBatch,
  onSetConfirmCert,
  isEU,
  isGlobal,
}: ComplianceTabProps) {
  const errors = complianceGaps.filter((g) => g.severity === "ERROR");
  const warnings = complianceGaps.filter((g) => g.severity === "WARNING");
  const [euScore, setEuScore] = useState<EUAttributeScore | null>(null);
  const [euScoreLoading, setEuScoreLoading] = useState(false);

  useEffect(() => {
    if (!batch?.id || (!isEU && !isGlobal)) return;
    setEuScoreLoading(true);
    api.get<EUAttributeScore>(`/batches/${batch.id}/eu-attribute-score`)
      .then((res) => setEuScore(res.data))
      .catch(() => {
        /* EU score is optional — silently fail */
      })
      .finally(() => setEuScoreLoading(false));
  }, [batch?.id, isEU, isGlobal]);

  return (
    <div className="space-y-6">
      {/* Score + Gaps */}
      <div className="border border-border bg-transparent relative">
        <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
        <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
        <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
        <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Compliance Engine
          </h3>
          {complianceScore !== null && (
            <Badge
              className={`ml-auto text-xs ${
                complianceScore >= 80
                  ? errors.length > 0
                    ? "bg-red-500/10 text-red-500 border-red-500/30"
                    : warnings.length > 0
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  : complianceScore >= 50
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : "bg-red-500/10 text-red-500 border-red-500/30"
              }`}
            >
              {complianceScore >= 80
                ? errors.length > 0
                  ? "Issues Found"
                  : warnings.length > 0
                    ? "Passed with Warnings"
                    : "Passed"
                : complianceScore >= 50
                  ? "Partial"
                  : "Failing"}
            </Badge>
          )}
        </div>
        <div className="p-4 space-y-5">
          {complianceLoading ? (
            <div className="h-16 bg-muted rounded animate-pulse" />
          ) : complianceScore !== null ? (
            <>
              <div className="flex items-center justify-center py-4">
            <ComplianceScoreRing score={complianceScore} />
          </div>

              {errors.length > 0 && (
                <GapSection
                  title="Blocking Issues"
                  gaps={errors}
                  color="red"
                  batchId={batch.id}
                  batch={batch}
                  onFetchBatch={onFetchBatch}
                  onSetConfirmCert={onSetConfirmCert}
                />
              )}

              {warnings.length > 0 && (
                <GapSection
                  title="Advisory Warnings"
                  gaps={warnings}
                  color="amber"
                  batchId={batch.id}
                  batch={batch}
                  onFetchBatch={onFetchBatch}
                  onSetConfirmCert={onSetConfirmCert}
                />
              )}

              {errors.length === 0 && warnings.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 p-3 border border-emerald-500/30">
                  <CheckCircle className="h-4 w-4" />
                  All compliance checks passed — no issues found
                </div>
              )}

              <Button
                variant="outline"
                className="w-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                onClick={onDownloadComplianceReport}
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Download Compliance Report (PDF)
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Compliance score will be calculated when the batch is activated.
            </p>
          )}
        </div>
      </div>

      {/* EU Attribute Score */}
      {(isEU || isGlobal) && (
        <div className="border border-border bg-transparent relative">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-blue-500" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              EU Battery Passport Attribute Coverage
            </h3>
            {euScore !== null && (
              <Badge
                className={`ml-auto text-xs ${
                  euScore.score >= 80
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : euScore.score >= 50
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      : "bg-red-500/10 text-red-500 border-red-500/30"
                }`}
              >
                {euScore.score}%
              </Badge>
            )}
          </div>
          <div className="p-4 space-y-4">
            {euScoreLoading ? (
              <p className="text-sm text-muted-foreground">Calculating attribute coverage...</p>
            ) : euScore ? (
              <>
                <div className="flex items-center gap-4">
                  <ComplianceScoreRing score={euScore.score} />
                  <div>
                    <p className="text-sm text-foreground">
                      {euScore.filled} of {euScore.total} attributes filled
                    </p>
                    <p className="text-xs text-muted-foreground">
                      EU Battery Regulation 2023/1542 Art. 56 data requirements
                    </p>
                  </div>
                </div>
                {euScore.attributes && euScore.attributes.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {euScore.attributes.slice(0, 8).map((attr) => (
                      <div
                        key={attr.key}
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 border ${
                          attr.filled
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                            : "bg-muted border-border text-muted-foreground"
                        }`}
                      >
                        {attr.filled ? (
                          <CheckCircle className="h-3 w-3 shrink-0" />
                        ) : (
                          <Clock className="h-3 w-3 shrink-0" />
                        )}
                        <span className="truncate">{attr.label || attr.key}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                EU attribute score unavailable for this batch.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Certificates */}
      <CertificateStatus batch={batch} user={user} getCertificateExpiry={getCertificateExpiry} />

      {/* Blockchain Anchors */}
      <BlockchainAnchors anchors={anchors} anchorsLoading={anchorsLoading} />

      {/* Carbon Calculator */}
      {(isEU || isGlobal) && (
        <div id="carbon-calculator" className="scroll-mt-4">
          <CarbonCalculator
            batchId={batch.id}
            chemistry={batch.specs.chemistry}
            capacity={batch.specs.capacity}
            weight={batch.specs.weight}
            existingResult={batch.carbon_footprint_result as null}
            onResultSaved={onFetchBatch}
          />
        </div>
      )}
    </div>
  );
}
