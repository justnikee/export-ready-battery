/**
 * Activation readiness — the single source of truth for "what's blocking this
 * batch from being activated". Mirrors the backend gate in
 * services/activation_compliance.go (validateActivationWithRegistry).
 *
 * Used by both the batch detail page (against a real Batch record) and the
 * creation wizard's Review step (against a Batch shape mapped from the form),
 * so the readiness a user sees before creating matches what they see after.
 */

export interface ActivationBlockers {
  blocking: string[];
  warnings: string[];
}

/** Tenant/profile fields the activation gate reads. */
export interface ActivationTenantFields {
  epr_registration_number?: string;
  bis_r_number?: string;
  iec_code?: string;
  morth_manufacturer_code?: string;
  company_name?: string;
  address?: string;
  eu_authorized_representative_name?: string;
  eu_authorized_representative_address?: string;
  eu_contact_email?: string;
}

/**
 * Structural subset of a Batch the gate inspects. A real `Batch` record is
 * assignable to this, and the wizard builds one from form data.
 */
export interface ActivationBatchInput {
  model_name?: string;
  market_region?: string;
  manufacturing_start_date?: string | null;
  manufacturing_end_date?: string | null;
  pli_compliant?: boolean;
  domestic_value_add?: number | null;
  carbon_footprint_result?: Record<string, unknown> | null;
  specs?: {
    chemistry?: string;
    capacity?: string;
    cell_source?: string;
    certifications?: string[];
    battery_category?: string;
    bill_of_entry_no?: string;
    country_of_origin?: string;
    customs_date?: string;
    bis_certificate_issue_date?: string;
    un38_3_test_date?: string;
    iec_62133_test_date?: string;
    msds_issue_date?: string;
    // `unknown` so a real Batch's concrete material-composition type is
    // assignable here; accessed via casts below.
    material_composition?: unknown;
    hazardous_substances?: { declaration?: string } | null;
    expected_lifetime_cycles?: number | null;
    warranty_months?: number | null;
  } | null;
}

export function getActivationBlockers(
  batch: ActivationBatchInput,
  user: ActivationTenantFields | null | undefined,
): ActivationBlockers {
  const blocking: string[] = [];
  const warnings: string[] = [];
  const region = batch.market_region;

  // Shared requirements
  if (!batch.model_name?.trim()) blocking.push("model_name");
  if (!batch.manufacturing_start_date) blocking.push("manufacturing_start_date");
  if (!batch.manufacturing_end_date) blocking.push("manufacturing_end_date");

  // Battery-specific requirements
  if (!batch.specs?.chemistry?.trim()) blocking.push("specs.chemistry");
  if (!batch.specs?.capacity?.trim()) blocking.push("specs.capacity");

  if (region === "INDIA" || region === "GLOBAL") {
    if (!batch.specs?.cell_source) blocking.push("cell_source");

    // Legal declaration dates required for India activation (mirrors india.go).
    if (!batch.specs?.bis_certificate_issue_date) blocking.push("specs.bis_certificate_issue_date");
    if (!batch.specs?.un38_3_test_date) blocking.push("specs.un38_3_test_date");
    if (!batch.specs?.iec_62133_test_date) blocking.push("specs.iec_62133_test_date");
    if (!batch.specs?.msds_issue_date) blocking.push("specs.msds_issue_date");

    const certs = batch.specs?.certifications || [];
    if (!certs.includes("AIS-156")) blocking.push("specs.certifications: AIS-156");
    if (!certs.includes("AIS-038")) blocking.push("specs.certifications: AIS-038");

    if (!user?.epr_registration_number?.trim()) blocking.push("tenant.epr_registration_number");
    if (!user?.bis_r_number?.trim()) blocking.push("tenant.bis_r_number");
    if (!user?.iec_code?.trim()) blocking.push("tenant.iec_code");
    if (!user?.morth_manufacturer_code?.trim()) blocking.push("tenant.morth_manufacturer_code");

    if (batch.specs?.cell_source === "IMPORTED") {
      if (!batch.specs?.bill_of_entry_no?.trim()) blocking.push("bill_of_entry_no");
      if (!batch.specs?.country_of_origin?.trim()) blocking.push("country_of_origin");
      if (!batch.specs?.customs_date) blocking.push("customs_date");
    }

    if (batch.specs?.cell_source === "DOMESTIC" && (batch.domestic_value_add ?? 0) <= 0) {
      blocking.push("domestic_value_add");
    }

    if (batch.pli_compliant && (batch.domestic_value_add ?? 0) < 50) {
      warnings.push(`PLI requires >=50% DVA (current: ${batch.domestic_value_add ?? 0}%)`);
    }
  }

  if (region === "EU" || region === "GLOBAL") {
    const validCategories = ["EV", "LMT", "INDUSTRIAL", "PORTABLE", "SLI"];
    if (!batch.specs?.battery_category || !validCategories.includes(batch.specs.battery_category)) {
      blocking.push("specs.battery_category");
    }

    if (!user?.company_name?.trim()) blocking.push("tenant.company_name");
    if (!user?.address?.trim()) blocking.push("tenant.address");
    if (!user?.eu_authorized_representative_name?.trim()) {
      blocking.push("tenant.eu_authorized_representative_name");
    }
    if (!user?.eu_authorized_representative_address?.trim()) {
      blocking.push("tenant.eu_authorized_representative_address");
    }
    if (!user?.eu_contact_email?.trim()) {
      blocking.push("tenant.eu_contact_email");
    }

    if (!batch.carbon_footprint_result || Object.keys(batch.carbon_footprint_result).length === 0) {
      blocking.push("carbon_footprint_result");
    }

    const materialComposition = batch.specs?.material_composition as
      | Record<string, unknown>
      | null
      | undefined;
    if (
      !materialComposition ||
      !Object.values(materialComposition).some((value) =>
        typeof value === "number" ? value > 0 : parseFloat(String(value)) > 0,
      )
    ) {
      blocking.push("specs.material_composition");
    }

    if (!batch.specs?.hazardous_substances?.declaration?.trim()) {
      blocking.push("specs.hazardous_substances.declaration");
    }

    if (!batch.specs?.expected_lifetime_cycles || batch.specs.expected_lifetime_cycles <= 0) {
      blocking.push("specs.expected_lifetime_cycles");
    }

    if (!batch.specs?.warranty_months || batch.specs.warranty_months <= 0) {
      blocking.push("specs.warranty_months");
    }

    const recycledKeys = ["recycled_cobalt", "recycled_lithium", "recycled_nickel", "recycled_lead"] as const;
    for (const key of recycledKeys) {
      const baseKey = key.replace("recycled_", "");
      if (materialComposition && typeof materialComposition === "object" && baseKey in materialComposition) {
        const mc = materialComposition as Record<string, unknown>;
        const baseVal = parseFloat(String(mc[baseKey])) || 0;
        const recycledVal = parseFloat(String(mc[key])) || 0;
        if (baseVal > 0 && recycledVal === 0) {
          warnings.push(`Recycled ${baseKey} content not declared (required from Aug 2028)`);
        }
      }
    }
  }

  return { blocking, warnings };
}

/** Human-readable label for an activation blocker key. */
export function formatBlockerLabel(key: string): string {
  const map: Record<string, string> = {
    model_name: "Model name",
    "specs.chemistry": "Battery chemistry",
    "specs.capacity": "Rated capacity",
    "specs.manufacturer": "Manufacturer",
    "specs.country_of_origin": "Country of origin",
    manufacturing_start_date: "Manufacturing start date",
    manufacturing_end_date: "Manufacturing end date",
    cell_source: "Cell source (IMPORTED/DOMESTIC)",
    "specs.certifications: AIS-156": "AIS-156 certification",
    "specs.certifications: AIS-038": "AIS-038 certification",
    "tenant.epr_registration_number": "EPR registration (Settings -> Compliance)",
    "tenant.bis_r_number": "BIS R-number (Settings -> Compliance)",
    "tenant.iec_code": "IEC code (Settings -> Compliance)",
    "tenant.morth_manufacturer_code": "MoRTH code (Settings -> Compliance)",
    bill_of_entry_no: "Bill of entry number",
    country_of_origin: "Cell country of origin",
    customs_date: "Import date",
    domestic_value_add: "Domestic value-add percentage",
    "specs.battery_category": "EU battery category",
    "tenant.company_name": "Company name (Settings -> Profile)",
    "tenant.address": "Company address (Settings -> Profile)",
    "tenant.eu_authorized_representative_name": "EU representative name (Settings -> Compliance)",
    "tenant.eu_authorized_representative_address": "EU representative address (Settings -> Compliance)",
    "tenant.eu_contact_email": "EU contact email (Settings -> Compliance)",
    carbon_footprint_result: "Carbon footprint (use Carbon Calculator tab)",
    "specs.material_composition": "Material composition (at least one non-zero %)",
    "specs.hazardous_substances.declaration": "Hazardous substances declaration",
    "specs.expected_lifetime_cycles": "Expected lifetime cycles",
    "specs.warranty_months": "Warranty months",
    "specs.bis_certificate_issue_date": "BIS certificate issue date",
    "specs.un38_3_test_date": "UN 38.3 test date",
    "specs.iec_62133_test_date": "IEC 62133 test date",
    "specs.msds_issue_date": "MSDS issue date",
    "tenant.epr_certificate": "EPR certificate upload (Settings -> Compliance)",
    "tenant.bis_certificate": "BIS certificate upload (Settings -> Compliance)",
    "tenant.pli_certificate": "PLI certificate upload (Settings -> Compliance)",
  };
  return (
    map[key] ||
    key.replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

export function normalizeGapField(field: string): string {
  return field
    .replace(/^batch\./, "")
    .replace(/^specs\./, "specs.")
    .replace(/\[(.*?)\]/, ": $1");
}

/** True when a blocker is a tenant/profile field (fixed in Settings, not the batch). */
export function isProfileBlocker(key: string): boolean {
  return normalizeGapField(key).startsWith("tenant.");
}

/** Minimal shape of a backend compliance gap (subset of ComplianceGap). */
export interface ComplianceGapLike {
  field: string;
  message: string;
  severity: string;
}

/**
 * Merge the lightweight client-side heuristic with the authoritative backend
 * compliance gaps. Additive and deduplicated: gap fields are normalized into the
 * heuristic key space (so e.g. `batch.specs.certifications[AIS-156]` lines up
 * with the heuristic's `specs.certifications: AIS-156`). This guarantees the
 * activation checklist never *understates* what the backend gate will enforce —
 * the original bug, where the heuristic omitted cert dates, tenant certificate
 * uploads, etc., and the UI said "ready" while activation was rejected.
 */
export function mergeActivationBlockers(
  heuristic: ActivationBlockers,
  gaps: ComplianceGapLike[] | null | undefined,
): ActivationBlockers {
  const list = gaps ?? [];
  const gapBlocking = list
    .filter((g) => g.severity === "ERROR")
    .map((g) => normalizeGapField(g.field));
  const gapWarnings = list.filter((g) => g.severity === "WARNING").map((g) => g.message);
  return {
    blocking: Array.from(new Set([...heuristic.blocking, ...gapBlocking])),
    warnings: Array.from(new Set([...heuristic.warnings, ...gapWarnings])),
  };
}
