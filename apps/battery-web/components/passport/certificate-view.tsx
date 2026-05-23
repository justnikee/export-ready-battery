"use client";

import {
  Battery,
  Zap,
  FlaskConical,
  Calendar,
  Shield,
  Barcode,
  Globe,
  AlertTriangle,
  Recycle,
  FileText,
  Download,
  Truck,
  MapPin,
  Mail,
  Wrench,
  Replace,
} from "lucide-react";
import { createTranslator, type Locale } from "@/lib/i18n/i18n";
import { resolvePassportTemplateConfig } from "@/lib/passport-template-config";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
}

function DataRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-border last:border-0 gap-4">
      <span className="text-muted-foreground text-sm whitespace-nowrap">
        {label}
      </span>
      <span
        className={`text-foreground text-sm text-right ${mono ? "font-mono" : ""}`}
      >
        {value ?? <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  );
}

function SoHGauge({ soh }: { soh: number }) {
  const clampedSoh = Math.max(0, Math.min(100, soh));
  const thresholdPct = 80;
  const color =
    clampedSoh >= thresholdPct
      ? "text-emerald-500"
      : clampedSoh >= 60
        ? "text-amber-500"
        : "text-red-500";
  const bgColor =
    clampedSoh >= thresholdPct
      ? "bg-emerald-500/100"
      : clampedSoh >= 60
        ? "bg-amber-500/100"
        : "bg-red-500/100";
  const label =
    clampedSoh >= thresholdPct
      ? "Healthy"
      : clampedSoh >= 60
        ? "Degraded"
        : "Critical";

  return (
    <div className="flex items-center gap-4 p-3 bg-background rounded-lg">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground font-medium">
            State of Health
          </span>
          <span className={`text-sm ${color}`}>{clampedSoh.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 relative">
          <div
            className={`h-2.5 rounded-full ${bgColor} transition-all duration-500`}
            style={{ width: `${clampedSoh}%` }}
          />
          {/* 80% threshold marker */}
          <div
            className="absolute top-0 h-2.5 w-0.5 bg-muted-foreground"
            style={{ left: `${thresholdPct}%` }}
            title="80% second-life threshold"
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">0%</span>
          <span className={`text-[10px] ${color} font-medium`}>{label}</span>
          <span className="text-[10px] text-muted-foreground">100%</span>
        </div>
      </div>
    </div>
  );
}

// ─── types ───────────────────────────────────────────────────────────────────

export interface PassportViewData {
  passport: {
    uuid: string;
    serial_number?: string;
    manufacture_date?: string;
    created_at?: string;
    status?: string;
    state_of_health?: number | null;
    last_soh_update_timestamp?: string | null;
    ownership_history?: Array<{
      timestamp: string;
      from_owner: string;
      to_owner: string;
    }> | null;
    repair_events?: Array<{ timestamp: string; description: string }> | null;
    replacement_events?: Array<{
      timestamp: string;
      description: string;
    }> | null;
    recycling_date?: string | null;
    recycling_status?: string | null;
    recycler_epr_id?: string | null;
    current_owner_identifier?: string | null;
  };
  specs: {
    chemistry?: string;
    // Field names match backend PublicSpecsView JSON keys exactly
    battery_category?: string;
    capacity?: string;
    voltage?: string;
    weight?: string;
    carbon_footprint?: string;
    material_profile?: string;
    lot_size?: string;
    production_stage?: string;
    expected_lifetime_cycles?: number | null;
    warranty_months?: number | null;
    bis_number?: string;
    epr_number?: string;
    hazardous_substances?: {
      declaration?: string;
      lead_present?: boolean;
      mercury_present?: boolean;
      cadmium_present?: boolean;
      exemptions?: string;
    } | null;
    material_composition?: {
      cobalt_pct?: number;
      lithium_pct?: number;
      nickel_pct?: number;
      graphite_pct?: number;
      manganese_pct?: number;
      lead_pct?: number;
      recycled_cobalt_pct?: number;
      recycled_lithium_pct?: number;
      recycled_nickel_pct?: number;
      recycled_lead_pct?: number;
    } | null;
    certifications?: string[];
    gsm?: number;
    dye_process?: string;
    finish_type?: string[];
    water_usage_liters?: number;
    energy_usage_kwh?: number;
    biodegradable_pct?: number | null;
    expected_lifetime_washes?: number | null;
    recycled_content_pct?: number | null;
    fiber_composition?: {
      cotton_pct?: number;
      polyester_pct?: number;
      wool_pct?: number;
      silk_pct?: number;
      linen_pct?: number;
      viscose_pct?: number;
      nylon_pct?: number;
      acrylic_pct?: number;
      hemp_pct?: number;
      other_pct?: number;
    } | null;
    supplier_tier?: {
      fiber_supplier?: string;
      spinning_mill?: string;
      weaving_knitting_mill?: string;
      dye_house?: string;
      finishing_facility?: string;
      cut_sew_facility?: string;
    } | null;
    labor_compliance?: {
      sa8000_certified?: boolean;
      bsci_audited?: boolean;
      sedex_member?: boolean;
      fair_trade_certified?: boolean;
      audit_score?: number;
      audit_date?: string;
    } | null;
    chemical_compliance_zdhc?: {
      zdhc_level?: string;
      mrsl_tested?: boolean;
      test_report_url?: string;
      restricted_substances_found?: string[];
    } | null;
  } | null;
  tenant: {
    company_name?: string;
    manufacturer_name?: string;
    // Backend sends 'address', not 'manufacturer_address'
    address?: string;
    manufacturer_address?: string;
    // Backend sends 'support_email', not 'manufacturer_email'
    support_email?: string;
    manufacturer_email?: string;
    textile_facility_type?: string;
    textile_supply_chain_tier?: string;
    epr_registration_number?: string;
    bis_r_number?: string;
    bis_certificate_path?: string;
    epr_certificate_path?: string;
    pli_certificate_path?: string;
    certifications?: string[];
    // Backend sends these names
    eu_authorized_representative_name?: string;
    eu_authorized_representative_address?: string;
    eu_contact_email?: string;
    // Legacy aliases
    eu_representative_name?: string;
    eu_representative_address?: string;
    eu_representative_email?: string;
  } | null;
  batch_name?: string;
  model_name?: string;
  manufacturing_start_date?: string;
  manufacturing_end_date?: string;
  market_region?: string;
  domestic_value_add?: number | null;
  cell_source?: string;
  pli_compliant?: boolean;
  hsn_code?: string;
  bill_of_entry_no?: string;
  country_of_origin?: string;
  customs_date?: string;
  product_type?: string;
  template_variant?: string;
}

interface CertificateViewProps {
  passport: PassportViewData;
  locale?: Locale;
}

// ─── component ───────────────────────────────────────────────────────────────

export function CertificateView({
  passport: passportData,
  locale = "en",
}: CertificateViewProps) {
  const t = createTranslator(locale);

  const passport = passportData.passport;
  const specs = passportData.specs;
  const tenant =
    passportData.tenant || ({} as NonNullable<PassportViewData["tenant"]>);

  // Derived values
  const bpan = passport.serial_number || t("label_missing");
  const model =
    passportData.model_name || tenant.company_name || t("label_missing");
  const serialNumber = passport.serial_number || t("label_missing");
  const chemistry = specs?.chemistry || null;
  const batteryCategory = specs?.battery_category || null;
  const capacityAh = specs?.capacity || null;
  const voltage = specs?.voltage || null;
  const weightKg = specs?.weight || null;
  const materialProfile = specs?.material_profile || null;
  const lotSize = specs?.lot_size || null;
  const productionStage = specs?.production_stage || null;
  const cycleLife = specs?.expected_lifetime_cycles || null;
  const warrantyMonths = specs?.warranty_months || null;
  const hazardousSubs = specs?.hazardous_substances?.declaration || null;
  const carbonFootprint = specs?.carbon_footprint || null;
  const eprNumber = specs?.epr_number || tenant.epr_registration_number || null;
  const bisRNumber = specs?.bis_number || tenant.bis_r_number || null;
  const certifications = tenant.certifications || specs?.certifications || [];
  const cellSource = passportData.cell_source || null;
  const marketRegion = passportData.market_region || null;
  const dvaPercent = passportData.domestic_value_add;
  const pliCompliant = passportData.pli_compliant;
  const hsnCode = passportData.hsn_code || null;
  const billOfEntryNo = passportData.bill_of_entry_no || null;
  const countryOfOrigin = passportData.country_of_origin || null;
  const customsDate = passportData.customs_date
    ? new Date(passportData.customs_date)
    : null;
  const manufactureDate = passport.manufacture_date
    ? new Date(passport.manufacture_date)
    : null;
  const startDate = passportData.manufacturing_start_date
    ? new Date(passportData.manufacturing_start_date)
    : null;
  const endDate = passportData.manufacturing_end_date
    ? new Date(passportData.manufacturing_end_date)
    : null;
  const manufacturerName =
    tenant.manufacturer_name || tenant.company_name || null;
  // Backend uses 'address' and 'support_email' — fall back to legacy aliases for forward compat
  const manufacturerAddress =
    tenant.address || tenant.manufacturer_address || null;
  const manufacturerEmail =
    tenant.support_email || tenant.manufacturer_email || null;
  const recyclingDate = passport.recycling_date
    ? new Date(passport.recycling_date)
    : null;

  // Textile derived values
  const gsm = specs?.gsm || null;
  const dyeProcess = specs?.dye_process || null;
  const finishType = specs?.finish_type || [];
  const waterUsage = specs?.water_usage_liters || null;
  const energyUsage = specs?.energy_usage_kwh || null;
  const biodegradablePct = specs?.biodegradable_pct || null;
  const expectedLifetimeWashes = specs?.expected_lifetime_washes || null;
  const recycledContentPct = specs?.recycled_content_pct || null;
  const fiberComposition = specs?.fiber_composition;
  const supplierTier = specs?.supplier_tier;
  const laborCompliance = specs?.labor_compliance;
  const chemicalCompliance = specs?.chemical_compliance_zdhc;

  // EU Representative — backend uses eu_authorized_representative_name / eu_contact_email
  const euRepresentativeName =
    tenant.eu_authorized_representative_name ||
    tenant.eu_representative_name ||
    null;
  const euRepresentativeAddress =
    tenant.eu_authorized_representative_address ||
    tenant.eu_representative_address ||
    null;
  const euRepresentativeEmail =
    tenant.eu_contact_email || tenant.eu_representative_email || null;
  const showEURepresentative =
    euRepresentativeName || euRepresentativeAddress || euRepresentativeEmail;

  // Critical raw materials
  const crm = specs?.material_composition;

  // Status with static Tailwind class mappings.
  // The API sends uppercase lifecycle states such as SHIPPED and IN_SERVICE.
  const normalizedStatus = (passport.status || "CREATED").trim().toLowerCase();
  const statusConfig: Record<string, { label: string; color: string }> = {
    created: { label: t("status_created"), color: "slate" },
    active: { label: t("status_active"), color: "emerald" },
    shipped: { label: "Shipped", color: "amber" },
    in_service: { label: "In Service", color: "emerald" },
    recalled: { label: t("status_recalled"), color: "amber" },
    recycled: { label: t("status_recycled"), color: "purple" },
    end_of_life: { label: t("status_eol"), color: "red" },
    eol: { label: t("status_eol"), color: "red" },
  };

  // Static Tailwind class map to avoid dynamic string interpolation
  const statusStyleMap: Record<string, { container: string; dot: string }> = {
    slate: {
      container:
        "bg-muted-foreground/20 text-muted-foreground border-border/30",
      dot: "bg-muted-foreground",
    },
    emerald: {
      container: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      dot: "bg-emerald-400",
    },
    amber: {
      container: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      dot: "bg-amber-400",
    },
    purple: {
      container: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      dot: "bg-purple-400",
    },
    red: {
      container: "bg-red-500/20 text-red-400 border-red-500/30",
      dot: "bg-red-400",
    },
  };

  const currentStatus = statusConfig[normalizedStatus] || statusConfig.created;
  const currentStatusStyles =
    statusStyleMap[currentStatus.color] || statusStyleMap.slate;

  // Market
  const isIndia = marketRegion?.toUpperCase() === "INDIA";
  const isImported = cellSource?.toUpperCase() === "IMPORTED";
  const productType = passportData.product_type ||
    (passportData.template_variant?.toUpperCase().startsWith("TEXTILE") ? "TEXTILE" : "BATTERY");
  const templateConfig = resolvePassportTemplateConfig({
    templateVariant: passportData.template_variant,
    productType,
    marketRegion,
    t,
  });
  const templateVariant = templateConfig.variant;
  const isBattery = templateConfig.family === "battery";
  const productBadge = templateConfig.badge;
  const primaryDescriptor = isBattery ? chemistry : materialProfile;
  const isBatteryIndia = templateConfig.complianceMode === "battery_india";
  const isBatteryStandard =
    templateConfig.complianceMode === "battery_standard";

  // SoH
  const soh = passport.state_of_health;
  const stateOfHealthLabel = soh != null ? `${soh}%` : null;
  const lastSohUpdate = passport.last_soh_update_timestamp
    ? new Date(passport.last_soh_update_timestamp)
    : null;
  const lastSohUpdateLabel = lastSohUpdate
    ? lastSohUpdate.toLocaleDateString("en-GB")
    : null;

  // Ownership counts
  const ownershipCount = passport.ownership_history?.length ?? 0;
  const repairCount = passport.repair_events?.length ?? 0;
  const replacementCount = passport.replacement_events?.length ?? 0;

  // Cell-source label
  const cellSourceLabel = cellSource
    ? cellSource.toUpperCase() === "IMPORTED"
      ? t("cell_source_imported")
      : t("cell_source_domestic")
    : null;

  return (
    <div className="divide-y divide-border">
      {/* ═══════════════════════════════════════════════════════════════════
 BPAN HEADER
 ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-[#171717] via-[#262626] to-[#171717] text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-emerald-400 text-xs tracking-wider uppercase mb-1">
              {isBattery ? t("bpan_label") : t("label_serial")}
            </p>
            <h1 className="text-2xl md:text-3xl font-mono tracking-tight">
              {bpan}
            </h1>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${currentStatusStyles.container} border`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${currentStatusStyles.dot}`}
            />
            {currentStatus.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-emerald-400 text-xs font-medium">
            {productBadge} {productType}
          </span>
          <span className="flex items-center gap-1.5">
            <Barcode className="w-4 h-4" /> {model}
          </span>
          {primaryDescriptor && (
            <span className="flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4" /> {primaryDescriptor}
            </span>
          )}
          {templateConfig.showCapacityBadge && capacityAh && (
            <span className="flex items-center gap-1.5">
              <Battery className="w-4 h-4" /> {capacityAh}
            </span>
          )}
          {templateConfig.showLotBadge && lotSize && (
            <span className="flex items-center gap-1.5">
              <Battery className="w-4 h-4" /> {lotSize}
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-muted-foreground text-xs">{t("bpan_badge")}</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
 PRODUCT IDENTITY + SPECS
 ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        <div className="p-6 md:p-8">
          <h3 className="text-foreground mb-4 flex items-center gap-2">
            <Barcode className="w-4 h-4 text-muted-foreground" />
            {t("section_product")}
          </h3>

          <div className="space-y-0">
            <DataRow label={t("label_model")} value={model} />
            <DataRow label={t("label_serial")} value={serialNumber} mono />
            <DataRow
              label={t("label_manufactured")}
              value={
                manufactureDate
                  ? manufactureDate.toLocaleDateString("en-GB")
                  : null
              }
            />
            {isBattery ? (
              <DataRow label={t("label_cell_source")} value={cellSourceLabel} />
            ) : (
              <DataRow label="Production Stage" value={productionStage} />
            )}
            <DataRow label={t("label_market")} value={marketRegion || null} />
            {!isBattery && (
              <DataRow label="Country of Origin" value={countryOfOrigin} />
            )}
          </div>

          {/* Batch Window */}
          {startDate && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">
                {t("label_batch_window")}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground font-mono text-xs">
                  {startDate.toLocaleDateString("en-GB")}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="text-foreground font-mono text-xs">
                  {endDate
                    ? endDate.toLocaleDateString("en-GB")
                    : t("label_ongoing")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Technical Specifications */}
        <div className="p-6 md:p-8">
          <h3 className="text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            {t("section_specs")}
          </h3>

          <div className="space-y-0">
            {isBattery ? (
              <>
                <DataRow label={t("label_chemistry")} value={chemistry} />
                {batteryCategory && (
                  <DataRow
                    label={t("label_battery_category")}
                    value={batteryCategory}
                  />
                )}
                <DataRow label={t("label_capacity")} value={capacityAh} />
                <DataRow label={t("label_voltage")} value={voltage} />
                <DataRow label={t("label_weight")} value={weightKg} />
              </>
            ) : (
              <>
                <DataRow label="Material Profile" value={materialProfile} />
                <DataRow label="Lot Size" value={lotSize} />
                <DataRow label="Production Stage" value={productionStage} />
                <DataRow label={t("label_weight")} value={weightKg} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
 CRITICAL RAW MATERIALS
 ═══════════════════════════════════════════════════════════════════ */}
      {templateConfig.showCrm && crm && (
        <div className="p-6 md:p-8">
          <h3 className="text-foreground mb-4 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-muted-foreground" />
            {t("section_materials")}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              {
                key: "label_cobalt",
                pct: crm.cobalt_pct,
                recycled: crm.recycled_cobalt_pct,
              },
              {
                key: "label_lithium",
                pct: crm.lithium_pct,
                recycled: crm.recycled_lithium_pct,
              },
              {
                key: "label_nickel",
                pct: crm.nickel_pct,
                recycled: crm.recycled_nickel_pct,
              },
              { key: "label_graphite", pct: crm.graphite_pct },
              { key: "label_manganese", pct: crm.manganese_pct },
              {
                key: "label_lead",
                pct: crm.lead_pct,
                recycled: crm.recycled_lead_pct,
              },
            ]
              .filter((m) => m.pct != null && m.pct > 0)
              .map((m) => (
                <div
                  key={m.key}
                  className="bg-background rounded-lg p-3 border border-border"
                >
                  <p className="text-muted-foreground text-xs mb-1">
                    {t(m.key)}
                  </p>
                  <p className="text-foreground ">{m.pct}%</p>
                  {m.recycled != null && m.recycled > 0 && (
                    <p className="text-emerald-500 text-xs mt-0.5">
                      ♻ {m.recycled}% {t("label_recycled_content")}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
 REGULATORY COMPLIANCE
 ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        <div className="p-6 md:p-8">
          <h3 className="text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            {t("section_compliance")}
          </h3>

          <div className="space-y-0">
            {isBatteryIndia && (
              <DataRow label={t("label_epr")} value={eprNumber} mono />
            )}
            {isBatteryIndia && dvaPercent != null && (
              <DataRow
                label={t("label_dva")}
                value={`${(dvaPercent as number).toFixed(1)}%`}
              />
            )}
            {isBatteryIndia && (
              <DataRow
                label={t("label_pli")}
                value={pliCompliant ? "✅ Yes" : "No"}
              />
            )}
            {isBatteryIndia && (
              <DataRow label={t("label_bis")} value={bisRNumber} mono />
            )}
            {isBatteryStandard && (
              <DataRow
                label={t("label_carbon_footprint")}
                value={carbonFootprint}
              />
            )}
            {productType === "TEXTILE" && carbonFootprint && (
              <DataRow
                label="Carbon Footprint"
                value={`${carbonFootprint} kgCO2e/kg`}
              />
            )}
            {isBatteryStandard && (
              <DataRow label={t("label_hazardous")} value={hazardousSubs} />
            )}
            {isBatteryStandard && (
              <DataRow
                label={t("label_warranty")}
                value={
                  warrantyMonths
                    ? t("label_months", { count: warrantyMonths })
                    : null
                }
              />
            )}
            {isBatteryStandard && (
              <DataRow
                label={t("label_lifetime")}
                value={
                  cycleLife ? t("label_cycles", { count: cycleLife }) : null
                }
              />
            )}
            {templateConfig.showTextileCompliance && (
              <>
                {fiberComposition && (
                  <div className="py-2 border-b border-border">
                    <span className="text-muted-foreground text-sm block mb-2">
                      Fiber Composition
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Cotton", pct: fiberComposition.cotton_pct },
                        { label: "Polyester", pct: fiberComposition.polyester_pct },
                        { label: "Wool", pct: fiberComposition.wool_pct },
                        { label: "Silk", pct: fiberComposition.silk_pct },
                        { label: "Linen", pct: fiberComposition.linen_pct },
                        { label: "Viscose", pct: fiberComposition.viscose_pct },
                        { label: "Nylon", pct: fiberComposition.nylon_pct },
                        { label: "Acrylic", pct: fiberComposition.acrylic_pct },
                        { label: "Hemp", pct: fiberComposition.hemp_pct },
                        { label: "Other", pct: fiberComposition.other_pct },
                      ]
                        .filter((f) => f.pct != null && f.pct > 0)
                        .map((f) => {
                          const pct = f.pct ?? 0;
                          return (
                            <div key={f.label} className="flex items-center gap-2">
                              <span className="text-foreground text-xs w-16 shrink-0">
                                {f.label}
                              </span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-cyan-500 rounded-full"
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                              <span className="text-foreground text-xs w-8 text-right">
                                {pct}%
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                <DataRow label="GSM" value={gsm} />
                <DataRow
                  label="Dye Process & Finish"
                  value={
                    dyeProcess || finishType.length > 0
                      ? [dyeProcess, finishType.join(", ")].filter(Boolean).join(" | ")
                      : null
                  }
                />
                <DataRow
                  label="Water Usage"
                  value={waterUsage != null ? `${waterUsage} L` : null}
                />
                <DataRow
                  label="Energy Usage"
                  value={energyUsage != null ? `${energyUsage} kWh` : null}
                />
                <DataRow
                  label="Biodegradable"
                  value={biodegradablePct != null ? `${biodegradablePct}%` : null}
                />
                <DataRow
                  label="Expected Lifetime"
                  value={
                    expectedLifetimeWashes != null
                      ? `${expectedLifetimeWashes} washes`
                      : null
                  }
                />
                <DataRow
                  label="Recycled Content"
                  value={recycledContentPct != null ? `${recycledContentPct}%` : null}
                />
                <DataRow label="Material Profile" value={materialProfile} />
                <DataRow label="Country of Origin" value={countryOfOrigin} />
                <DataRow label="Hazardous Substances" value={hazardousSubs} />
                <DataRow
                  label="Certifications"
                  value={certifications.join(", ") || null}
                />
              </>
            )}
            {supplierTier && (
              <div className="pt-3 border-t border-border">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">
                  Supplier Tier
                </p>
                <div className="space-y-0">
                  <DataRow label="Fiber Supplier" value={supplierTier.fiber_supplier} />
                  <DataRow label="Spinning Mill" value={supplierTier.spinning_mill} />
                  <DataRow
                    label="Weaving / Knitting Mill"
                    value={supplierTier.weaving_knitting_mill}
                  />
                  <DataRow label="Dye House" value={supplierTier.dye_house} />
                  <DataRow
                    label="Finishing Facility"
                    value={supplierTier.finishing_facility}
                  />
                  <DataRow
                    label="Cut & Sew Facility"
                    value={supplierTier.cut_sew_facility}
                  />
                </div>
              </div>
            )}
            {laborCompliance && (
              <div className="pt-3 border-t border-border">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">
                  Labor Compliance
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    { label: "SA8000", active: laborCompliance.sa8000_certified },
                    { label: "BSCI", active: laborCompliance.bsci_audited },
                    { label: "SEDEX", active: laborCompliance.sedex_member },
                    { label: "Fair Trade", active: laborCompliance.fair_trade_certified },
                  ].map((cert) => (
                    <span
                      key={cert.label}
                      className={`px-2 py-0.5 rounded text-xs border ${
                        cert.active
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {cert.label}
                    </span>
                  ))}
                </div>
                <div className="space-y-0">
                  <DataRow
                    label="Audit Score"
                    value={laborCompliance.audit_score ?? null}
                  />
                  <DataRow label="Audit Date" value={laborCompliance.audit_date || null} />
                </div>
              </div>
            )}
            {chemicalCompliance && (
              <div className="pt-3 border-t border-border">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">
                  Chemical Compliance (ZDHC)
                </p>
                <div className="space-y-0">
                  <div className="flex items-baseline justify-between py-2 border-b border-border last:border-0 gap-4">
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      ZDHC Level
                    </span>
                    <span className="text-foreground text-sm text-right">
                      {chemicalCompliance.zdhc_level ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          Level {chemicalCompliance.zdhc_level}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </div>
                  <DataRow
                    label="MRSL Tested"
                    value={
                      chemicalCompliance.mrsl_tested != null
                        ? chemicalCompliance.mrsl_tested
                          ? "Yes ✓"
                          : "No"
                        : null
                    }
                  />
                  <div className="flex items-baseline justify-between py-2 border-b border-border last:border-0 gap-4">
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      Test Report
                    </span>
                    <span className="text-foreground text-sm text-right">
                      {chemicalCompliance.test_report_url ? (
                        <a
                          href={chemicalCompliance.test_report_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline truncate block max-w-[200px]"
                        >
                          {chemicalCompliance.test_report_url}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Document Downloads */}
          {templateConfig.showDocuments && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-3 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                {t("section_documents")}
              </p>
              <div className="space-y-2">
                {tenant.bis_certificate_path &&
                tenant.bis_certificate_path.trim() ? (
                  <a
                    href={`${getBaseUrl()}${tenant.bis_certificate_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-background hover:bg-accent rounded-lg border border-border text-sm text-foreground transition-colors"
                  >
                    <Download className="w-4 h-4 text-blue-500" />
                    {t("doc_bis")}
                  </a>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    {t("doc_bis_missing")}
                  </div>
                )}
                {tenant.epr_certificate_path &&
                tenant.epr_certificate_path.trim() ? (
                  <a
                    href={`${getBaseUrl()}${tenant.epr_certificate_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-background hover:bg-accent rounded-lg border border-border text-sm text-foreground transition-colors"
                  >
                    <Download className="w-4 h-4 text-emerald-500" />
                    {t("doc_epr")}
                  </a>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    {t("doc_epr_missing")}
                  </div>
                )}
                {pliCompliant &&
                  tenant.pli_certificate_path &&
                  tenant.pli_certificate_path.trim() && (
                    <a
                      href={`${getBaseUrl()}${tenant.pli_certificate_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-background hover:bg-accent rounded-lg border border-border text-sm text-foreground transition-colors"
                    >
                      <Download className="w-4 h-4 text-amber-500" />
                      {t("doc_pli")}
                    </a>
                  )}
              </div>
            </div>
          )}

          {/* Import details */}
          {templateConfig.showImportDetails && isImported && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-3 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                {t("section_import")}
              </p>
              <div className="space-y-0">
                <DataRow
                  label={t("label_bill_of_entry")}
                  value={billOfEntryNo}
                  mono
                />
                <DataRow
                  label={t("label_country_origin")}
                  value={countryOfOrigin}
                />
                <DataRow label={t("label_hsn")} value={hsnCode} mono />
                <DataRow
                  label={t("label_customs_date")}
                  value={
                    customsDate ? customsDate.toLocaleDateString("en-GB") : null
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Manufacturer */}
        <div className="p-6 md:p-8">
          <h3 className="text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            {t("section_manufacturer")}
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                {t("label_producer")}
              </p>
              <p className="text-foreground font-medium">
                {manufacturerName || t("label_missing")}
              </p>
            </div>

            {/* Contact Section - Always visible */}
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-3 font-medium">
                {t("label_contact")}
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("label_office")}
                    </p>
                    <p className="text-foreground text-sm">
                      {manufacturerAddress || t("label_missing")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("label_consumer_care")}
                    </p>
                    {manufacturerEmail ? (
                      <a
                        href={`mailto:${manufacturerEmail}`}
                        className="text-blue-500 text-sm hover:underline"
                      >
                        {manufacturerEmail}
                      </a>
                    ) : (
                      <span className="text-foreground text-sm">
                        {t("label_missing")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Certifications */}
            {certifications.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">
                  {t("label_certifications")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-muted text-foreground text-xs rounded border border-border"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {templateConfig.showTextileProfile && (
              <div className="pt-3 border-t border-border">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">
                  Textile Profile
                </p>
                <div className="space-y-0">
                  <DataRow
                    label="Facility Type"
                    value={tenant.textile_facility_type}
                  />
                  <DataRow
                    label="Supply Chain Tier"
                    value={tenant.textile_supply_chain_tier}
                  />
                </div>
              </div>
            )}

            {/* EU Representative */}
            {showEURepresentative && (
              <div className="pt-3 border-t border-border">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">
                  {t("label_eu_rep")}
                </p>
                <div className="space-y-0">
                  <DataRow
                    label={t("label_name")}
                    value={euRepresentativeName}
                  />
                  <DataRow
                    label={t("label_address")}
                    value={euRepresentativeAddress}
                  />
                  <DataRow
                    label={t("label_email")}
                    value={euRepresentativeEmail}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lifecycle & Ownership */}
      <div className="p-6 md:p-8 border-b border-border">
        <h3 className="text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          {t("section_lifecycle")}
        </h3>

        {/* SoH Gauge */}
        {templateConfig.showSoh && soh != null && <SoHGauge soh={soh} />}

        <div className="space-y-0 mt-3">
          <DataRow
            label={t("label_current_owner")}
            value={passport.current_owner_identifier}
            mono
          />
          {templateConfig.showSoh && soh == null && (
            <DataRow label={t("label_soh")} value={stateOfHealthLabel} />
          )}
          {templateConfig.showSoh && (
            <DataRow label={t("label_last_soh")} value={lastSohUpdateLabel} />
          )}
          <DataRow
            label={t("label_ownership_records")}
            value={ownershipCount}
          />
          <DataRow label={t("label_repair_events")} value={repairCount} />
          <DataRow
            label={t("label_replacement_events")}
            value={replacementCount}
          />
        </div>

        {/* Expanded Repair History (EU Art 14) */}
        {repairCount > 0 && passport.repair_events && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-foreground text-sm font-medium mb-2 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
              Repair History
            </h4>
            <div className="space-y-2">
              {passport.repair_events.map((evt, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2 bg-background rounded text-sm"
                >
                  <span className="text-muted-foreground text-xs whitespace-nowrap mt-0.5">
                    {evt.timestamp
                      ? new Date(evt.timestamp).toLocaleDateString("en-GB")
                      : "—"}
                  </span>
                  <span className="text-foreground">
                    {evt.description || "Repair performed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expanded Replacement History */}
        {replacementCount > 0 && passport.replacement_events && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-foreground text-sm font-medium mb-2 flex items-center gap-1.5">
              <Replace className="w-3.5 h-3.5 text-muted-foreground" />
              Replacement History
            </h4>
            <div className="space-y-2">
              {passport.replacement_events.map((evt, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2 bg-background rounded text-sm"
                >
                  <span className="text-muted-foreground text-xs whitespace-nowrap mt-0.5">
                    {evt.timestamp
                      ? new Date(evt.timestamp).toLocaleDateString("en-GB")
                      : "—"}
                  </span>
                  <span className="text-foreground">
                    {evt.description || "Component replaced"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {templateConfig.showIndiaRecycling && (
          <div className="mt-4 pt-4 border-t border-border">
            <DataRow
              label={t("label_recycling_status")}
              value={passport.recycling_status}
            />
            <DataRow
              label={t("label_recycler_epr")}
              value={passport.recycler_epr_id}
              mono
            />
            <DataRow
              label={t("label_recycling_date")}
              value={
                recyclingDate ? recyclingDate.toLocaleDateString("en-GB") : null
              }
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
 SAFETY & DISPOSAL
 ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 md:p-8 bg-background border-t border-border">
        <div className="bg-red-500/10 rounded-lg p-4 border border-red-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-500 font-medium mb-1">
                {templateConfig.safetyTitle}
              </h4>
              <p className="text-red-500/80 text-sm">
                {templateConfig.safetyBody}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-100">
          <div className="flex items-start gap-3">
            <Recycle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-emerald-500 font-medium mb-1">
                {templateConfig.circularityTitle}
              </h4>
              <p className="text-emerald-500/80 text-sm">
                {templateConfig.circularityBody}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
 FOOTER
 ═══════════════════════════════════════════════════════════════════ */}
      <div className="text-center py-6 border-t border-border bg-card">
        <p className="text-muted-foreground text-sm">
          {t("footer_issued")}{" "}
          <span className="text-foreground font-medium">AnvayaLabs™</span>{" "}
          {t("footer_registry")}
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          {t("footer_verify")}
        </p>
      </div>
    </div>
  );
}
