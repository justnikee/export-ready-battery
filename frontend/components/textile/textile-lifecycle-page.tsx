"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Beaker,
  CheckCircle2,
  Circle,
  ClipboardEdit,
  Factory,
  FileCheck,
  Leaf,
  Package,
  Recycle,
  Ruler,
  Shirt,
  Truck,
  User,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { dashboardPathFromPathname } from "@/lib/routes";
import type { Batch } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PRODUCTION_STAGES = [
  {
    key: "RAW_MATERIAL",
    label: "Raw Material",
    description: "Fiber sourcing and preparation",
    icon: Leaf,
  },
  {
    key: "IN_PRODUCTION",
    label: "In Production",
    description: "Spinning, weaving, and knitting",
    icon: Factory,
  },
  {
    key: "FINISHED",
    label: "Finished",
    description: "Dyeing, finishing, and cut & sew",
    icon: Shirt,
  },
  {
    key: "SHIPPED",
    label: "Shipped",
    description: "In transit to warehouse or customer",
    icon: Truck,
  },
  {
    key: "IN_USE",
    label: "In Use",
    description: "Product with end consumer",
    icon: User,
  },
  {
    key: "RECYCLED",
    label: "Recycled",
    description: "End of life — recycled or disposed",
    icon: Recycle,
  },
] as const;

const SUPPLY_CHAIN_TIERS = [
  { key: "fiber_supplier", label: "Fiber Supplier", icon: Leaf },
  { key: "spinning_mill", label: "Spinning Mill", icon: Factory },
  {
    key: "weaving_knitting_mill",
    label: "Weaving / Knitting Mill",
    icon: Shirt,
  },
  { key: "dye_house", label: "Dye House", icon: Beaker },
  { key: "finishing_facility", label: "Finishing Facility", icon: Package },
  { key: "cut_sew_facility", label: "Cut & Sew Facility", icon: ClipboardEdit },
] as const;

export function TextileLifecyclePage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lotsHref = dashboardPathFromPathname(pathname, "batches");
  const complianceHref = dashboardPathFromPathname(pathname, "compliance");

  useEffect(() => {
    if (!user?.tenant_id) return;
    setLoading(true);
    api
      .get(`/batches?tenant_id=${user.tenant_id}&product_type=TEXTILE&limit=10`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.batches ?? [];
        setBatches(data);
        if (data.length > 0) setSelectedBatchId(data[0].id);
      })
      .catch((err) => setError(err?.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [user?.tenant_id]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || null;
  const specs = selectedBatch?.specs;
  const currentStage = specs?.production_stage ?? "RAW_MATERIAL";
  const supplierTier = specs?.supplier_tier;

  const stageIndex = PRODUCTION_STAGES.findIndex(
    (s) => s.key === currentStage
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-600">
              Textile supply chain
            </p>
            <h1 className="mt-1 text-2xl tracking-tight text-foreground">
              Lifecycle & Operations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track production stages, quality metrics, and supply chain
              transparency.
            </p>
          </div>
          {batches.length > 1 && (
            <div className="relative">
              <select
                value={selectedBatchId ?? ""}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="h-9 appearance-none rounded-sm border border-border bg-card px-3 pr-8 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_name}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          )}
        </div>

        {loading && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-sm border border-red-200 bg-red-500/10 p-4 text-sm text-red-500">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {!loading && !error && !selectedBatch && (
          <div className="rounded-sm border border-border bg-card p-8 text-center">
            <Factory className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No textile lots found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a textile production lot to view lifecycle data.
            </p>
            <Button className="mt-4" asChild>
              <Link href={lotsHref}>Create Lot</Link>
            </Button>
          </div>
        )}

        {!loading && selectedBatch && (
          <>
            {/* Production Stage Tracker */}
            <div>
              <h2 className="text-lg font-medium tracking-tight text-foreground">
                Production Stage
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {PRODUCTION_STAGES.map((stage, idx) => {
                  const isActive = idx === stageIndex;
                  const isCompleted = idx < stageIndex;
                  const Icon = stage.icon;
                  return (
                    <Card
                      key={stage.key}
                      className={`border ${
                        isActive
                          ? "border-cyan-300 bg-cyan-50/40 dark:border-cyan-800 dark:bg-cyan-950/20"
                          : "border-border bg-card"
                      }`}
                    >
                      <CardContent className="flex flex-col items-center pt-6 text-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                            isActive
                              ? "border-cyan-500 bg-cyan-500/10 text-cyan-600"
                              : isCompleted
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                                : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <p
                          className={`mt-3 text-sm font-medium ${
                            isActive || isCompleted
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {stage.label}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {stage.description}
                        </p>
                        {isActive && (
                          <Badge
                            variant="info"
                            className="mt-2 border-cyan-200 bg-cyan-500/10 text-cyan-600"
                          >
                            Current
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Lot Quality Metrics */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                  Lot Quality Metrics
                </CardTitle>
                <CardDescription>
                  Physical and finish specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricItem label="GSM" value={specs?.gsm} unit="g/m²" />
                  <MetricItem label="Color" value={specs?.color} />
                  <MetricItem label="Dimensions" value={specs?.dimensions} />
                  <MetricItem
                    label="Finish Type"
                    value={
                      specs?.finish_type ? specs.finish_type.join(", ") : undefined
                    }
                  />
                  <MetricItem
                    label="Dye Process"
                    value={specs?.dye_process}
                  />
                  <MetricItem
                    label="Expected Lifetime"
                    value={specs?.expected_lifetime_washes}
                    unit="washes"
                  />
                  <MetricItem
                    label="Biodegradable"
                    value={specs?.biodegradable_pct}
                    unit="%"
                  />
                  <MetricItem
                    label="Order Quantity"
                    value={specs?.order_quantity}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Supply Chain Map */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                  Supply Chain Map
                </CardTitle>
                <CardDescription>
                  Tiered supplier visibility from fiber to finished goods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {SUPPLY_CHAIN_TIERS.map((tier, idx) => {
                    const name =
                      supplierTier?.[
                        tier.key as keyof typeof supplierTier
                      ];
                    const Icon = tier.icon;
                    const hasName = !!name;
                    return (
                      <div
                        key={tier.key}
                        className={`flex items-center gap-3 rounded-sm border p-3 ${
                          hasName
                            ? "border-border bg-card"
                            : "border-dashed border-border bg-muted/30"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border ${
                            hasName
                              ? "border-cyan-200 bg-cyan-500/10 text-cyan-600"
                              : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {tier.label}
                          </p>
                          <p
                            className={`truncate text-sm font-medium ${
                              hasName
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {name || "Not mapped"}
                          </p>
                        </div>
                        {hasName && (
                          <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
                        )}
                        {!hasName && (
                          <Circle className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sustainability Metrics */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                  Sustainability Metrics
                </CardTitle>
                <CardDescription>
                  Environmental impact per lot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SustainabilityCard
                    icon={DropletsIcon}
                    label="Water Usage"
                    value={specs?.water_usage_liters}
                    unit="L"
                    color="text-blue-500"
                  />
                  <SustainabilityCard
                    icon={ZapIcon}
                    label="Energy Usage"
                    value={specs?.energy_usage_kwh}
                    unit="kWh"
                    color="text-amber-500"
                  />
                  <SustainabilityCard
                    icon={Leaf}
                    label="Carbon Footprint"
                    value={
                      selectedBatch?.carbon_footprint_result
                        ? Number(
                            (selectedBatch.carbon_footprint_result as Record<string, unknown>)?.total_kg_co2 ??
                              selectedBatch.carbon_footprint_result
                          ) || undefined
                        : undefined
                    }
                    unit="kg CO₂e"
                    color="text-emerald-500"
                  />
                  <SustainabilityCard
                    icon={RecycleIcon}
                    label="Recycled Content"
                    value={specs?.recycled_content_pct}
                    unit="%"
                    color="text-cyan-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <Link href={lotsHref}>
                      <ClipboardEdit className="mr-2 h-4 w-4" />
                      Edit Lot
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={complianceHref}>
                      <FileCheck className="mr-2 h-4 w-4" />
                      View Compliance
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={lotsHref}>
                      <Ruler className="mr-2 h-4 w-4" />
                      Generate Passport
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={lotsHref}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Export Data
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number | undefined;
  unit?: string;
}) {
  return (
    <div className="rounded-sm border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">
        {value !== undefined && value !== null && value !== ""
          ? `${value}${unit ? ` ${unit}` : ""}`
          : "—"}
      </p>
    </div>
  );
}

function SustainabilityCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null | undefined;
  unit: string;
  color: string;
}) {
  return (
    <div className="rounded-sm border border-border p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {value !== undefined && value !== null ? value : "—"}
        {value !== undefined && value !== null ? (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function DropletsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 10.99 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </svg>
  );
}

function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}

function RecycleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
      <path d="m14 16-3 3 3 3" />
      <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
      <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.217 5.561" />
      <path d="m14.5 9.5 4.25 2.5 2.25-3.5" />
    </svg>
  );
}
