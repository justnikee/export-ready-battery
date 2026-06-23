"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
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


export function ReviewSummary({ formData, onEdit, readiness }: ReviewSummaryProps) {
  const markets =
    formData.primary_market === "both" ? ["india", "eu"] : [formData.primary_market];
  const lowestScore = getLowestScore(readiness, markets);

  const handleGapClick = () => {
    onEdit(3);
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-emerald-500 to-emerald-600 mb-4"
        >
          <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
        </motion.div>
        <h2 className="text-xl text-foreground">You&apos;re all set!</h2>
        <p className="text-muted-foreground mt-1">
          Here&apos;s a summary of your profile
        </p>
      </div>

      {/* Readiness Scorecard */}
      {readiness && (
        <CompliancePreview
          india={readiness.india}
          eu={readiness.eu}
          markets={markets}
          onGapClick={handleGapClick}
        />
      )}

      {/* Skip acknowledgment banner when compliance is incomplete */}
      {lowestScore < 50 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-none border border-amber-500/20 bg-amber-500/10"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-amber-700">
                Your compliance setup is incomplete. You can continue to the dashboard,
                but you won&apos;t be able to create batches until all requirements are met.
              </p>
              <button
                type="button"
                onClick={() => onEdit(3)}
                className="text-sm text-blue-500 hover:underline inline-flex items-center gap-1"
              >
                Go back to compliance setup
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4 bg-transparent border border-border rounded-none p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Company Name</p>
            <p className="text-foreground">{formData.company_name || "-"}</p>
          </div>
          <button
            type="button"
            onClick={() => onEdit(1)}
            className="text-blue-500 text-sm hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="border-t border-border" />
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
            <p className="text-foreground">{formData.address || "-"}</p>
          </div>
        </div>
        <div className="border-t border-border" />
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Support Email</p>
            <p className="text-foreground">{formData.support_email || "-"}</p>
          </div>
        </div>
        {formData.website && (
          <>
            <div className="border-t border-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Website</p>
              <p className="text-foreground">{formData.website}</p>
            </div>
          </>
        )}
        <div className="border-t border-border" />
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Target Market</p>
            <p className="text-foreground capitalize">
              {formData.primary_market === "both"
                ? "EU & India"
                : formData.primary_market.toUpperCase()}
            </p>
          </div>
        </div>
        {formData.epr_registration_number && (
          <>
            <div className="border-t border-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">EPR Number</p>
              <p className="text-foreground">{formData.epr_registration_number}</p>
            </div>
          </>
        )}
        {formData.bis_r_number && (
          <>
            <div className="border-t border-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">BIS R-Number</p>
              <p className="text-foreground">{formData.bis_r_number}</p>
            </div>
          </>
        )}
        {formData.iec_code && (
          <>
            <div className="border-t border-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">IEC Code</p>
              <p className="text-foreground">{formData.iec_code}</p>
            </div>
          </>
        )}
        {formData.eu_authorized_representative_name && (
          <>
            <div className="border-t border-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">EU Representative</p>
              <p className="text-foreground">{formData.eu_authorized_representative_name}</p>
            </div>
          </>
        )}
        {formData.eu_contact_email && (
          <>
            <div className="border-t border-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">EU Contact Email</p>
              <p className="text-foreground">{formData.eu_contact_email}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
