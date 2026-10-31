"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/auth-context";
import { useEntitlements } from "@/hooks/use-entitlements";
import { 
  useAnalyticsOverview, 
  useGapsByRegulation, 
  useActionFeed, 
  useDGFTValue 
} from "@/hooks/use-queries";
import { FeatureGate } from "@/components/billing/feature-gate";
import { GapHeatmap } from "@/components/analytics/GapHeatmap";
import { EPRComplianceTracker } from "@/components/analytics/EPRComplianceTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanStatsCard } from "@/components/analytics/ScanStatsCard";
import { LiveScanFeed } from "@/components/analytics/LiveScanFeed";
import { subscribeScanFeedStream } from "@/lib/scan-feed-stream";
import api from "@/lib/api";

const MoneyFunnelChart = dynamic(
  () => import("@/components/analytics/MoneyFunnelChart").then((mod) => mod.MoneyFunnelChart),
  { ssr: false }
);
const DeviceChart = dynamic(
  () => import("@/components/analytics/DeviceChart").then((mod) => mod.DeviceChart),
  { ssr: false }
);
const CountryChart = dynamic(
  () => import("@/components/analytics/CountryChart").then((mod) => mod.CountryChart),
  { ssr: false }
);
const ComplianceTrendChart = dynamic(
  () => import("@/components/analytics/compliance-trend-chart").then((mod) => mod.ComplianceTrendChart),
  { ssr: false }
);
const CertificateExpiryChart = dynamic(
  () => import("@/components/analytics/certificate-expiry-chart").then((mod) => mod.CertificateExpiryChart),
  { ssr: false }
);
const StatusDistributionChart = dynamic(
  () => import("@/components/analytics/status-distribution-chart").then((mod) => mod.StatusDistributionChart),
  { ssr: false }
);
import {
  BarChart3,
  Globe,
  Smartphone,
  Activity,
  RefreshCw,
  Shield,
  Award,
  FileCheck,
  AlertTriangle,
  Landmark,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Zap,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ActionFeedItem, ExpiringCertDetail } from "@/lib/types";

const ScanMap = dynamic(
  () => import("@/components/dashboard/ScanMap").then((mod) => mod.ScanMap),
  { ssr: false },
);

interface ScanFeedItem {
  city: string;
  country: string;
  device_type: string;
  scanned_at: string;
  serial_number: string;
  latitude?: number;
  longitude?: number;
  batch_name: string;
}

interface ScanAnalyticsData {
  scans: ScanFeedItem[];
  totalScans: number;
  countryBreakdown: { country: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  todayScans: number;
}

function toStatusItems(record: Record<string, number>): { name: string; value: number }[] {
  return Object.entries(record).map(([name, value]) => ({ name, value }));
}

function computeScanAggregates(scans: ScanFeedItem[]) {
  const countryMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const today = new Date().toDateString();
  let todayCount = 0;

  scans.forEach((scan) => {
    const country = scan.country || "Unknown";
    countryMap.set(country, (countryMap.get(country) || 0) + 1);
    const device = scan.device_type || "Unknown";
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    if (new Date(scan.scanned_at).toDateString() === today) {
      todayCount++;
    }
  });

  const countryBreakdown = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const deviceBreakdown = Array.from(deviceMap.entries())
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  return { countryBreakdown, deviceBreakdown, todayScans: todayCount };
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { has } = useEntitlements();
  const hasAdvanced = has("advanced_analytics");

  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  // TanStack Queries for Compliance Posture (P0)
  const { 
    data: complianceData, 
    isLoading: complianceLoading, 
    refetch: refetchCompliance 
  } = useAnalyticsOverview(user?.tenant_id);

  const { 
    data: gapsData, 
    isLoading: gapsLoading, 
    refetch: refetchGaps 
  } = useGapsByRegulation(user?.tenant_id);

  const { 
    data: actionData, 
    isLoading: actionLoading, 
    refetch: refetchAction 
  } = useActionFeed(user?.tenant_id);

  // TanStack Query for Financial Analytics (Gated)
  const { 
    data: dgftData, 
    isLoading: dgftLoading, 
    refetch: refetchDGFT 
  } = useDGFTValue(user?.tenant_id, hasAdvanced);

  // Local state for scan feed (SSE-updated)
  const [scanLoading, setScanLoading] = useState(true);
  const [scanData, setScanData] = useState<ScanAnalyticsData>({
    scans: [],
    totalScans: 0,
    countryBreakdown: [],
    deviceBreakdown: [],
    todayScans: 0,
  });

  const [refreshing, setRefreshing] = useState(false);

  const fetchScanAnalytics = useCallback(async (showRefresh = false) => {
    if (!user || !hasAdvanced) {
      setScanLoading(false);
      return;
    }
    if (showRefresh) setRefreshing(true);

    try {
      const response = await api.get(`/scans/feed?limit=50`);
      const scans: ScanFeedItem[] = response.data.scans || [];
      const totalScans = response.data.total ?? response.data.total_count ?? scans.length;
      const { countryBreakdown, deviceBreakdown, todayScans } = computeScanAggregates(scans);

      setScanData({
        scans,
        totalScans,
        countryBreakdown,
        deviceBreakdown,
        todayScans,
      });
    } catch {
      toast.error("Failed to load scan analytics");
    } finally {
      setScanLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  }, [user, hasAdvanced]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchCompliance(),
      refetchGaps(),
      refetchAction(),
      refetchDGFT(),
      fetchScanAnalytics(false)
    ]);
    setRefreshing(false);
    toast.success("Analytics refreshed");
  }, [refetchCompliance, refetchGaps, refetchAction, refetchDGFT, fetchScanAnalytics]);

  const handleSimulateScan = useCallback(() => {
    const sampleCities = [
      { city: "Ludhiana", country: "India", lat: 30.901, lng: 75.8573 },
      { city: "New Delhi", country: "India", lat: 28.6139, lng: 77.209 },
      { city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
      { city: "Stuttgart", country: "Germany", lat: 48.7758, lng: 9.1829 },
      { city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
      { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
    ];
    const loc = sampleCities[Math.floor(Math.random() * sampleCities.length)];
    const devices = ["Mobile", "Desktop", "Tablet"];
    const dev = devices[Math.floor(Math.random() * devices.length)];
    const serial = `EU-LFP-2026-${Math.floor(Math.random() * 9000 + 1000)}`;

    const newScan: ScanFeedItem = {
      serial_number: serial,
      batch_name: "Q2-8-2026 Batch",
      city: loc.city,
      country: loc.country,
      device_type: dev,
      scanned_at: new Date().toISOString(),
      latitude: loc.lat,
      longitude: loc.lng,
    };

    setScanData((prev) => {
      const scans = [newScan, ...prev.scans].slice(0, 50);
      const { countryBreakdown, deviceBreakdown } = computeScanAggregates(scans);
      return {
        scans,
        totalScans: prev.totalScans + 1,
        countryBreakdown,
        deviceBreakdown,
        todayScans: prev.todayScans + 1,
      };
    });

    toast.success(`⚡ Scan Recorded: ${loc.city}, ${loc.country} (${serial})`);
  }, []);

  // Initial Scan Fetch
  useEffect(() => {
    fetchScanAnalytics();
  }, [fetchScanAnalytics]);

  // Live scan feed via SSE — only if tenant has Advanced Analytics
  useEffect(() => {
    if (!user || !hasAdvanced) return;
    const unsubscribe = subscribeScanFeedStream((scan) => {
      setScanData((prev) => {
        const scans = [scan, ...prev.scans].slice(0, 50);
        const { countryBreakdown, deviceBreakdown, todayScans } = computeScanAggregates(scans);
        return {
          scans,
          totalScans: prev.totalScans + 1,
          countryBreakdown,
          deviceBreakdown,
          todayScans,
        };
      });
    });
    return unsubscribe;
  }, [user, hasAdvanced]);

  const uniqueCountries = scanData.countryBreakdown.length;
  const isLoading = complianceLoading || gapsLoading || actionLoading || (hasAdvanced && (dgftLoading || scanLoading));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center space-y-4">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <p className="text-xs text-muted-foreground font-medium animate-pulse">
          Loading Analytics Dashboard...
        </p>
      </div>
    );
  }

  // Format currency in Indian Rupees
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-sidebar p-4 md:p-6 space-y-6">
      <div className="w-full mx-auto space-y-6">
        
        {/* Glassmorphic Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/80 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Executive Analytics
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Live
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time compliance posture, DGFT incentive realization, and global scan intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="hidden sm:flex items-center p-1 rounded-lg bg-muted/60 border border-border/60 text-xs">
              {(["7d", "30d", "90d", "all"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    dateRange === r
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "7d" ? "7D" : r === "30d" ? "30D" : r === "90d" ? "90D" : "All"}
                </button>
              ))}
            </div>

            <Button
              onClick={refreshAll}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="text-xs text-foreground hover:bg-accent border-border/80"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <Tabs defaultValue="compliance" className="w-full">
          <TabsList className="bg-card/70 backdrop-blur-md border border-border/80 p-1 rounded-xl w-fit inline-flex justify-start gap-1">
            <TabsTrigger
              value="compliance"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs font-semibold px-4 py-2 flex items-center gap-2"
            >
              <Shield className="h-4 w-4 text-emerald-500" />
              Compliance Posture
            </TabsTrigger>
            <TabsTrigger
              value="money"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs font-semibold px-4 py-2 flex items-center gap-2"
            >
              <Landmark className="h-4 w-4 text-blue-500" />
              Money & Incentives
            </TabsTrigger>
            <TabsTrigger
              value="scans"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs font-semibold px-4 py-2 flex items-center gap-2"
            >
              <Globe className="h-4 w-4 text-purple-500" />
              Scan Analytics
            </TabsTrigger>
          </TabsList>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: COMPLIANCE POSTURE */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <TabsContent value="compliance" className="space-y-6 mt-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <ScanStatsCard
                icon={<Shield className="h-5 w-5" />}
                label="Compliance Ready Batches"
                value={complianceData?.compliance_ready_count ?? 0}
                iconColor="text-emerald-500"
                bgColor="bg-emerald-500/10"
                subtext="Passports fully validated for EU/India export"
              />
              <ScanStatsCard
                icon={<Activity className="h-5 w-5" />}
                label="Avg Compliance Score"
                value={
                  complianceData?.compliance_trend?.length
                    ? `${(
                        complianceData.compliance_trend.reduce((sum: number, p: any) => sum + p.avg_score, 0) /
                        complianceData.compliance_trend.length
                      ).toFixed(1)}%`
                    : "0%"
                }
                iconColor="text-blue-500"
                bgColor="bg-blue-500/10"
                subtext="Calculated across active production batches"
              />
              <ScanStatsCard
                icon={<AlertTriangle className="h-5 w-5" />}
                label="Active Compliance Gaps"
                value={
                  gapsData?.reduce((sum: number, g: any) => sum + g.count, 0) ?? 0
                }
                iconColor="text-amber-500"
                bgColor="bg-amber-500/10"
                subtext="Articles requiring documentation resolution"
              />
            </div>

            {/* Trends and Expiry */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-sm font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <span>Compliance Score Trend (12 Weeks)</span>
                    </div>
                    <span className="text-xs font-normal text-muted-foreground">Target ≥80%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ComplianceTrendChart data={complianceData?.compliance_trend || []} />
                </CardContent>
              </Card>

              <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-sm font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <span>Certificate Expiry Outlook</span>
                    </div>
                    <span className="text-xs font-normal text-muted-foreground">30/60/90 Days</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CertificateExpiryChart data={complianceData?.certificate_expiry || []} />
                </CardContent>
              </Card>
            </div>

            {/* Expiring Certificate Details Command Center */}
            {complianceData?.expiring_certificates && complianceData.expiring_certificates.length > 0 && (
              <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-red-500/10 text-red-500">
                        <Clock className="h-4 w-4" />
                      </div>
                      <span>Certificate Expiry Command Center</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {complianceData.expiring_certificates.length} item(s) require action
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3">Batch Name</th>
                          <th className="py-2.5 px-3">Certificate Type</th>
                          <th className="py-2.5 px-3">Expiry Date</th>
                          <th className="py-2.5 px-3 text-right">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {complianceData.expiring_certificates.map((cert: ExpiringCertDetail, index: number) => {
                          const date = new Date(cert.expiry_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });
                          const isExpired = cert.days_left <= 0;
                          return (
                            <tr key={index} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-3 font-semibold text-foreground">{cert.batch_name}</td>
                              <td className="py-3 px-3 text-muted-foreground">{cert.cert_type}</td>
                              <td className="py-3 px-3 text-muted-foreground">{date}</td>
                              <td className="py-3 px-3 text-right">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                  isExpired 
                                    ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                                    : cert.days_left <= 7 
                                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse" 
                                      : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                }`}>
                                  {isExpired ? "Expired" : `${cert.days_left} days left`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gap Heatmap & Action Feed */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <span>Open Gaps by Regulation Article</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GapHeatmap data={gapsData || []} />
                </CardContent>
              </Card>

              <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500">
                      <Activity className="h-4 w-4" />
                    </div>
                    <span>Priority Action Feed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[420px] overflow-y-auto">
                  {actionData && actionData.length > 0 ? (
                    actionData.map((item: ActionFeedItem, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card/40 hover:bg-card/80 transition-colors">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          item.severity === "ERROR" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-foreground leading-snug">{item.title}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span className="capitalize">{item.type.toLowerCase().replace(/_/g, " ")}</span>
                            {item.due_date && (
                              <>
                                <span>•</span>
                                <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <span className="text-xs font-semibold text-foreground">All caught up! No urgent actions required.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Distribution Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-xs font-semibold flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-blue-500" />
                    Batch Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusDistributionChart
                    data={toStatusItems(complianceData?.batch_status_breakdown || {})}
                    emptyMessage="No batches yet"
                  />
                </CardContent>
              </Card>

              <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-xs font-semibold flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-purple-500" />
                    Carbon Class
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusDistributionChart
                    data={(complianceData?.carbon_distribution || []).map((d: any) => ({
                      name: d.class,
                      value: d.count,
                    }))}
                    emptyMessage="No carbon data"
                  />
                </CardContent>
              </Card>

              <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-xs font-semibold flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-cyan-500" />
                    Market Regions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusDistributionChart
                    data={(complianceData?.market_region_split || []).map((d: any) => ({
                      name: d.region,
                      value: d.count,
                    }))}
                    emptyMessage="No region data"
                  />
                </CardContent>
              </Card>

              <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-xs font-semibold flex items-center gap-2">
                    <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Supplier Docs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusDistributionChart
                    data={toStatusItems(complianceData?.supplier_document_status || {})}
                    colors={["#f59e0b", "#10b981", "#ef4444"]}
                    emptyMessage="No supplier docs"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: MONEY & INCENTIVES */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <TabsContent value="money" className="space-y-6 mt-6">
            <FeatureGate feature="advanced_analytics">
              {/* Money KPI Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <ScanStatsCard
                  icon={<Landmark className="h-5 w-5" />}
                  label="Claimed Incentives"
                  value={formatCurrency(dgftData?.total_claimed_value ?? 0)}
                  iconColor="text-emerald-500"
                  bgColor="bg-emerald-500/10"
                  subtext="RoDTEP, RoSCTL & DBK claims disbursed"
                />
                <ScanStatsCard
                  icon={<Award className="h-5 w-5" />}
                  label="Eligible Incentives"
                  value={formatCurrency(dgftData?.total_eligible_value ?? 0)}
                  iconColor="text-blue-500"
                  bgColor="bg-blue-500/10"
                  subtext="Total potential incentive pool"
                />
                <ScanStatsCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label="DGFT Approval Rate"
                  value={`${(dgftData?.approval_rate ?? 0).toFixed(1)}%`}
                  iconColor="text-purple-500"
                  bgColor="bg-purple-500/10"
                  subtext="Percentage of claims approved by DGFT"
                />
                <ScanStatsCard
                  icon={<Clock className="h-5 w-5" />}
                  label="Avg Approval Time"
                  value={
                    dgftData?.avg_approval_days 
                      ? `${dgftData.avg_approval_days.toFixed(1)} Days` 
                      : "0 Days"
                  }
                  iconColor="text-amber-500"
                  bgColor="bg-amber-500/10"
                  subtext="Average turnaround time from submission"
                />
              </div>

              {/* DGFT Claim Value Chart & EPR Position */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="bg-card/70 backdrop-blur-md border border-border/80 lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-foreground text-sm font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-blue-500/10 text-blue-500">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <span>Incentives Realization by DGFT Scheme</span>
                      </div>
                      <span className="text-xs font-normal text-muted-foreground">Incentive Breakdown</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dgftData ? (
                      <MoneyFunnelChart data={dgftData} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
                        <Landmark className="h-8 w-8 text-blue-500/50 mb-2" />
                        <span>No scheme financial data available yet.</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* EPR Position Component */}
                <EPRComplianceTracker
                  claimedValue={dgftData?.total_claimed_value}
                  eligibleValue={dgftData?.total_eligible_value}
                />
              </div>
            </FeatureGate>
          </TabsContent>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: SCAN ANALYTICS */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <TabsContent value="scans" className="space-y-6 mt-6">
            <FeatureGate feature="advanced_analytics">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <ScanStatsCard
                  icon={<Activity className="h-5 w-5" />}
                  label="Total Passport Scans"
                  value={scanData.totalScans}
                  iconColor="text-blue-500"
                  bgColor="bg-blue-500/10"
                  subtext="Cumulative QR code scan events"
                />
                <ScanStatsCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  label="Today's Scans"
                  value={scanData.todayScans}
                  iconColor="text-emerald-500"
                  bgColor="bg-emerald-500/10"
                  subtext="Passport verifications today"
                />
                <ScanStatsCard
                  icon={<Globe className="h-5 w-5" />}
                  label="Countries"
                  value={uniqueCountries}
                  iconColor="text-purple-500"
                  bgColor="bg-purple-500/10"
                  subtext="Unique geographic scan locations"
                />
                <ScanStatsCard
                  icon={<Smartphone className="h-5 w-5" />}
                  label="Device Categories"
                  value={scanData.deviceBreakdown.length}
                  iconColor="text-amber-500"
                  bgColor="bg-amber-500/10"
                  subtext="Mobile, Desktop & IoT readers"
                />
              </div>

              {/* Charts and Feed Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-foreground text-sm font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-purple-500/10 text-purple-500">
                            <Globe className="h-4 w-4" />
                          </div>
                          <span>Top Geographic Markets by Scan Volume</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Top 10 Countries</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {scanData.countryBreakdown.length > 0 ? (
                        <CountryChart data={scanData.countryBreakdown} />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
                          <Globe className="h-8 w-8 text-purple-500/50 mb-2" />
                          <span>No country scan data recorded yet</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
                        <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <span>Global Scan Activity Map</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScanMap
                        scans={scanData.scans.map((s) => ({
                          city: s.city || "Unknown",
                          country: s.country || "Unknown",
                          latitude: s.latitude ?? 0,
                          longitude: s.longitude ?? 0,
                          scanned_at: s.scanned_at,
                        }))}
                        height={420}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Live Passport Stream */}
                  <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-foreground text-sm font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500">
                            <Sparkles className="h-4 w-4 animate-spin-slow" />
                          </div>
                          <span>Live Passport Stream</span>
                        </div>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <LiveScanFeed scans={scanData.scans} />
                    </CardContent>
                  </Card>

                  {/* Scanner Device Distribution */}
                  <Card className="bg-card/70 backdrop-blur-md border border-border/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
                        <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <span>Scanner Device Distribution</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {scanData.deviceBreakdown.length > 0 ? (
                        <DeviceChart data={scanData.deviceBreakdown} />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
                          <Smartphone className="h-8 w-8 text-amber-500/50 mb-2" />
                          <span>No device scan data recorded yet</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </FeatureGate>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
