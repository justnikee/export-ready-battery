"use client";

import { FileCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Batch } from "@/lib/types";
import type { CertExpiryResult } from "../types";
import { DashboardPanel } from "../DashboardPanel";

interface CertificateStatusProps {
  batch: Batch;
  user?: {
    bis_r_number?: string;
    epr_registration_number?: string;
    iec_code?: string;
  } | null;
  getCertificateExpiry: (
    dateStr: string | undefined,
    validityMonths: number,
  ) => CertExpiryResult;
}

function CertCard({
  title,
  result,
  issueDate,
  orgValue,
  orgLabel,
}: {
  title: string;
  result: CertExpiryResult;
  issueDate?: string;
  orgValue?: string;
  orgLabel?: string;
}) {
  const { status, daysRemaining } = result;

  const statusConfig = {
    valid: {
      bg: "bg-emerald-500/5",
      badge: "bg-emerald-500/10 text-emerald-500",
      label: daysRemaining ? `${daysRemaining}d left` : "Valid",
    },
    warning: {
      bg: "bg-amber-500/5",
      badge: "bg-amber-500/10 text-amber-500",
      label: daysRemaining ? `${daysRemaining}d left` : "Expiring soon",
    },
    expired: {
      bg: "bg-red-500/5",
      badge: "bg-red-500/10 text-red-500",
      label: "Expired",
    },
    unset: {
      bg: "bg-muted",
      badge: "bg-muted text-muted-foreground",
      label: "Not uploaded",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`p-3 rounded-md ${config.bg} flex items-center justify-between gap-3`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {title}
        </p>
        {issueDate && status !== "unset" ? (
          <p className="text-xs text-muted-foreground">
            Issued {issueDate}
          </p>
        ) : orgValue ? (
          <p className="text-xs text-emerald-500">
            {orgLabel}: {orgValue}
          </p>
        ) : null}
      </div>
      <Badge variant="outline" className={`shrink-0 text-xs ${config.badge}`}>
        {status === "warning" && <AlertTriangle className="h-3 w-3 mr-1" />}
        {status === "valid" && <FileCheck className="h-3 w-3 mr-1" />}
        {config.label}
      </Badge>
    </div>
  );
}

export function CertificateStatus({
  batch,
  user,
  getCertificateExpiry,
}: CertificateStatusProps) {
  const s = batch.specs;

  const certs = [
    {
      title: "BIS IS 16046",
      date: s.bis_certificate_issue_date,
      months: 24,
      orgValue: user?.bis_r_number,
      orgLabel: "BIS R-No",
    },
    {
      title: "UN38.3",
      date: s.un38_3_test_date,
      months: 24,
    },
    {
      title: "IEC 62133",
      date: s.iec_62133_test_date,
      months: 36,
    },
    {
      title: "MSDS",
      date: s.msds_issue_date,
      months: 36,
    },
    {
      title: "EPR Registration",
      date: undefined,
      months: 0,
      orgValue: user?.epr_registration_number,
      orgLabel: "EPR",
    },
    {
      title: "IEC Code",
      date: undefined,
      months: 0,
      orgValue: user?.iec_code,
      orgLabel: "IEC",
    },
  ];

  const hasAny = certs.some((c) => c.date || c.orgValue);

  if (!hasAny) {
    return (
      <DashboardPanel>
        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Certificates
          </h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          No certificates uploaded yet
        </p>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel>
      <div className="flex items-center gap-2 mb-4">
        <FileCheck className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Certificate Tracker
        </h3>
      </div>
      <div className="space-y-2">
        {certs.map((cert) => {
          const hasDate = !!cert.date;
          const hasOrg = !!cert.orgValue;
          if (!hasDate && !hasOrg) return null;

          const result = hasDate
            ? getCertificateExpiry(cert.date, cert.months)
            : hasOrg
              ? { status: "valid" as const, expiryDate: null, daysRemaining: null }
              : { status: "unset" as const, expiryDate: null, daysRemaining: null };

          return (
            <CertCard
              key={cert.title}
              title={cert.title}
              result={result}
              issueDate={cert.date}
              orgValue={cert.orgValue}
              orgLabel={cert.orgLabel}
            />
          );
        })}
      </div>
    </DashboardPanel>
  );
}
