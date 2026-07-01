"use client";

import { Globe, Shield, User, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Batch } from "@/lib/types";
import { openBatchDocument } from "@/lib/document-url";
import { DashboardPanel } from "../DashboardPanel";

interface MarketComplianceProps {
  batch: Batch;
}

function ComplianceRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-foreground font-medium">{value}</span>
    </div>
  );
}

export function MarketCompliance({ batch }: MarketComplianceProps) {
  const s = batch.specs;
  const markets: { code: string; label: string }[] = [];
  const region = batch.market_region;
  if (region === "INDIA") markets.push({ code: "IN", label: "India (BIS)" });
  if (region === "EU") markets.push({ code: "EU", label: "EU (CE/BattG)" });
  if (region === "GLOBAL") markets.push({ code: "GLOBAL", label: "Global" });

  // Norms from certifications array
  const norms = (s.certifications || []).filter(Boolean);

  // GS1 from optional spec fields
  const gs1: string[] = [];
  const anyS = (s as unknown) as Record<string, unknown>;
  if (anyS.gs1_digital_link_uri) gs1.push("GS1 Digital Link");
  if (anyS.gs1_compliance) gs1.push("GS1 Compliant");
  if (anyS.global_model_number) gs1.push("Global Model Number");

  const isEU = region === "EU";
  const isGlobal = region === "GLOBAL";
  const showEUFeatures = isEU || isGlobal;

  return (
    <DashboardPanel>
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Market & Compliance
        </h3>
      </div>
      <div className="space-y-0">
        <ComplianceRow
          label="Target Markets"
          value={
            markets.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-end">
                {markets.map((m) => (
                  <span
                    key={m.code}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-[10px] uppercase tracking-wider text-muted-foreground border border-border"
                  >
                    <Globe className="h-2.5 w-2.5" />
                    {m.code}
                  </span>
                ))}
              </div>
            ) : (
              "None selected"
            )
          }
        />

        {showEUFeatures && (
          <>
            <ComplianceRow
              label="CE Marking"
              value={
                batch.ce_marking ? (
                  <span className="inline-flex items-center gap-1 text-emerald-500">
                    <CheckCircle className="h-3 w-3" /> Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <XCircle className="h-3 w-3" /> No
                  </span>
                )
              }
            />
            {batch.notified_body_number && (
              <ComplianceRow
                label="Notified Body"
                value={batch.notified_body_number}
              />
            )}
            {batch.carbon_performance_class && (
              <ComplianceRow
                label="Carbon Class"
                value={
                  <span className="font-mono text-xs px-1.5 py-0.5 bg-muted border border-border">
                    {batch.carbon_performance_class}
                  </span>
                }
              />
            )}
            {batch.removable_and_replaceable !== undefined && (
              <ComplianceRow
                label="Removable & Replaceable"
                value={
                  batch.removable_and_replaceable ? (
                    <span className="text-emerald-500">Yes</span>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )
                }
              />
            )}
            {s.eu_representative && (
              <div className="py-2.5 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                  EU Representative
                </span>
                <div className="text-sm text-foreground">
                  <p className="font-medium">{s.eu_representative}</p>
                  {s.eu_representative_email && (
                    <p className="text-xs text-muted-foreground">
                      {s.eu_representative_email}
                    </p>
                  )}
                  {s.eu_representative_address && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.eu_representative_address}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {batch.declaration_of_conformity_path && (
          <ComplianceRow
            label="DoC"
            value={
              <button
                type="button"
                onClick={() =>
                  openBatchDocument(batch.id, "doc").catch(() =>
                    toast.error("Failed to open document — please try again"),
                  )
                }
                className="text-blue-500 hover:underline text-xs"
              >
                View Document
              </button>
            }
          />
        )}

        {norms.length > 0 && (
          <div className="py-2.5 border-b border-border last:border-0">
            <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
              Norms Applied ({norms.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {norms.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-[10px] uppercase tracking-wider text-muted-foreground border border-border"
                >
                  <Shield className="h-2.5 w-2.5" />
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}
        {gs1.length > 0 && (
          <ComplianceRow
            label="GS1"
            value={
              <div className="flex flex-wrap gap-1 justify-end">
                {gs1.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-[10px] uppercase tracking-wider text-muted-foreground border border-border"
                  >
                    {g}
                  </span>
                ))}
              </div>
            }
          />
        )}
      </div>
    </DashboardPanel>
  );
}
