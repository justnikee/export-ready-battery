"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, ShieldCheck, Wrench, ClipboardCheck } from "lucide-react";
import { useSuppliers, useSupplierDDStats, queryKeys, type Supplier } from "@/hooks/use-queries";
import SupplierList from "@/components/due-diligence/supplier-list";
import SupplierDetailPanel from "@/components/due-diligence/supplier-detail-panel";
import CorrectiveActionsDashboard from "@/components/due-diligence/corrective-actions-dashboard";
import { OECDWizardDialog } from "@/components/due-diligence/oecd-wizard-dialog";
import { CMRTUploadDialog } from "@/components/due-diligence/cmrt-upload-dialog";

export default function DueDiligencePage() {
  const queryClient = useQueryClient();
  const { data: suppliers = [], isLoading } = useSuppliers();
  const { data: stats } = useSupplierDDStats();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [ddOpen, setDDOpen] = useState(false);
  const [cmrtOpen, setCmrtOpen] = useState(false);

  const refetchSuppliers = () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers() });

  const openWizard = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDDOpen(true);
  };

  const openCMRT = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setCmrtOpen(true);
  };

  return (
    <div className="min-h-screen bg-sidebar p-6 space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight">Suppliers & Due Diligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Invite upstream suppliers, track OECD due diligence, CMRT reporting, and corrective actions.
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            Total Suppliers
          </div>
          <div className="text-2xl font-medium">{suppliers.length}</div>
        </div>
        <div className="bg-muted p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5" />
            Avg Risk Score
          </div>
          <div className="text-2xl font-medium">{stats?.avgRiskScore ?? "—"}</div>
        </div>
        <div className="bg-muted p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wrench className="w-3.5 h-3.5" />
            Open Corrective Actions
          </div>
          <div className="text-2xl font-medium">{stats?.openCorrectiveActionsCount ?? 0}</div>
        </div>
        <div className="bg-muted p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClipboardCheck className="w-3.5 h-3.5" />
            DD Completion
          </div>
          <div className="text-2xl font-medium">
            {stats?.avgStepCompletionPct !== null && stats?.avgStepCompletionPct !== undefined ? `${stats.avgStepCompletionPct}%` : "—"}
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-280px)] min-h-[480px]">
        <SupplierList
          suppliers={suppliers}
          loading={isLoading}
          selectedId={selectedSupplier?.id ?? null}
          onSelect={setSelectedSupplier}
          onChanged={refetchSuppliers}
        />
        {selectedSupplier ? (
          <SupplierDetailPanel
            supplier={selectedSupplier}
            onOpenWizard={() => openWizard(selectedSupplier)}
            onOpenCMRT={() => openCMRT(selectedSupplier)}
          />
        ) : (
          <div className="rounded-md overflow-y-auto p-4 bg-muted">
            <CorrectiveActionsDashboard />
          </div>
        )}
      </div>

      <OECDWizardDialog
        supplierId={selectedSupplier?.id || ""}
        supplierName={selectedSupplier?.company_name || ""}
        open={ddOpen}
        onOpenChange={setDDOpen}
      />
      <CMRTUploadDialog
        supplierId={selectedSupplier?.id || ""}
        supplierName={selectedSupplier?.company_name || ""}
        open={cmrtOpen}
        onOpenChange={setCmrtOpen}
      />
    </div>
  );
}
