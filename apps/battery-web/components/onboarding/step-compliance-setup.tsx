"use client";

import { Globe, Shield, FileCheck, Building2, Mail, MapPin, Hash } from "lucide-react";
import { DocumentUpload } from "@/components/shared/document-upload";
import { FormField } from "./form-field";
import { InfoBanner } from "./info-banner";
import { CompliancePreview } from "./compliance-preview";
import type { ReadinessResult } from "@/hooks/use-onboarding-readiness";

interface StepComplianceSetupProps {
  formData: {
    primary_market: string;
    epr_registration_number: string;
    bis_r_number: string;
    iec_code: string;
    eu_authorized_representative_name: string;
    eu_authorized_representative_address: string;
    eu_contact_email: string;
    morth_manufacturer_code: string;
  };
  onChange: (field: string, value: string) => void;
  onUploadSuccess: () => void;
  certificateStatuses: {
    epr?: string;
    bis?: string;
    pli?: string;
  };
  readiness?: ReadinessResult | null;
  errors?: Record<string, string>;
}

export function StepComplianceSetup({
  formData,
  onChange,
  onUploadSuccess,
  certificateStatuses,
  readiness,
  errors,
}: StepComplianceSetupProps) {
  const hasIndia = formData.primary_market === "india" || formData.primary_market === "both";
  const hasEU = formData.primary_market === "eu" || formData.primary_market === "both";

  const isComplete = () => {
    const indiaComplete =
      !!formData.epr_registration_number.trim() &&
      !!formData.bis_r_number.trim() &&
      !!formData.iec_code.trim() &&
      !!formData.morth_manufacturer_code.trim();
    const euComplete =
      !!formData.eu_authorized_representative_name.trim() &&
      !!formData.eu_contact_email.trim() &&
      !!formData.eu_authorized_representative_address.trim();
    if (hasIndia && hasEU) return indiaComplete && euComplete;
    if (hasIndia) return indiaComplete;
    if (hasEU) return euComplete;
    return true;
  };

  return (
    <div className="space-y-6">
      {isComplete() ? (
        <InfoBanner variant="success">
          Compliance details look good. You can still edit them later in Settings.
        </InfoBanner>
      ) : (
        <InfoBanner variant="warning">
          Recommended for batch activation. You can skip now and add these later in Settings, but
          batch publishing may be blocked until they are verified.
        </InfoBanner>
      )}

      {readiness && (
        <CompliancePreview
          india={readiness.india}
          eu={readiness.eu}
          markets={[
            ...(hasIndia ? ["india"] : []),
            ...(hasEU ? ["eu"] : []),
          ]}
        />
      )}

      {hasIndia && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="text-sm text-emerald-500 uppercase tracking-wider">
            🇮🇳 India Compliance (Recommended for activation)
          </h3>
          <FormField
            label={
              <>
                EPR Registration Number{" "}
                <span className="text-xs text-amber-500 font-normal">Recommended</span>
              </>
            }
            icon={FileCheck}
            value={formData.epr_registration_number}
            onChange={(v) => onChange("epr_registration_number", v)}
            placeholder="EPR-XXXX-XXXX"
            helperText="CPCB Extended Producer Responsibility"
            error={errors?.epr_registration_number}
          />
          <DocumentUpload
            label="EPR"
            documentType="epr"
            currentStatus={certificateStatuses.epr}
            onUploadSuccess={onUploadSuccess}
          />
          <FormField
            label={
              <>
                BIS-R Number{" "}
                <span className="text-xs text-amber-400 font-normal">Recommended</span>
              </>
            }
            icon={Shield}
            value={formData.bis_r_number}
            onChange={(v) => onChange("bis_r_number", v)}
            placeholder="R-XXXXX"
            helperText="BIS CRS registration (IS 16046)"
            error={errors?.bis_r_number}
          />
          <DocumentUpload
            label="BIS"
            documentType="bis"
            currentStatus={certificateStatuses.bis}
            onUploadSuccess={onUploadSuccess}
          />
          <FormField
            label="IEC Code"
            icon={Globe}
            value={formData.iec_code}
            onChange={(v) => onChange("iec_code", v)}
            placeholder="XXXXXXXXXX"
            helperText="Import Export Code for importers"
            error={errors?.iec_code}
          />
          <DocumentUpload
            label="PLI"
            documentType="pli"
            currentStatus={certificateStatuses.pli}
            onUploadSuccess={onUploadSuccess}
          />
          <FormField
            label="MoRTH Manufacturer Code"
            icon={Hash}
            value={formData.morth_manufacturer_code}
            onChange={(v) => onChange("morth_manufacturer_code", v.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="NKY"
            helperText="3-character MoRTH-registered code for BPAN serial numbers"
            error={errors?.morth_manufacturer_code}
          />
        </div>
      )}

      {hasEU && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="text-sm text-blue-400 uppercase tracking-wider">
            🇪🇺 EU Compliance (Recommended for activation)
          </h3>
          <FormField
            label="EU Authorized Representative Name"
            icon={Building2}
            value={formData.eu_authorized_representative_name}
            onChange={(v) => onChange("eu_authorized_representative_name", v)}
            placeholder="EU Rep GmbH"
            error={errors?.eu_authorized_representative_name}
          />
          <FormField
            label="EU Contact Email"
            icon={Mail}
            type="email"
            value={formData.eu_contact_email}
            onChange={(v) => onChange("eu_contact_email", v)}
            placeholder="compliance@eurep.eu"
            error={errors?.eu_contact_email}
          />
          <FormField
            label="EU Authorized Representative Address"
            icon={MapPin}
            value={formData.eu_authorized_representative_address}
            onChange={(v) => onChange("eu_authorized_representative_address", v)}
            placeholder="Street, City, Country"
            error={errors?.eu_authorized_representative_address}
          />
        </div>
      )}
    </div>
  );
}
