"use client";

import {
  Printer,
  QrCode,
  FileSpreadsheet,
  FileText,
  FileCheck,
  Leaf,
  Shield,
  Link2,
  Lock,
  PackageSearch,
  Calculator,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCTION_ARTIFACTS_DRAFT_LOCK } from "@/lib/production-artifacts";

interface DownloadsTabProps {
  isDraft: boolean;
  isEU: boolean;
  isIndia: boolean;
  isGlobal: boolean;
  hasCarbonFootprint: boolean;
  onPrintLabels: () => void;
  onDownloadQR: () => void;
  onExportCSV: () => void;
  onExportAuditCSV: () => void;
  onDownloadComplianceReport: () => void;
  onExportComplianceDeclaration: () => void;
  onExportDueDiligence: () => void;
  onExportEPCIS: () => void;
  onExportDVAReport: () => void;
  onExportPLIPacket: () => void;
}

function DownloadCard({
  icon,
  label,
  format,
  description,
  onClick,
  disabled,
  disabledReason,
}: {
  icon: React.ReactNode;
  label: string;
  format: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <div className="bg-background rounded-md hover:shadow-sm transition-shadow p-4 relative"><Button
        variant="outline"
        className="w-full justify-start gap-2 h-auto py-2.5 px-3 text-foreground hover:bg-accent disabled:opacity-50"
        onClick={onClick}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
      >
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-medium truncate">{label}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted-foreground ml-auto shrink-0 uppercase tracking-wider">
          {format}
        </span>
        {disabled && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
      </Button>
      <p className="text-xs text-muted-foreground mt-2">{description}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  );
}

export function DownloadsTab({
  isDraft,
  isEU,
  isIndia,
  isGlobal,
  hasCarbonFootprint,
  onPrintLabels,
  onDownloadQR,
  onExportCSV,
  onExportAuditCSV,
  onDownloadComplianceReport,
  onExportComplianceDeclaration,
  onExportDueDiligence,
  onExportEPCIS,
  onExportDVAReport,
  onExportPLIPacket,
}: DownloadsTabProps) {
  const draftLock = "Activate batch to unlock downloads";
  const qrLabelLock = PRODUCTION_ARTIFACTS_DRAFT_LOCK;

  return (
    <div className="space-y-8">
      {/* Passport Documents */}
      <Section title="Passport Documents">
        <DownloadCard
          icon={<Printer className="h-4 w-4 text-blue-500" />}
          label="Print Labels"
          format="PDF"
          description="Generate printable labels for all passports"
          onClick={onPrintLabels}
          disabled={isDraft}
          disabledReason={qrLabelLock}
        />
        <DownloadCard
          icon={<QrCode className="h-4 w-4 text-emerald-500" />}
          label="QR Codes"
          format="ZIP"
          description="Download all QR codes as a ZIP archive"
          onClick={onDownloadQR}
          disabled={isDraft}
          disabledReason={qrLabelLock}
        />
        <DownloadCard
          icon={<FileSpreadsheet className="h-4 w-4 text-teal-500" />}
          label="Serial List"
          format="CSV"
          description="Export all serial numbers and passport data"
          onClick={onExportCSV}
          disabled={isDraft}
          disabledReason={draftLock}
        />
      </Section>

      {/* Compliance Documents */}
      <Section title="Compliance Documents">
        <DownloadCard
          icon={<FileCheck className="h-4 w-4 text-emerald-500" />}
          label="Compliance Report"
          format="PDF"
          description="Full compliance assessment report"
          onClick={onDownloadComplianceReport}
          disabled={isDraft}
          disabledReason={draftLock}
        />
        {(isEU || isGlobal) && (
          <>
            <DownloadCard
              icon={<Leaf className="h-4 w-4 text-emerald-500" />}
              label="Carbon Declaration"
              format="PDF"
              description="Carbon screening estimate (not a certified Art. 7 declaration)"
              onClick={onExportComplianceDeclaration}
              disabled={isDraft}
              disabledReason={
                isDraft
                  ? draftLock
                  : !hasCarbonFootprint
                    ? "Run Carbon Calculator first"
                    : undefined
              }
            />
            <DownloadCard
              icon={<Shield className="h-4 w-4 text-indigo-500" />}
              label="Due Diligence"
              format="PDF"
              description="Supply chain due diligence report"
              onClick={onExportDueDiligence}
              disabled={isDraft}
              disabledReason={draftLock}
            />
          </>
        )}
      </Section>

      {/* Audit & Traceability */}
      <Section title="Audit & Traceability">
        <DownloadCard
          icon={<FileText className="h-4 w-4 text-amber-500" />}
          label="Audit Log"
          format="CSV"
          description="Full audit trail for this batch"
          onClick={onExportAuditCSV}
        />
        {(isEU || isGlobal) && (
          <DownloadCard
            icon={<PackageSearch className="h-4 w-4 text-blue-500" />}
            label="EPCIS Events"
            format="JSON-LD"
            description="GS1 EPCIS 2.0 traceability document — required by some EU buyers per shipment"
            onClick={onExportEPCIS}
            disabled={isDraft}
            disabledReason={draftLock}
          />
        )}
        {(isIndia || isGlobal) && (
          <>
            <DownloadCard
              icon={<Calculator className="h-4 w-4 text-violet-500" />}
              label="DVA Calculation"
              format="PDF"
              description="CA-ready PLI DVA calculation breakdown and compliance status"
              onClick={onExportDVAReport}
              disabled={isDraft}
              disabledReason={draftLock}
            />
            <DownloadCard
              icon={<Archive className="h-4 w-4 text-amber-500" />}
              label="PLI Claim Packet"
              format="ZIP"
              description="DVA report, compliance report, BIS/PLI certificates and DGFT claim bundled for MHI submission prep"
              onClick={onExportPLIPacket}
              disabled={isDraft}
              disabledReason={draftLock}
            />
          </>
        )}
      </Section>
    </div>
  );
}
