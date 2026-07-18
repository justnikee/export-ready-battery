"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, ArrowRight, Pencil } from "lucide-react";
import { CompliancePreview } from "./compliance-preview";
import type { ReadinessResult } from "@/hooks/use-onboarding-readiness";

interface ReviewSummaryProps {
  formData: {
    company_name: string;
    address: string;
    support_email: string;
    website?: string;
    logo_url?: string;
    primary_market: string;
    epr_registration_number?: string;
    bis_r_number?: string;
    iec_code?: string;
    eu_authorized_representative_name?: string;
    eu_contact_email?: string;
  };
  onEdit: (step: number) => void;
  readiness: ReadinessResult | null;
}

function getLowestScore(readiness: ReadinessResult | null, markets: string[]): number {
  if (!readiness) return 0;
  const scores: number[] = [];
  if (markets.includes("india") && readiness.india) scores.push(readiness.india.score);
  if (markets.includes("eu") && readiness.eu) scores.push(readiness.eu.score);
  return scores.length > 0 ? Math.min(...scores) : 0;
}

interface ReviewRowProps {
  label: string;
  value: string;
  onEdit?: () => void;
}

function ReviewRow({ label, value, onEdit }: ReviewRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
          {label}
        </p>
        <p style={{ fontSize: "13px", color: "#cbd5e1", wordBreak: "break-word" }}>{value || "—"}</p>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "#10b981",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 0",
            flexShrink: 0,
          }}
        >
          <Pencil style={{ width: 11, height: 11 }} />
          Edit
        </button>
      )}
    </div>
  );
}

export function ReviewSummary({ formData, onEdit, readiness }: ReviewSummaryProps) {
  const markets =
    formData.primary_market === "both" ? ["india", "eu"] : [formData.primary_market];
  const lowestScore = getLowestScore(readiness, markets);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", paddingTop: "8px" }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981, #059669)",
            marginBottom: "12px",
            boxShadow: "0 0 30px rgba(16,185,129,0.25)",
          }}
        >
          <CheckCircle2 style={{ width: "32px", height: "32px", color: "#fff" }} />
        </motion.div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#f1f5f9", marginBottom: "4px" }}>
          You&apos;re all set!
        </h2>
        <p style={{ fontSize: "13px", color: "#475569" }}>Here&apos;s a summary of your profile</p>
      </div>

      {/* Readiness Scorecard */}
      {readiness && (
        <CompliancePreview
          india={readiness.india}
          eu={readiness.eu}
          markets={markets}
          onGapClick={(gap) => {
            const field = gap.field || "";
            if (
              field.startsWith("tenant.epr_") ||
              field.startsWith("tenant.bis_") ||
              field.startsWith("tenant.iec_") ||
              field.startsWith("tenant.morth_") ||
              field.startsWith("tenant.eu_")
            ) {
              onEdit(3);
            } else {
              onEdit(1);
            }
          }}
        />
      )}

      {/* Compliance warning */}
      {lowestScore < 50 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: "14px 16px",
            borderRadius: "10px",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <AlertTriangle style={{ width: "16px", height: "16px", color: "#f59e0b", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "12px", color: "#fcd34d", lineHeight: 1.6, marginBottom: "8px" }}>
                Your compliance setup is incomplete. You can continue to the dashboard, but you
                won&apos;t be able to create batches until all requirements are met.
              </p>
              <button
                type="button"
                onClick={() => onEdit(3)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "#10b981",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Go back to compliance setup
                <ArrowRight style={{ width: "12px", height: "12px" }} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Profile summary */}
      <div
        style={{
          borderRadius: "10px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "4px 16px",
        }}
      >
        <ReviewRow label="Company Name" value={formData.company_name} onEdit={() => onEdit(1)} />
        <ReviewRow label="Address" value={formData.address} />
        <ReviewRow label="Support Email" value={formData.support_email} />
        {formData.website && <ReviewRow label="Website" value={formData.website} />}
        <ReviewRow
          label="Target Market"
          value={
            formData.primary_market === "both"
              ? "EU & India"
              : formData.primary_market.toUpperCase()
          }
          onEdit={() => onEdit(2)}
        />
        {formData.epr_registration_number && (
          <ReviewRow label="EPR Number" value={formData.epr_registration_number} />
        )}
        {formData.bis_r_number && (
          <ReviewRow label="BIS R-Number" value={formData.bis_r_number} />
        )}
        {formData.iec_code && (
          <ReviewRow label="IEC Code" value={formData.iec_code} />
        )}
        {formData.eu_authorized_representative_name && (
          <ReviewRow label="EU Representative" value={formData.eu_authorized_representative_name} />
        )}
        {formData.eu_contact_email && (
          <ReviewRow label="EU Contact Email" value={formData.eu_contact_email} />
        )}
      </div>
    </div>
  );
}
