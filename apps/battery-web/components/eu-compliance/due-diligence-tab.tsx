"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSuppliers, useSupplierDDStats } from "@/hooks/use-queries";
import { dashboardPathFromPathname } from "@/lib/routes";
import { ShieldCheck, Wrench, Users } from "lucide-react";

export default function DueDiligenceTab() {
  const pathname = usePathname();
  const dueDiligenceHref = dashboardPathFromPathname(pathname, "due-diligence");
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const { data: stats, isLoading: statsLoading } = useSupplierDDStats();
  const loading = suppliersLoading || statsLoading;

  if (suppliers.length === 0 && !loading) {
    return (
      <div className="border border-border p-12 text-center space-y-3">
        <Users className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No suppliers invited yet.</p>
        <Link href={dueDiligenceHref} className="text-sm text-primary hover:underline">
          Go to Suppliers & DD →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-border p-5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            Total Suppliers
          </div>
          <div className="text-2xl text-foreground">{loading ? "—" : suppliers.length}</div>
        </div>
        <div className="border border-border p-5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5" />
            DD Fully Complete
          </div>
          <div className="text-2xl text-foreground">
            {loading || stats?.suppliersFullyCompletePct === null || stats?.suppliersFullyCompletePct === undefined
              ? "—"
              : `${stats.suppliersFullyCompletePct}%`}
          </div>
          <p className="text-[11px] text-muted-foreground">Suppliers with all 5 OECD steps complete</p>
        </div>
        <div className="border border-border p-5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wrench className="w-3.5 h-3.5" />
            Open Corrective Actions
          </div>
          <div className="text-2xl text-foreground">{loading ? "—" : stats?.openCorrectiveActionsCount ?? 0}</div>
        </div>
      </div>

      <Link
        href={dueDiligenceHref}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <ShieldCheck className="w-4 h-4" />
        Go to Suppliers & DD
      </Link>
    </div>
  );
}
