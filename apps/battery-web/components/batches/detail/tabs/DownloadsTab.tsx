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
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadsTabProps {
  isDraft: boolean;
  isEU: boolean;
  isGlobal: boolean;
  hasCarbonFootprint: boolean;
  onPrintLabels: () => void;
  onDownloadQR: () => void;
  onExportCSV: () => void;
  onExportAuditCSV: () => void;
  onDownloadComplianceReport: () => void;
  onExportComplianceDeclaration: () => void;
  onExportDueDiligence: () => void;
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
    <div className="border border-border bg-transparent hover:border-foreground/30 transition-colors p-4 relative"><Button
        variant="outline"
        className="w-full justify-start gap-2 h-auto py-2.5 px-3 border-border text-foreground hover:bg-muted disabled:opacity-50"
        onClick={onClick}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
      >
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-medium truncate">{label}</span>
        <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground ml-auto shrink-0 uppercase tracking-wider">
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
  isGlobal,
  hasCarbonFootprint,
  onPrintLabels,
  onDownloadQR,
  onExportCSV,
  onExportAuditCSV,
  onDownloadComplianceReport,
  onExportComplianceDeclaration,
  onExportDueDiligence,
}: DownloadsTabProps) {
  const draftLock = "Activate batch to unlock downloads";

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
          disabledReason={draftLock}
        />
        <DownloadCard
          icon={<QrCode className="h-4 w-4 text-emerald-500" />}
          label="QR Codes"
          format="ZIP"
          description="Download all QR codes as a ZIP archive"
          onClick={onDownloadQR}
          disabled={isDraft}
          disabledReason={draftLock}
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
              description="Carbon footprint compliance declaration"
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
      </Section>
    </div>
  );
}
