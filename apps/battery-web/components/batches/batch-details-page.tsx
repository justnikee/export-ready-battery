"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { DownloadLabelsDialog } from "@/components/batches/DownloadLabelsDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BatchDetailSkeleton } from "@/components/batches/BatchDetailSkeleton";
import { clsx } from "clsx";

import { useBatchDetail } from "./detail/hooks/useBatchDetail";
import { BatchHeader } from "./detail/BatchHeader";
import { BatchStatusCard } from "./detail/BatchStatusCard";
import { BatchActions } from "./detail/BatchActions";
import { SaveAsTemplateDialog } from "./detail/SaveAsTemplateDialog";
import { ActivationChecklist } from "./detail/ActivationChecklist";
import { OverviewTab } from "./detail/tabs/OverviewTab";
import { PassportsTab } from "./detail/tabs/PassportsTab";
import { ComplianceTab } from "./detail/tabs/ComplianceTab";
import { DownloadsTab } from "./detail/tabs/DownloadsTab";
import { ComponentsTab } from "./detail/tabs/ComponentsTab";
import { RegistryVerificationsTab } from "./detail/tabs/RegistryVerificationsTab";
import type { MarketRegion } from "./detail/types";

type LegacyTab = "overview" | "passports" | "compliance" | "downloads" | "components" | "registry";

export default function BatchDetailsPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // ── New hook: all data, state, and handlers ──
  const detail = useBatchDetail(params.id as string, pathname);

  // Destructure for compatibility with existing JSX
  const {
    batch,
    passports,
    passportCount,
    loading,
    pagination,
    labelsDialogOpen,
    setLabelsDialogOpen,
    confirmArchive,
    setConfirmArchive,
    confirmDelete,
    setConfirmDelete,
    confirmCert,
    setConfirmCert,
    complianceScore,
    complianceGaps,
    complianceLoading,
    anchors,
    anchorsLoading,
    activating,
    archiving,
    deletingDraft,
    patchingKey,
    anchoringCert,
    scrollTarget,
    setScrollTarget,
    batchesHref,
    settingsHref,
    settingsComplianceHref,
    billingHref,
    exportsHref,
    isDraft,
    activationResult,
    region,
    isIndia,
    isEU,
    isGlobal,
    fetchBatch,
    fetchPassports,
    fetchAnchors,
    fetchCompliance,
    handleUploadComplete,
    handlePageChange,
    handleDownloadQR,
    handleDownloadLabels,
    handleExportCSV,
    handleExportAuditCSV,
    handleExportDueDiligence,
    handleExportComplianceDeclaration,
    handleExportEPCIS,
    handleExportDVAReport,
    handleExportPLIPacket,
    handleDownloadComplianceReport,
    handleActivateBatch,
    handleArchiveBatch,
    handleDeleteDraft,
    handlePatchSpec,
    handleAnchorCertificate,
    getCertificateExpiry,
    getAnchorForCertType,
    verifications,
    verificationsLoading,
    fetchVerifications,
  } = detail;

  // Tab state stays local for now
  const [activeTab, setActiveTab] = useState<LegacyTab>("overview");
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  // Keyboard shortcuts for tab navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            setActiveTab("overview");
            break;
          case "2":
            e.preventDefault();
            setActiveTab("passports");
            break;
          case "3":
            e.preventDefault();
            setActiveTab("compliance");
            break;
          case "4":
            e.preventDefault();
            setActiveTab("downloads");
            break;
          case "5":
            e.preventDefault();
            setActiveTab("components");
            break;
          case "6":
            e.preventDefault();
            setActiveTab("registry");
            break;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (loading) return <BatchDetailSkeleton />;
  if (!batch) {
    return <div className="p-8 text-muted-foreground">Batch not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto space-y-6">
        {/* ── NEW HEADER ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <BatchHeader
              batch={batch}
              passportCount={passportCount}
              isDraft={isDraft}
              activationResult={activationResult}
              activating={activating}
              deletingDraft={deletingDraft}
              batchesHref={batchesHref}
              onActivate={handleActivateBatch}
              onDeleteDraft={() => setConfirmDelete(true)}
              onPrintLabels={() => setLabelsDialogOpen(true)}
              onArchive={() => setConfirmArchive(true)}
            />
          </div>
          <div className="shrink-0 pt-1">
            <BatchActions
              batch={batch}
              isDraft={isDraft}
              onPrintLabels={() => setLabelsDialogOpen(true)}
              onDownloadQR={handleDownloadQR}
              onExportCSV={handleExportCSV}
              onExportAuditCSV={handleExportAuditCSV}
              onDownloadComplianceReport={handleDownloadComplianceReport}
              onExportComplianceDeclaration={handleExportComplianceDeclaration}
              onExportDueDiligence={handleExportDueDiligence}
              onExportEPCIS={handleExportEPCIS}
              onExportDVAReport={handleExportDVAReport}
              onExportPLIPacket={handleExportPLIPacket}
              onArchive={() => setConfirmArchive(true)}
              onDeleteDraft={() => setConfirmDelete(true)}
              onSaveAsTemplate={() => setSaveTemplateOpen(true)}
            />
          </div>
        </div>

        {/* ── STATUS: lifecycle stage + next action + export-readiness signals ── */}
        <BatchStatusCard
          batch={batch}
          activationBlockerCount={activationResult.blocking.length}
          passportCount={passportCount}
          complianceScore={complianceScore}
          region={region}
          verifications={verifications}
          user={user}
        />

        {/* ── ACTIVATION CHECKLIST ── */}
        {isDraft && (
          <ActivationChecklist
            batch={batch}
            activationResult={activationResult}
            complianceGaps={complianceGaps}
            onNavigate={(tab, target) => {
              const tabMap: Record<string, LegacyTab> = {
                overview: "overview",
                passports: "passports",
                compliance: "compliance",
                downloads: "downloads",
                components: "components",
              };
              setActiveTab(tabMap[tab] || "overview");
              if (target) setScrollTarget(target);
            }}
            onSettingsCompliance={() => router.push(settingsComplianceHref)}
            onSettingsProfile={() => router.push(settingsHref)}
          />
        )}

        {/* ── TABS ── */}
        <div className="relative bg-transparent border border-border">
          <div className="flex border-b border-border px-4">
            {[
              { id: "overview", label: "Overview" },
              { id: "passports", label: `Passports (${passportCount})` },
              { id: "compliance", label: "Compliance" },
              { id: "downloads", label: "Downloads" },
              { id: "components", label: "Components" },
              { id: "registry", label: "Registry" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LegacyTab)}
                className={clsx(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === tab.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === "overview" && (
              <OverviewTab
                batch={batch}
                user={user}
                passportCount={passportCount}
                complianceScore={complianceScore}
                activationResult={activationResult}
                region={region}
                getCertificateExpiry={getCertificateExpiry}
                getAnchorForCertType={getAnchorForCertType}
                handleAnchorCertificate={handleAnchorCertificate}
                anchoringCert={anchoringCert}
              />
            )}

            {activeTab === "passports" && (
              <PassportsTab
                batchId={batch.id}
                passports={passports}
                passportCount={passportCount}
                pagination={pagination}
                region={region}
                chemistry={batch.specs?.chemistry}
                morthCode={user?.morth_manufacturer_code}
                isDraft={isDraft}
                onPageChange={handlePageChange}
                onUploadComplete={handleUploadComplete}
              />
            )}

            {activeTab === "compliance" && (
              <ComplianceTab
                batch={batch}
                user={user}
                complianceScore={complianceScore}
                complianceGaps={complianceGaps}
                complianceLoading={complianceLoading}
                anchors={anchors}
                anchorsLoading={anchorsLoading}
                getCertificateExpiry={getCertificateExpiry}
                onDownloadComplianceReport={handleDownloadComplianceReport}
                onFetchBatch={fetchBatch}
                onSetConfirmCert={setConfirmCert}
                patchingKey={patchingKey}
                isEU={isEU}
                isGlobal={isGlobal}
              />
            )}

            {activeTab === "downloads" && (
              <DownloadsTab
                isDraft={isDraft}
                isEU={isEU}
                isIndia={isIndia}
                isGlobal={isGlobal}
                hasCarbonFootprint={
                  !!batch.carbon_footprint_result &&
                  Object.keys(batch.carbon_footprint_result).length > 0
                }
                onPrintLabels={() => setLabelsDialogOpen(true)}
                onDownloadQR={handleDownloadQR}
                onExportCSV={handleExportCSV}
                onExportAuditCSV={handleExportAuditCSV}
                onDownloadComplianceReport={handleDownloadComplianceReport}
                onExportComplianceDeclaration={handleExportComplianceDeclaration}
                onExportDueDiligence={handleExportDueDiligence}
                onExportEPCIS={handleExportEPCIS}
                onExportDVAReport={handleExportDVAReport}
                onExportPLIPacket={handleExportPLIPacket}
              />
            )}

            {activeTab === "components" && (
              <ComponentsTab batchId={batch.id} isDraft={isDraft} />
            )}

            {activeTab === "registry" && (
              <RegistryVerificationsTab
                batchId={batch.id}
                verifications={verifications}
                verificationsLoading={verificationsLoading}
                onRefresh={fetchVerifications}
              />
            )}
          </div>
        </div>

        <DownloadLabelsDialog
          open={labelsDialogOpen}
          onOpenChange={setLabelsDialogOpen}
          batchName={batch?.batch_name || ""}
          passportCount={passportCount}
          onDownload={handleDownloadLabels}
          productType={batch?.product_type}
        />

        <SaveAsTemplateDialog
          open={saveTemplateOpen}
          onOpenChange={setSaveTemplateOpen}
          batch={batch}
        />

        <ConfirmDialog
          open={!!confirmCert}
          onOpenChange={(open) => {
            if (!open) setConfirmCert(null);
          }}
          title={`Declare ${confirmCert?.cert} Certification?`}
          description={`By confirming, you self-declare that this ${"batch"} has passed ${confirmCert?.cert} testing and you hold the relevant certificate. You remain legally responsible for compliance accuracy.`}
          confirmText={`Yes, I hold ${confirmCert?.cert}`}
          variant="default"
          onConfirm={() => {
            if (!confirmCert || !batch) return;
            const currentCerts: string[] = batch.specs?.certifications || [];
            handlePatchSpec(confirmCert.key, {
              certifications: [...currentCerts, confirmCert.cert],
            });
            setConfirmCert(null);
          }}
        />
        <ConfirmDialog
          open={confirmArchive}
          onOpenChange={setConfirmArchive}
          title={`Archive this ${"batch"}?`}
          description={`This is permanent and cannot be undone. Archived ${"batches"} remain available for audit and compliance purposes but can no longer generate new passports or be reactivated.`}
          confirmText={`Archive ${"Batch"}`}
          variant="default"
          onConfirm={handleArchiveBatch}
        />
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete this draft ${"batch"}?`}
          description={`This action cannot be undone. Only draft ${"batches"} with no passports can be deleted.`}
          confirmText="Delete Draft"
          variant="destructive"
          onConfirm={handleDeleteDraft}
        />
      </div>
    </div>
  );
}
