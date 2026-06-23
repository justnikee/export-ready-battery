"use client";

import type { Batch, CertificateAnchor } from "@/lib/types";
import type { CertExpiryResult, MarketRegion, ActivationBlockers } from "../types";
import { QuickStats } from "../sections/QuickStats";
import { CoreSpecs } from "../sections/CoreSpecs";
import { MarketCompliance } from "../sections/MarketCompliance";
import { CertificateStatus } from "../sections/CertificateStatus";
import { MaterialComposition } from "../sections/MaterialComposition";
import { SustainabilityCard } from "../sections/SustainabilityCard";
import { PLIFinancialCard } from "../sections/PLIFinancialCard";

interface OverviewTabProps {
  batch: Batch;
  user?: unknown;
  passportCount?: number;
  complianceScore?: number | null;
  activationResult?: ActivationBlockers | null;
  region?: MarketRegion;
  getCertificateExpiry: (
    dateStr: string | undefined,
    validityMonths: number,
  ) => CertExpiryResult;
  getAnchorForCertType?: (type: string) => CertificateAnchor | undefined;
  handleAnchorCertificate?: (type: string, fileUrl: string) => Promise<void>;
  anchoringCert?: string | null;
}

export function OverviewTab({
  batch,
  user,
  passportCount = 0,
  getCertificateExpiry,
}: OverviewTabProps) {
  const userCerts = user as {
    bis_r_number?: string;
    epr_registration_number?: string;
    iec_code?: string;
  } | undefined;

  const s = batch.specs;
  const isIndia = batch.market_region === "INDIA";
  const hasFinancialData =
    s.sale_price_inr !== undefined ||
    s.import_cost_inr !== undefined ||
    batch.domestic_value_add > 0 ||
    s.audited_domestic_value_add !== undefined ||
    s.pli_certificate_url;

  return (
    <div className="space-y-4">
      <QuickStats batch={batch} passportCount={passportCount} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CoreSpecs batch={batch} />
        <MarketCompliance batch={batch} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CertificateStatus
          batch={batch}
          user={userCerts}
          getCertificateExpiry={getCertificateExpiry}
        />
        <MaterialComposition batch={batch} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SustainabilityCard batch={batch} />
        {(isIndia || hasFinancialData) && <PLIFinancialCard batch={batch} />}
      </div>
    </div>
  );
}
