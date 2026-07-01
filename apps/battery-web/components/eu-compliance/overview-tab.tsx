"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useEuActiveBatches } from "@/hooks/use-queries";
import { dashboardPathFromPathname } from "@/lib/routes";
import { CheckCircle2, AlertTriangle, XCircle, Globe, FileCheck, Loader2 } from "lucide-react";

interface ComplianceGap {
  field: string;
  message: string;
  severity: string;
}

interface MarketReadiness {
  score: number;
  valid: boolean;
  gaps?: ComplianceGap[];
}

export default function OverviewTab() {
  const { user } = useAuth();
  const pathname = usePathname();
  const settingsHref = dashboardPathFromPathname(pathname, "settings?tab=eu-compliance");
  const [readiness, setReadiness] = useState<MarketReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: euBatches = [] } = useEuActiveBatches();

  useEffect(() => {
    api
      .post("/auth/readiness", { primary_market: "eu" })
      .then((res) => setReadiness(res.data?.eu ?? null))
      .catch(() => setReadiness(null))
      .finally(() => setLoading(false));
  }, []);

  const repName = user?.eu_authorized_representative_name?.trim();
  const repAddress = user?.eu_authorized_representative_address?.trim();
  const repEmail = user?.eu_contact_email?.trim();
  const repComplete = !!repName && !!repAddress && !!repEmail;

  const docCount = euBatches.filter((b) => b.declaration_of_conformity_path?.trim()).length;

  return (
    <div className="space-y-6">
      {/* Readiness score */}
      <div className="border border-border p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking EU readiness...
          </div>
        ) : readiness ? (
          <>
            <div className="flex items-center gap-6 mb-2">
              <div
                className={`text-4xl ${
                  readiness.score >= 80 ? "text-emerald-500" : readiness.score >= 50 ? "text-amber-500" : "text-red-500"
                }`}
              >
                {Math.round(readiness.score)}%
              </div>
              <div>
                <p className="text-foreground font-medium">EU Compliance Readiness</p>
                <p className="text-sm text-muted-foreground">
                  {readiness.valid ? "All tenant-level EU requirements are met" : `${readiness.gaps?.length ?? 0} gap(s) found`}
                </p>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-3 mt-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  readiness.score >= 80 ? "bg-emerald-500" : readiness.score >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${readiness.score}%` }}
              />
            </div>
            {readiness.gaps && readiness.gaps.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {readiness.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {g.message}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Could not load EU readiness score.</p>
        )}
      </div>

      {/* EU Authorized Representative */}
      <div className="border border-border">
        <div className="border-b border-border px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-100">
            <Globe className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-foreground">EU Authorized Representative</h3>
            <p className="text-xs text-muted-foreground">Required for EU Battery Passport compliance (Art. 12)</p>
          </div>
          {repComplete ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-400" />
          )}
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Name</p>
            <p className={repName ? "text-foreground" : "text-muted-foreground"}>{repName || "Not configured"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Address</p>
            <p className={repAddress ? "text-foreground" : "text-muted-foreground"}>{repAddress || "Not configured"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Contact Email</p>
            <p className={repEmail ? "text-foreground" : "text-muted-foreground"}>{repEmail || "Not configured"}</p>
          </div>
        </div>
        {!repComplete && (
          <div className="px-6 pb-5">
            <Link href={settingsHref} className="text-xs text-primary hover:underline">
              Complete in Settings → EU Compliance
            </Link>
          </div>
        )}
      </div>

      {/* Declaration of Conformity */}
      <div className="border border-border p-6">
        <div className="flex items-center gap-3 mb-1">
          <FileCheck className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-medium text-foreground">Declaration of Conformity</h3>
        </div>
        {euBatches.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">No active EU/GLOBAL batches yet.</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            {docCount} of {euBatches.length} active EU/GLOBAL batches have a Declaration of Conformity uploaded.
          </p>
        )}
      </div>
    </div>
  );
}
