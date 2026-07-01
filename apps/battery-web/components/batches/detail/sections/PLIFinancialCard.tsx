"use client";

import { IndianRupee, TrendingUp, FileCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Batch } from "@/lib/types";
import { openBatchDocument } from "@/lib/document-url";
import { DashboardPanel } from "../DashboardPanel";

interface PLIFinancialCardProps {
  batch: Batch;
}

function FinancialRow({
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

export function PLIFinancialCard({ batch }: PLIFinancialCardProps) {
  const s = batch.specs;

  const hasFinancialData =
    s.sale_price_inr !== undefined ||
    s.import_cost_inr !== undefined ||
    batch.domestic_value_add > 0 ||
    s.audited_domestic_value_add !== undefined ||
    s.pli_certificate_url;

  if (!hasFinancialData) {
    return (
      <DashboardPanel>
        <div className="flex items-center gap-2 mb-4">
          <IndianRupee className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            PLI & Financial
          </h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          No financial data recorded
        </p>
      </DashboardPanel>
    );
  }

  const dva = batch.domestic_value_add;
  const auditedDva = s.audited_domestic_value_add;
  const dvaSource = s.dva_source;

  return (
    <DashboardPanel>
      <div className="flex items-center gap-2 mb-4">
        <IndianRupee className="h-4 w-4 text-amber-500" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          PLI & Financial
        </h3>
      </div>
      <div className="space-y-0">
        {s.sale_price_inr !== undefined && (
          <FinancialRow
            label="Sale Price"
            value={
              <span className="font-mono text-sm">
                ₹{s.sale_price_inr.toLocaleString()}
              </span>
            }
          />
        )}
        {s.import_cost_inr !== undefined && (
          <FinancialRow
            label="Import Cost"
            value={
              <span className="font-mono text-sm">
                ₹{s.import_cost_inr.toLocaleString()}
              </span>
            }
          />
        )}

        <FinancialRow
          label="Domestic Value Add"
          value={
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-sm ${
                  dva >= 50 ? "text-emerald-500" : "text-amber-500"
                }`}
              >
                {dva}%
              </span>
              {dva >= 50 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 uppercase">
                  PLI Eligible
                </span>
              )}
            </div>
          }
        />

        {auditedDva !== undefined && (
          <FinancialRow
            label="Audited DVA"
            value={
              <span className="font-mono text-sm">{auditedDva}%</span>
            }
          />
        )}

        {dvaSource && (
          <FinancialRow
            label="DVA Source"
            value={
              <span className="text-xs text-muted-foreground uppercase">
                {dvaSource}
              </span>
            }
          />
        )}

        {s.bill_of_entry_no && (
          <FinancialRow label="Bill of Entry" value={s.bill_of_entry_no} />
        )}
        {s.customs_date && (
          <FinancialRow label="Customs Date" value={s.customs_date} />
        )}

        {s.pli_certificate_url && (
          <div className="py-2.5 border-b border-border last:border-0">
            <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
              PLI Certificate
            </span>
            <button
              type="button"
              onClick={() =>
                openBatchDocument(batch.id, "pli").catch(() =>
                  toast.error("Failed to open certificate — please try again"),
                )
              }
              className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400"
            >
              <FileCheck className="h-3.5 w-3.5" />
              View Certificate
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
