"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Award,
  Beaker,
  CheckCircle2,
  ChevronDown,
  Droplets,
  FileCheck,
  Globe,
  Info,
  Leaf,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { dashboardPathFromPathname } from "@/lib/routes";
import type { Batch, ComplianceGap } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CERTIFICATIONS = [
  { key: "GOTS", name: "GOTS", icon: Leaf },
  { key: "GRS", name: "GRS", icon: RecycleIcon },
  { key: "OEKO-TEX", name: "OEKO-TEX", icon: ShieldCheckIcon },
  { key: "BSCI", name: "BSCI", icon: Users },
  { key: "FAIRTRADE", name: "Fair Trade", icon: Award },
  { key: "BIS IS 17243", name: "BIS IS 17243", icon: FileCheck },
] as const;

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

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ScoreColor(score: number) {
  if (score < 50) return "text-red-500";
  if (score < 75) return "text-amber-500";
  return "text-emerald-500";
}

function ScoreBg(score: number) {
  if (score < 50) return "bg-red-500";
  if (score < 75) return "bg-amber-500";
  return "bg-emerald-500";
}

function SeverityBadge({ severity }: { severity: ComplianceGap["severity"] }) {
  const variant =
    severity === "ERROR"
      ? "error"
      : severity === "WARNING"
        ? "warning"
        : "info";
  return <Badge variant={variant}>{severity}</Badge>;
}

export function TextileCompliancePage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const batchesHref = dashboardPathFromPathname(pathname, "batches");

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

  const score = selectedBatch?.compliance_score ?? 0;
  const gaps = selectedBatch?.compliance_gaps ?? [];
  const specs = selectedBatch?.specs;
  const certs = specs?.certifications ?? [];
  const market = selectedBatch?.market_region;

  const labor = specs?.labor_compliance;
  const chemical = specs?.chemical_compliance_zdhc;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl tracking-tight text-foreground">
              Textile Compliance Workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              Review compliance scores, certifications, and regulatory gaps for
              textile production lots.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={batchesHref}>Open Lots</Link>
            </Button>
          </div>
        </div>

        {loading && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-sm border border-red-200 bg-red-500/10 p-4 text-sm text-red-500">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {!loading && !error && !selectedBatch && (
          <div className="rounded-sm border border-border bg-card p-8 text-center">
            <FileCheck className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No textile lots found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a textile production lot to view compliance data.
            </p>
            <Button className="mt-4" asChild>
              <Link href={batchesHref}>Create Lot</Link>
            </Button>
          </div>
        )}

        {!loading && selectedBatch && (
          <>
            {/* Compliance Score Card */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                  Compliance Score
                </CardTitle>
                <CardDescription>
                  Overall compliance rating for{" "}
                  <span className="font-medium text-foreground">
                    {selectedBatch.batch_name}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4">
                  <span
                    className={`text-5xl font-semibold tracking-tight ${ScoreColor(score)}`}
                  >
                    {score}
                  </span>
                  <span className="mb-2 text-sm text-muted-foreground">
                    / 100
                  </span>
                </div>
                <div className="mt-4">
                  <Progress
                    value={score}
                    className="h-3 bg-muted"
                    indicatorClassName={ScoreBg(score)}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  {score >= 75 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-600">
                        Compliant — ready for passport generation
                      </span>
                    </>
                  ) : score >= 50 ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-amber-600">
                        Partial — gaps need attention
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">
                        Non-compliant — critical gaps found
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Gaps Table */}
            {gaps.length > 0 && (
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                    Compliance Gaps
                  </CardTitle>
                  <CardDescription>
                    {gaps.length} issue{gaps.length > 1 ? "s" : ""} identified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Regulation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gaps.map((gap, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-foreground">
                            {gap.field}
                          </TableCell>
                          <TableCell>{gap.message}</TableCell>
                          <TableCell>
                            <SeverityBadge severity={gap.severity} />
                          </TableCell>
                          <TableCell>{gap.regulation}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Certification Status Cards */}
            <div>
              <h2 className="text-lg font-medium tracking-tight text-foreground">
                Certifications
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CERTIFICATIONS.map((cert) => {
                  const hasCert = certs.some(
                    (c) =>
                      c.toUpperCase().replace(/\s/g, "") ===
                      cert.key.toUpperCase().replace(/\s/g, "")
                  );
                  return (
                    <Card
                      key={cert.key}
                      className="border border-border bg-card"
                    >
                      <CardContent className="flex items-center gap-4 pt-6">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-sm border ${
                            hasCert
                              ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
                              : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          <cert.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {cert.name}
                          </p>
                          <Badge
                            variant={hasCert ? "success" : "secondary"}
                            className="mt-1"
                          >
                            {hasCert ? "Valid" : "Missing"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* India QCO */}
            {(market === "INDIA" || market === "GLOBAL") && (
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                    India QCO Compliance
                  </CardTitle>
                  <CardDescription>
                    Bureau of Indian Standards textile certification status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-5 w-5 text-cyan-600" />
                    <span className="text-sm text-foreground">
                      BIS Certification:{" "}
                      {specs?.bis_number ? (
                        <Badge variant="success">Valid</Badge>
                      ) : (
                        <Badge variant="warning">Not Available</Badge>
                      )}
                    </span>
                  </div>
                  {specs?.bis_number && (
                    <div className="text-sm text-muted-foreground">
                      BIS Number:{" "}
                      <span className="font-medium text-foreground">
                        {specs.bis_number}
                      </span>
                    </div>
                  )}
                  {specs?.hsn_code && (
                    <div className="text-sm text-muted-foreground">
                      HSN Code:{" "}
                      <span className="font-medium text-foreground">
                        {specs.hsn_code}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* EU ESPR */}
            {(market === "EU" || market === "GLOBAL") && (
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                    EU ESPR Readiness
                  </CardTitle>
                  <CardDescription>
                    Ecodesign for Sustainable Products Regulation readiness
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-sm border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Fiber Composition
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {specs?.fiber_composition ? (
                          <span className="text-emerald-600">Complete</span>
                        ) : (
                          <span className="text-red-500">Incomplete</span>
                        )}
                      </p>
                    </div>
                    <div className="rounded-sm border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Expected Lifetime
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {specs?.expected_lifetime_washes ?? "—"}{" "}
                        {specs?.expected_lifetime_washes ? "washes" : ""}
                      </p>
                    </div>
                    <div className="rounded-sm border border-border p-4">
                      <p className="text-xs text-muted-foreground">
                        Recycled Content
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {specs?.recycled_content_pct ?? "—"}
                        {specs?.recycled_content_pct ? "%" : ""}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chemical Compliance */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                  Chemical Compliance
                </CardTitle>
                <CardDescription>
                  ZDHC MRSL and restricted substances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-cyan-600" />
                    <span className="text-sm text-muted-foreground">
                      ZDHC MRSL Level
                    </span>
                    <Badge variant="info">{chemical?.zdhc_level ?? "NA"}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-cyan-600" />
                    <span className="text-sm text-muted-foreground">
                      MRSL Tested
                    </span>
                    <Badge variant={chemical?.mrsl_tested ? "success" : "secondary"}>
                      {chemical?.mrsl_tested ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
                {chemical?.restricted_substances_found &&
                  chemical.restricted_substances_found.length > 0 && (
                    <div className="rounded-sm border border-red-200 bg-red-500/5 p-4">
                      <p className="flex items-center gap-2 text-sm font-medium text-red-600">
                        <ShieldAlert className="h-4 w-4" />
                        Restricted Substances Found
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-500">
                        {chemical.restricted_substances_found.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Labor Compliance */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                  Labor Compliance
                </CardTitle>
                <CardDescription>
                  Social compliance and audit status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ["SA8000", labor?.sa8000_certified],
                      ["BSCI", labor?.bsci_audited],
                      ["SEDEX", labor?.sedex_member],
                      ["Fair Trade", labor?.fair_trade_certified],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-sm border border-border p-3"
                    >
                      <span className="text-sm text-foreground">{label}</span>
                      {value ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-sm border border-border p-4">
                    <p className="text-xs text-muted-foreground">Audit Score</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-2xl font-semibold text-foreground">
                        {labor?.audit_score ?? "—"}
                      </span>
                      {typeof labor?.audit_score === "number" && (
                        <span className="mb-1 text-xs text-muted-foreground">
                          / 100
                        </span>
                      )}
                    </div>
                    {typeof labor?.audit_score === "number" && (
                      <Progress
                        value={labor.audit_score}
                        className="mt-2 h-2 bg-muted"
                        indicatorClassName={ScoreBg(labor.audit_score)}
                      />
                    )}
                  </div>
                  <div className="rounded-sm border border-border p-4">
                    <p className="text-xs text-muted-foreground">Last Audit</p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {labor?.audit_date
                        ? new Date(labor.audit_date).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
