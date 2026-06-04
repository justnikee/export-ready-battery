"use client";

import {
  Calendar,
  CheckCircle,
  Leaf,
  MapPin,
  Recycle,
  Smartphone,
  Shield,
  Building2,
  Mail,
  Factory,
  Globe,
  Zap,
  ThermometerSun,
  Weight,
  Atom,
  Sparkles,
  BadgeCheck,
  QrCode,
  FileCheck,
  Truck,
  AlertTriangle,
  Activity,
  Palette,
  Layers3,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useState } from "react";
import { TelemetryChart } from "./telemetry-chart";
import { TrustBadge, type TrustTier } from "./trust-badge";
import { SoHHistory } from "./soh-history";

// ─── Types ───────────────────────────────────────────────────────────────────
type MarketRegion = "INDIA" | "EU" | "GLOBAL";

interface PassportViewProps {
  passport: PassportViewData;
  trustTier?: TrustTier;
}

interface PassportViewData {
  passport?: {
    uuid?: string;
    serial_number?: string;
    manufacture_date?: string;
    created_at?: string;
    status?: string;
    state_of_health?: number | null;
    last_soh_update_timestamp?: string | null;
  };
  specs?: {
    chemistry?: string;
    capacity?: string;
    voltage?: string;
    weight?: string;
    carbon_footprint?: string;
    country_of_origin?: string;
    manufacturer?: string;
    manufacturer_address?: string;
    eu_representative?: string;
    eu_representative_email?: string;
    hsn_code?: string;
    epr_number?: string;
    bis_number?: string;
    material_composition?: {
      cobalt_pct?: number;
      lithium_pct?: number;
      nickel_pct?: number;
      manganese_pct?: number;
      graphite_pct?: number;
      lead_pct?: number;
      recycled_cobalt_pct?: number;
      recycled_lithium_pct?: number;
      recycled_nickel_pct?: number;
      recycled_lead_pct?: number;
    };
    recycled_content_pct?: number | null;
    warranty_months?: number | null;
    expected_lifetime_cycles?: number | null;
    hazardous_substances?: {
      lead_present?: boolean;
      mercury_present?: boolean;
      cadmium_present?: boolean;
      declaration?: string;
      exemptions?: string;
    };
    // Textile-specific fields
    material_profile?: string;
    gsm?: number;
    dye_process?: string;
    color?: string;
    finish_type?: string[];
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
    };
    water_usage_liters?: number;
    energy_usage_kwh?: number;
    certifications?: string[];
    chemical_compliance_zdhc?: {
      zdhc_level?: string;
      mrsl_tested?: boolean;
    };
  };
  tenant?: {
    company_name?: string;
    address?: string;
    support_email?: string;
    epr_registration_number?: string;
    bis_r_number?: string;
  };
  batch_name?: string;
  model_name?: string;
  market_region?: MarketRegion;
  domestic_value_add?: number;
  pli_compliant?: boolean;
  cell_source?: string;
  bill_of_entry_no?: string;
  country_of_origin?: string;
  customs_date?: string;
  dva_source?: string;
  hsn_code?: string;
  manufacturing_start_date?: string;
  manufacturing_end_date?: string;
  product_type?: string;
}

// ─── Helper Components ───────────────────────────────────────────────────────

function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={clsx(
        "relative rounded-2xl border border-white/[0.06] bg-background/80 backdrop-blur-xl overflow-hidden",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  badge,
  badgeColor = "teal",
}: {
  icon: LucideIcon;
  title: string;
  badge?: string;
  badgeColor?: string;
}) {
  const badgeColors: Record<string, string> = {
    teal: "bg-teal-500/15 text-teal-400 ring-teal-500/25",
    orange: "bg-orange-500/15 text-orange-400 ring-orange-500/25",
    blue: "bg-blue-500/15 text-blue-400 ring-blue-500/25",
    amber: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
    emerald: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  };
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4.5 w-4.5 text-muted-foreground" />
        <h2 className="text-sm text-foreground tracking-wide uppercase">
          {title}
        </h2>
      </div>
      {badge && (
        <span
          className={clsx(
            "text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ring-1",
            badgeColors[badgeColor],
          )}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    { bg: string; dot: string; text: string; label: string }
  > = {
    CREATED: {
      bg: "bg-muted-foreground/10 ring-1 ring-border/30",
      dot: "bg-muted-foreground",
      text: "text-muted-foreground",
      label: "Created",
    },
    ACTIVE: {
      bg: "bg-emerald-500/10 ring-1 ring-emerald-500/30",
      dot: "bg-emerald-400",
      text: "text-emerald-300",
      label: "Active",
    },
    SHIPPED: {
      bg: "bg-sky-500/10 ring-1 ring-sky-500/30",
      dot: "bg-sky-400",
      text: "text-sky-300",
      label: "Shipped",
    },
    IN_SERVICE: {
      bg: "bg-emerald-500/10 ring-1 ring-emerald-500/30",
      dot: "bg-emerald-400 animate-pulse",
      text: "text-emerald-300",
      label: "In Service",
    },
    RECALLED: {
      bg: "bg-red-500/10 ring-1 ring-red-500/30",
      dot: "bg-red-400 animate-pulse",
      text: "text-red-300",
      label: "Recalled",
    },
    RECYCLED: {
      bg: "bg-teal-500/10 ring-1 ring-teal-500/30",
      dot: "bg-teal-400",
      text: "text-teal-300",
      label: "Recycled",
    },
    END_OF_LIFE: {
      bg: "bg-muted/50 ring-1 ring-border/30",
      dot: "bg-muted-foreground",
      text: "text-muted-foreground",
      label: "End of Life",
    },
  };
  const c = configs[status] || configs.ACTIVE;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ",
        c.bg,
        c.text,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

function CEMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 170 120"
      className={clsx("h-7 w-auto", className)}
      fill="currentColor"
    >
      <path
        d="M60,60 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 M60,60 m-35,0 a35,35 0 1,1 70,0 a35,35 0 1,1 -70,0 M25,60 L60,60 M25,45 L50,45 M25,75 L50,75"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
      />
      <path
        d="M110,10 L110,110 L145,110 M110,60 L135,60 M110,10 L145,10"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
      />
    </svg>
  );
}

function BISMark() {
  return (
    <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-orange-400 text-orange-400 text-[9px] bg-orange-500/10">
      BIS
    </div>
  );
}

// Circular gauge for SoH
function SoHGauge({
  value,
  lastUpdate,
}: {
  value?: number | null;
  lastUpdate?: string | null;
}) {
  const hasValue = value !== null && value !== undefined && lastUpdate;
  const pct = hasValue ? value : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    pct >= 80
      ? "text-emerald-400"
      : pct >= 50
        ? "text-amber-400"
        : "text-red-400";
  const trackColor =
    pct >= 80
      ? "text-emerald-500/15"
      : pct >= 50
        ? "text-amber-500/15"
        : "text-red-500/15";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="8"
            className={trackColor}
            stroke="currentColor"
          />
          {hasValue && (
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={color}
              stroke="currentColor"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={clsx(
              "text-3xl ",
              hasValue ? color : "text-muted-foreground",
            )}
          >
            {hasValue ? `${pct}%` : "—"}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            SoH
          </span>
        </div>
      </div>
      {hasValue && lastUpdate && (
        <span className="text-[10px] text-muted-foreground">
          Updated {new Date(lastUpdate).toLocaleDateString()}
        </span>
      )}
      {!hasValue && (
        <span className="text-[10px] text-muted-foreground">
          No telemetry data
        </span>
      )}
    </div>
  );
}

// Stacked material bar
function MaterialBar({
  composition,
}: {
  composition: NonNullable<
    NonNullable<PassportViewData["specs"]>["material_composition"]
  >;
}) {
  const materials = [
    {
      key: "cobalt_pct",
      label: "Co",
      color: "bg-sky-500",
      text: "text-sky-400",
    },
    {
      key: "lithium_pct",
      label: "Li",
      color: "bg-teal-500",
      text: "text-teal-400",
    },
    {
      key: "nickel_pct",
      label: "Ni",
      color: "bg-cyan-500",
      text: "text-cyan-400",
    },
    {
      key: "manganese_pct",
      label: "Mn",
      color: "bg-amber-500/100",
      text: "text-amber-400",
    },
    {
      key: "graphite_pct",
      label: "C",
      color: "bg-muted-foreground",
      text: "text-muted-foreground",
    },
    {
      key: "lead_pct",
      label: "Pb",
      color: "bg-muted",
      text: "text-muted-foreground",
    },
  ] as const;

  const active = materials.filter((m) => {
    const v = composition[m.key as keyof typeof composition];
    return v !== undefined && v !== null && (v as number) > 0;
  });

  if (active.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex h-5 w-full rounded-full overflow-hidden bg-white/5">
        {active.map((m) => {
          const v = composition[m.key as keyof typeof composition] as number;
          return (
            <motion.div
              key={m.key}
              className={clsx("h-full", m.color)}
              initial={{ width: 0 }}
              animate={{ width: `${v}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {active.map((m) => {
          const v = composition[m.key as keyof typeof composition] as number;
          return (
            <div key={m.key} className="flex items-center gap-1.5 text-xs">
              <span className={clsx("h-2 w-2 rounded-full", m.color)} />
              <span className="text-muted-foreground">{m.label}</span>
              <span className="text-white ">{v}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Horizontal lifecycle stepper
function LifecycleStepper({
  steps,
}: {
  steps: {
    label: string;
    date?: string;
    active: boolean;
    pending: boolean;
    icon: LucideIcon;
  }[];
}) {
  return (
    <div className="flex items-start justify-between relative">
      {/* connector line */}
      <div className="absolute top-5 left-5 right-5 h-0.5 bg-secondary" />
      <div
        className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500"
        style={{
          width: `${(steps.filter((s) => s.active).length / steps.length) * 100}%`,
        }}
      />

      {steps.map((step, i) => (
        <div
          key={i}
          className="relative flex flex-col items-center text-center z-10"
          style={{ width: `${100 / steps.length}%` }}
        >
          <div
            className={clsx(
              "flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all",
              step.active
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                : step.pending
                  ? "border-border bg-secondary text-muted-foreground"
                  : "border-cyan-500 bg-cyan-500/20 text-cyan-400",
            )}
          >
            <step.icon className="h-4 w-4" />
          </div>
          <span
            className={clsx(
              "text-[11px] font-medium mt-2 leading-tight",
              step.active
                ? "text-white"
                : step.pending
                  ? "text-muted-foreground"
                  : "text-muted-foreground",
            )}
          >
            {step.label}
          </span>
          {step.date && (
            <span className="text-[9px] text-muted-foreground mt-0.5">
              {step.date}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// Compliance tab button
function TabButton({
  active,
  children,
  onClick,
  color = "teal",
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  color?: string;
}) {
  const colors: Record<string, string> = {
    teal: active
      ? "bg-teal-500/15 text-teal-400 ring-teal-500/30"
      : "text-muted-foreground hover:text-muted-foreground",
    orange: active
      ? "bg-orange-500/15 text-orange-400 ring-orange-500/30"
      : "text-muted-foreground hover:text-muted-foreground",
    blue: active
      ? "bg-blue-500/15 text-blue-400 ring-blue-500/30"
      : "text-muted-foreground hover:text-muted-foreground",
  };
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 rounded-lg text-sm transition-all ring-1",
        active ? colors[color] : "ring-transparent " + colors[color],
      )}
    >
      {children}
    </button>
  );
}

// Data row helper
function DataRow({
  label,
  value,
  icon: Icon,
  valueColor,
  children,
}: {
  label: string;
  value?: string | React.ReactNode;
  icon?: LucideIcon;
  valueColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-b-0">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {children || (
          <span
            className={clsx("text-sm font-medium", valueColor || "text-white")}
          >
            {value || "—"}
          </span>
        )}
      </div>
    </div>
  );
}

// Progress bar
function ProgressBar({
  value,
  max = 100,
  color = "emerald",
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const colors: Record<string, string> = {
    emerald: "from-emerald-500 to-teal-400",
    orange: "from-orange-500 to-amber-400",
    blue: "from-blue-500 to-cyan-400",
  };
  return (
    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className={clsx(
          "h-full rounded-full bg-gradient-to-r",
          colors[color] || colors.emerald,
        )}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PassportView({ passport, trustTier = "SELF_DECLARED" }: PassportViewProps) {
  const specs = passport.specs || {};
  const passportData = passport.passport || {};
  const tenant = passport.tenant || {};

  const batchName = passport.batch_name || ("Battery Passport");
  const modelName = passport.model_name || "";
  const status = passportData.status || "CREATED";

  const eprNumber = specs.epr_number || tenant.epr_registration_number || "";
  const bisNumber = specs.bis_number || tenant.bis_r_number || "";

  const marketRegion = (passport.market_region || "GLOBAL") as MarketRegion;
  const isIndia = marketRegion === "INDIA" || marketRegion === "GLOBAL";
  const isEU = marketRegion === "EU" || marketRegion === "GLOBAL";
  const isGlobal = marketRegion === "GLOBAL";

  const domesticValueAdd = passport.domestic_value_add;
  const hasDomesticValueAdd =
    domesticValueAdd !== null && domesticValueAdd !== undefined;
  const pliEligible =
    passport.pli_compliant && hasDomesticValueAdd && domesticValueAdd >= 50;
  const dvaSource = passport.dva_source || "";
  const hsnCode = passport.hsn_code || specs.hsn_code || "";

  const cellSource = passport.cell_source || "";
  const isImported = cellSource === "IMPORTED";
  const materialComposition = specs.material_composition || null;
  const hasMaterials =
    materialComposition &&
    (materialComposition.cobalt_pct ||
      materialComposition.lithium_pct ||
      materialComposition.nickel_pct ||
      materialComposition.manganese_pct ||
      materialComposition.graphite_pct ||
      materialComposition.lead_pct);
  const hasRecycledMaterials =
    materialComposition &&
    (materialComposition.recycled_cobalt_pct ||
      materialComposition.recycled_lithium_pct ||
      materialComposition.recycled_nickel_pct ||
      materialComposition.recycled_lead_pct);
  const recycledContentLabel =
    specs.recycled_content_pct !== null &&
    specs.recycled_content_pct !== undefined
      ? `${specs.recycled_content_pct}%`
      : "—";
  const warrantyLabel =
    specs.warranty_months !== null && specs.warranty_months !== undefined
      ? `${specs.warranty_months} mo`
      : "—";
  const lifetimeLabel =
    specs.expected_lifetime_cycles !== null &&
    specs.expected_lifetime_cycles !== undefined
      ? `${specs.expected_lifetime_cycles} cycles`
      : "—";
  const hazSub = specs.hazardous_substances;
  const hazardousDeclaration = hazSub?.declaration || "";

  const mfgStart = passport.manufacturing_start_date;
  const mfgEnd = passport.manufacturing_end_date;
  const billOfEntryNo = passport.bill_of_entry_no || "";
  const cellCountryOfOrigin = passport.country_of_origin || "";
  const customsDate = passport.customs_date || "";

  // Compliance tab state
  const [complianceTab, setComplianceTab] = useState<"eu" | "india">(
    marketRegion === "INDIA" ? "india" : "eu",
  );
  const showBothTabs = isGlobal || (isIndia && isEU);

  // Lifecycle steps
  const lifecycleSteps = [
    {
      label: "Manufactured",
      date: passportData.manufacture_date
        ? new Date(passportData.manufacture_date).toLocaleDateString(
            undefined,
            { month: "short", year: "numeric" },
          )
        : undefined,
      active: true,
      pending: false,
      icon: Factory,
    },
    {
      label: isIndia ? "Aadhaar Issued" : "Passport Issued",
      date: passportData.created_at
        ? new Date(passportData.created_at).toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
          })
        : undefined,
      active: true,
      pending: false,
      icon: BadgeCheck,
    },
    {
      label: "In Service",
      active: status === "IN_SERVICE" || status === "ACTIVE" || status === "IN_USE",
      pending: status === "CREATED" || status === "SHIPPED",
      icon: Activity,
    },
    {
      label: "End of Life",
      active: status === "END_OF_LIFE" || status === "RECYCLED",
      pending: true,
      icon: Recycle,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ▓▓▓ HERO BANNER ▓▓▓ */}
      <Section>
        <div className="relative overflow-hidden">
          {/* Background mesh gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#171717] via-[#262626] to-[#171717]" />
          <div
            className={clsx(
              "absolute inset-0 opacity-30",
              isIndia
                ? "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-600/40 via-transparent to-transparent"
                : isEU
                  ? "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/40 via-transparent to-transparent"
                  : "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-600/40 via-transparent to-transparent",
            )}
          />

          <div className="relative px-5 py-6 md:px-8 md:py-8">
            {/* Top row badges */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <TrustBadge tier={trustTier} />
              {marketRegion === "INDIA" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/10 ring-1 ring-orange-500/30 text-orange-400 text-xs ">
                  {pliEligible ? "🇮🇳 PLI Eligible" : "🇮🇳 India"}
                </span>
              )}
              {marketRegion === "EU" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 ring-1 ring-blue-500/30 text-blue-400 text-xs ">
                  {"🇪🇺 EU Battery Passport"}
                </span>
              )}
              {isGlobal && (
                <>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/10 ring-1 ring-orange-500/30 text-orange-400 text-xs ">
                    🇮🇳 India
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 ring-1 ring-blue-500/30 text-blue-400 text-xs ">
                    🇪🇺 EU
                  </span>
                </>
              )}
              {dvaSource === "AUDITED" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-500/10 ring-1 ring-teal-500/30 text-teal-400 text-xs ">
                  <FileCheck className="h-3 w-3" /> CA Audited
                </span>
              )}
              <StatusBadge status={status} />
            </div>

            {/* Identity */}
            <h1 className="text-2xl md:text-3xl text-white tracking-tight">
              {batchName}
            </h1>
            {modelName && (
              <p className="text-muted-foreground text-sm font-mono mt-1">
                {modelName}
              </p>
            )}
            <p className="text-muted-foreground text-base mt-1">
              {specs.manufacturer ||
                tenant.company_name ||
                ("Battery Manufacturer")}
            </p>

            {/* Serial number strip */}
            <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <QrCode
                className={clsx(
                  "h-5 w-5 shrink-0",
                  isIndia
                    ? "text-orange-400"
                    : isEU
                      ? "text-blue-400"
                      : "text-teal-400",
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground ">
                  {isIndia ? "Battery Aadhaar (BPAN)" : "Passport Serial"}
                </div>
                <code
                  className={clsx(
                    "text-lg md:text-xl font-mono tracking-wider block truncate",
                    isIndia
                      ? "text-orange-400"
                      : isEU
                        ? "text-blue-400"
                        : "text-teal-400",
                  )}
                >
                  {passportData.serial_number || "N/A"}
                </code>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-muted-foreground">Issued</div>
                <div className="text-xs text-muted-foreground font-medium">
                  {passportData.created_at
                    ? new Date(passportData.created_at).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", year: "numeric" },
                      )
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ▓▓▓ KEY METRICS STRIP + SOH ▓▓▓ */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        {/* Specs strip */}
        <Section>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.04]">
            {[
              {
                icon: Atom,
                label: "Chemistry",
                value: specs.chemistry || "—",
                accent: "text-cyan-400",
              },
              {
                icon: Zap,
                label: "Capacity",
                value: specs.capacity || "—",
                accent: "text-emerald-400",
              },
              {
                icon: ThermometerSun,
                label: "Voltage",
                value: specs.voltage || "—",
                accent: "text-sky-400",
              },
              {
                icon: Weight,
                label: "Weight",
                value: specs.weight || "—",
                accent: "text-amber-400",
              },
            ].map((s, i) => (
              <div key={i} className="px-4 py-4 text-center">
                <s.icon className={clsx("h-4 w-4 mx-auto mb-1.5", s.accent)} />
                <div className={clsx("text-lg text-white")}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* SoH gauge */}
        <Section className="flex items-center justify-center px-6 py-4">
          <SoHGauge
            value={passportData.state_of_health}
            lastUpdate={passportData.last_soh_update_timestamp}
          />
        </Section>
      </div>

      {/* ▓▓▓ SOH HISTORY ▓▓▓ */}
      <Section>
        <SoHHistory passportUuid={passportData.uuid} />
      </Section>

      {/* ▓▓▓ ORIGIN & MANUFACTURING ▓▓▓ */}
      <Section>
        <SectionHeader icon={MapPin} title="Origin & Manufacturing" />
        <div className="px-5 pb-5">
          <DataRow
            label="Country of Origin"
            icon={Globe}
            value={
              isImported
                ? `Imported from ${cellCountryOfOrigin || specs.country_of_origin || "—"}`
                : cellSource === "DOMESTIC"
                  ? `Made in ${specs.country_of_origin || "India"}`
                  : specs.country_of_origin || "—"
            }
          />
          {cellSource && (
            <DataRow label="Cell Source" icon={Factory}>
              <span
                className={clsx(
                  "text-sm font-medium",
                  cellSource === "DOMESTIC"
                    ? "text-emerald-400"
                    : "text-amber-400",
                )}
              >
                {cellSource === "DOMESTIC" ? "Domestic 🇮🇳" : "Imported"}
              </span>
              {cellSource === "DOMESTIC" && (
                <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full ring-1 ring-orange-500/25 ml-2">
                  Atmanirbhar
                </span>
              )}
            </DataRow>
          )}
          {mfgStart && (
            <DataRow
              label="Manufacturing Window"
              icon={Calendar}
              value={`${new Date(mfgStart).toLocaleDateString(undefined, { month: "short", year: "numeric" })}${mfgEnd ? ` – ${new Date(mfgEnd).toLocaleDateString(undefined, { month: "short", year: "numeric" })}` : ""}`}
            />
          )}
          {passportData.manufacture_date && (
            <DataRow
              label="Manufacture Date"
              icon={Calendar}
              value={new Date(passportData.manufacture_date).toLocaleDateString(
                undefined,
                { year: "numeric", month: "short", day: "numeric" },
              )}
            />
          )}
        </div>
      </Section>

      {/* ▓▓▓ COMPLIANCE PANEL ▓▓▓ */}
      <Section>
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="h-4.5 w-4.5 text-muted-foreground" />
              <h2 className="text-sm text-foreground tracking-wide uppercase">
                Regulatory Compliance
              </h2>
            </div>
            {showBothTabs && (
              <div className="flex gap-1.5">
                <TabButton
                  active={complianceTab === "eu"}
                  onClick={() => setComplianceTab("eu")}
                  color="blue"
                >
                  🇪🇺 EU
                </TabButton>
                <TabButton
                  active={complianceTab === "india"}
                  onClick={() => setComplianceTab("india")}
                  color="orange"
                >
                  🇮🇳 India
                </TabButton>
              </div>
            )}
          </div>
        </div>

        {/* EU Compliance */}
        {(complianceTab === "eu" || (!showBothTabs && isEU)) && (
          <div className="px-5 pb-5 space-y-4">
            {/* Carbon Footprint */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="flex items-center gap-3">
                <Leaf className="h-5 w-5 text-emerald-400" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Carbon Footprint
                  </div>
                  <div className="text-white text-lg">
                    {specs.carbon_footprint || "—"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      kg CO₂e
                    </span>
                  </div>
                </div>
              </div>
              {specs.carbon_footprint && (
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full ring-1 ring-emerald-500/25">
                  Certified
                </span>
              )}
            </div>

            {/* Material Composition */}
            {hasMaterials && materialComposition && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-2 mb-3">
                  <Atom className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Material Composition
                  </span>
                  <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded ">
                    EU Required
                  </span>
                </div>
                <MaterialBar composition={materialComposition} />
              </div>
            )}

            {/* Recycled Content Per-Material */}
            {hasRecycledMaterials && materialComposition && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-2 mb-3">
                  <Recycle className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Per-Material Recycled Content
                  </span>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded ">
                    Art. 8
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {materialComposition.recycled_cobalt_pct != null &&
                    materialComposition.recycled_cobalt_pct > 0 && (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] text-xs">
                        <span className="text-sky-400">Cobalt</span>
                        <span className="text-white ">
                          {materialComposition.recycled_cobalt_pct}%
                        </span>
                      </div>
                    )}
                  {materialComposition.recycled_lithium_pct != null &&
                    materialComposition.recycled_lithium_pct > 0 && (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] text-xs">
                        <span className="text-teal-400">Lithium</span>
                        <span className="text-white ">
                          {materialComposition.recycled_lithium_pct}%
                        </span>
                      </div>
                    )}
                  {materialComposition.recycled_nickel_pct != null &&
                    materialComposition.recycled_nickel_pct > 0 && (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] text-xs">
                        <span className="text-cyan-400">Nickel</span>
                        <span className="text-white ">
                          {materialComposition.recycled_nickel_pct}%
                        </span>
                      </div>
                    )}
                  {materialComposition.recycled_lead_pct != null &&
                    materialComposition.recycled_lead_pct > 0 && (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] text-xs">
                        <span className="text-muted-foreground">Lead</span>
                        <span className="text-white ">
                          {materialComposition.recycled_lead_pct}%
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Sustainability metrics row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Recycled
                </div>
                <div className="text-white mt-0.5">{recycledContentLabel}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Warranty
                </div>
                <div className="text-white mt-0.5">{warrantyLabel}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Lifetime
                </div>
                <div className="text-white mt-0.5">{lifetimeLabel}</div>
              </div>
            </div>

            {/* Hazardous Substances */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                Hazardous Substances
              </div>
              <div className="text-sm text-white">
                {hazardousDeclaration || "—"}
              </div>
              {hazSub &&
                (hazSub.lead_present ||
                  hazSub.mercury_present ||
                  hazSub.cadmium_present) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {hazSub.lead_present && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 ring-1 ring-red-500/25">
                        Lead
                      </span>
                    )}
                    {hazSub.mercury_present && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 ring-1 ring-red-500/25">
                        Mercury
                      </span>
                    )}
                    {hazSub.cadmium_present && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 ring-1 ring-red-500/25">
                        Cadmium
                      </span>
                    )}
                  </div>
                )}
              {hazSub?.exemptions && (
                <div className="text-xs text-muted-foreground mt-1">
                  Exemptions: {hazSub.exemptions}
                </div>
              )}
            </div>

            {/* EU Authorized Representative (Art. 77) */}
            {(specs.eu_representative || specs.eu_representative_email) && (
              <div className="p-4 rounded-xl bg-blue-500/[0.06] border border-blue-500/15">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                    EU Authorized Representative
                  </span>
                </div>
                {specs.eu_representative && (
                  <div className="text-white font-medium text-sm">
                    {specs.eu_representative}
                  </div>
                )}
                {specs.eu_representative_email && (
                  <a
                    href={`mailto:${specs.eu_representative_email}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                  >
                    {specs.eu_representative_email}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* India Compliance */}
        {(complianceTab === "india" || (!showBothTabs && isIndia && !isEU)) && (
          <div className="px-5 pb-5 space-y-4">
            {/* DVA Progress */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Domestic Value Add
                </span>
                <span
                  className={clsx(
                    "text-xl ",
                    hasDomesticValueAdd
                      ? domesticValueAdd >= 50
                        ? "text-emerald-400"
                        : "text-orange-400"
                      : "text-muted-foreground",
                  )}
                >
                  {hasDomesticValueAdd ? `${domesticValueAdd}%` : "—"}
                </span>
              </div>
              {hasDomesticValueAdd && (
                <>
                  <ProgressBar
                    value={domesticValueAdd}
                    color={domesticValueAdd >= 50 ? "emerald" : "orange"}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {cellSource === "IMPORTED"
                      ? "Imported cells (DVA may be 0%)"
                      : "PLI Requirement: ≥ 50%"}
                  </p>
                </>
              )}
            </div>

            {/* EPR + BIS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-1.5 mb-2">
                  <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    EPR
                  </span>
                </div>
                <div
                  className={clsx(
                    "text-sm flex items-center gap-1",
                    eprNumber ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {eprNumber ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  <span className="truncate">{eprNumber || "Missing"}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-1.5 mb-2">
                  <BISMark />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    BIS (IS 16046)
                  </span>
                </div>
                <div className="text-sm font-mono text-sky-400 truncate">
                  {bisNumber ? `R-${bisNumber}` : "Missing"}
                </div>
              </div>
            </div>

            {/* HSN + DVA Source */}
            <div className="grid grid-cols-2 gap-3">
              {hsnCode && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    HSN Code
                  </div>
                  <div className="text-white font-mono ">{hsnCode}</div>
                </div>
              )}
              {dvaSource && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    DVA Verification
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">
                      {dvaSource === "AUDITED"
                        ? "CA-Audited"
                        : "Self-Estimated"}
                    </span>
                    <span
                      className={clsx(
                        "text-[9px] px-2 py-0.5 rounded-full ring-1",
                        dvaSource === "AUDITED"
                          ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25"
                          : "bg-amber-500/15 text-amber-400 ring-amber-500/25",
                      )}
                    >
                      {dvaSource === "AUDITED" ? "Verified" : "Pending"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Import Details */}
            {isImported && (
              <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">
                    Import Declaration
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Imported from
                    </div>
                    <div className="text-white font-medium">
                      {cellCountryOfOrigin || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Bill of Entry
                    </div>
                    <div className="text-white font-mono text-sm">
                      {billOfEntryNo || "—"}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground">
                  Cleared:{" "}
                  {customsDate
                    ? new Date(customsDate).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ▓▓▓ INDIA RECYCLING INSTRUCTIONS ▓▓▓ */}
      {isIndia && (
        <Section>
          <div className="px-5 py-5 flex flex-col md:flex-row items-center gap-5">
            <div className="shrink-0">
              <svg
                viewBox="0 0 100 120"
                className="h-20 w-auto text-emerald-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <rect x="20" y="30" width="60" height="60" rx="4" />
                <path d="M15 30 L85 30" strokeWidth="4" />
                <rect x="35" y="22" width="30" height="8" rx="2" />
                <circle cx="32" cy="95" r="5" fill="currentColor" />
                <circle cx="68" cy="95" r="5" fill="currentColor" />
                <line
                  x1="10"
                  y1="110"
                  x2="90"
                  y2="20"
                  strokeWidth="6"
                  className="text-red-500"
                />
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Recycle className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-white">
                  Recycling Instructions (BWM Rules 2022)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong className="text-white">
                  Do not dispose in regular waste.
                </strong>{" "}
                This battery must be collected separately through authorized
                recyclers.
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                <p className="text-xs text-emerald-400">
                  📞 For collection, contact the manufacturer or visit{" "}
                  <strong>eprregistration.cpcb.gov.in</strong>
                </p>
              </div>
              {tenant.support_email && (
                <p className="text-[10px] text-muted-foreground">
                  Producer: {tenant.company_name} •{" "}
                  <a
                    href={`mailto:${tenant.support_email}`}
                    className="text-emerald-400 hover:underline"
                  >
                    {tenant.support_email}
                  </a>
                </p>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ▓▓▓ LIFECYCLE STEPPER ▓▓▓ */}
      <Section>
        <SectionHeader icon={Sparkles} title="Lifecycle" />
        <div className="px-5 pb-6">
          <LifecycleStepper steps={lifecycleSteps} />
        </div>
      </Section>

      {/* ▓▓▓ MANUFACTURER CONTACT ▓▓▓ */}
      <Section>
        <SectionHeader icon={Building2} title="Manufacturer" />
        <div className="px-5 pb-5">
          <DataRow
            label="Company"
            icon={Factory}
            value={specs.manufacturer || tenant.company_name || "—"}
          />
          <DataRow
            label="Address"
            icon={MapPin}
            value={specs.manufacturer_address || tenant.address || "—"}
          />
          <DataRow label="Contact" icon={Mail}>
            {tenant.support_email ? (
              <a
                href={`mailto:${tenant.support_email}`}
                className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
              >
                {tenant.support_email}
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </DataRow>
        </div>
      </Section>

      {/* ▓▓▓ TELEMETRY ▓▓▓ */}
      {passportData.uuid && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <TelemetryChart passportUuid={passportData.uuid} />
        </motion.div>
      )}

      {/* ▓▓▓ TRUST FOOTER ▓▓▓ */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pt-2 pb-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Smartphone className="h-3.5 w-3.5" />
            <span>Secured by AnvayaLabs™</span>
            <span>•</span>
            <Link
              href="/terms"
              className="hover:text-muted-foreground transition-colors"
            >
              Terms
            </Link>
            <span>•</span>
            <Link
              href="/privacy"
              className="hover:text-muted-foreground transition-colors"
            >
              Privacy
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {isEU && <CEMark className="h-5 text-foreground" />}
            {isIndia && <BISMark />}
            <>
              <span className="font-mono text-foreground">
                EPR: {eprNumber || "—"}
              </span>
              <span className="font-mono text-foreground">
                R-{bisNumber || "—"}
              </span>
            </>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
