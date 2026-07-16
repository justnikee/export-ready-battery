"use client";

import { Building2, Globe, Mail, MapPin } from "lucide-react";
import { FormField } from "./form-field";
import { InfoBanner } from "./info-banner";

interface StepCompanyProfileProps {
  formData: {
    company_name: string;
    address: string;
    support_email: string;
    website: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export function StepCompanyProfile({ formData, onChange, errors }: StepCompanyProfileProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <InfoBanner variant="info" title="📋 What you'll need for setup">
        <ul style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <li>• Company name and registered address</li>
          <li>• EPR registration number (CPCB portal)</li>
          <li>• BIS R-Number for IS 16046 certification</li>
          <li>• IEC code (if importing battery cells)</li>
        </ul>
      </InfoBanner>

      <FormField
        label={
          <>
            Company Name <span style={{ color: "#f87171" }}>*</span>
          </>
        }
        icon={Building2}
        value={formData.company_name}
        onChange={(v) => onChange("company_name", v)}
        placeholder="Acme Corp"
        error={errors?.company_name}
        required
      />

      <FormField
        label={
          <>
            Manufacturer Address <span style={{ color: "#f87171" }}>*</span>
          </>
        }
        icon={MapPin}
        value={formData.address}
        onChange={(v) => onChange("address", v)}
        placeholder="123 Industrial Park, Energy City, Country"
        helperText="This will appear on all your battery passports"
        multiline
        error={errors?.address}
        required
      />

      <FormField
        label={
          <>
            Support Email <span style={{ color: "#f87171" }}>*</span>
          </>
        }
        icon={Mail}
        type="email"
        value={formData.support_email}
        onChange={(v) => onChange("support_email", v)}
        placeholder="support@company.com"
        error={errors?.support_email}
        required
      />

      <FormField
        label={
          <>
            Website{" "}
            <span style={{ color: "#475569", fontSize: "12px", fontWeight: 400 }}>(optional)</span>
          </>
        }
        icon={Globe}
        type="url"
        value={formData.website}
        onChange={(v) => onChange("website", v)}
        placeholder="https://company.com"
        error={errors?.website}
      />
    </div>
  );
}
