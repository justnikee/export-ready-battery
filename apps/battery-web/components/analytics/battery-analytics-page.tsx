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
import { MoneyFunnelChart } from "@/components/analytics/MoneyFunnelChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanStatsCard } from "@/components/analytics/ScanStatsCard";
import { DeviceChart } from "@/components/analytics/DeviceChart";
import { CountryChart } from "@/components/analytics/CountryChart";
import { LiveScanFeed } from "@/components/analytics/LiveScanFeed";
import { ComplianceTrendChart } from "@/components/analytics/compliance-trend-chart";
import { CertificateExpiryChart } from "@/components/analytics/certificate-expiry-chart";
import { StatusDistributionChart } from "@/components/analytics/status-distribution-chart";
import { subscribeScanFeedStream } from "@/lib/scan-feed-stream";
import api from "@/lib/api";
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
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ActionFeedItem, ExpiringCertDetail, AnalyticsOverview } from "@/lib/types";

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
  }, [refetchCompliance, refetchGaps, refetchAction, refetchDGFT, fetchScanAnalytics]);

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
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent"></div>
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
    <div className="min-h-screen bg-sidebar p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl text-foreground tracking-tight flex items-center gap-3">
              <div className="p-2 rounded bg-emerald-500/10">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
              </div>
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fulfillment dashboards and compliance insights
            </p>
          </div>
          <Button
            onClick={refreshAll}
            disabled={refreshing}
            variant="outline"
            className="text-foreground hover:bg-accent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="compliance" className="w-full">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="compliance" className="data-[state=active]:bg-background">
              Compliance Posture
            </TabsTrigger>
            <TabsTrigger value="money" className="data-[state=active]:bg-background">
              Money & Incentives
            </TabsTrigger>
            <TabsTrigger value="scans" className="data-[state=active]:bg-background">
              Scan Analytics
            </TabsTrigger>
          </TabsList>

          {/* Compliance Posture Tab (P0) */}
          <TabsContent value="compliance" className="space-y-6 mt-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <ScanStatsCard
                icon={<Shield className="h-5 w-5" />}
                label="Compliance Ready Batches"
                value={complianceData?.compliance_ready_count ?? 0}
                iconColor="text-emerald-500"
                bgColor="bg-emerald-500/10"
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
              />
              <ScanStatsCard
                icon={<AlertTriangle className="h-5 w-5" />}
                label="Active Compliance Gaps"
                value={
                  gapsData?.reduce((sum: number, g: any) => sum + g.count, 0) ?? 0
                }
                iconColor="text-amber-500"
                bgColor="bg-amber-500/10"
              />
            </div>

            {/* Trends and Expiry */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-500" />
                    Compliance Score Trend (12 weeks)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ComplianceTrendChart data={complianceData?.compliance_trend || []} />
                </CardContent>
              </Card>

              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Certificate Expiry Outlook
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CertificateExpiryChart data={complianceData?.certificate_expiry || []} />
                </CardContent>
              </Card>
            </div>

            {/* Expiring Certificate Details Command Center */}
            {complianceData?.expiring_certificates && complianceData.expiring_certificates.length > 0 && (
              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-red-500" />
                    Certificate Expiry Command Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-medium">
                          <th className="py-2">Batch</th>
                          <th className="py-2">Certificate Type</th>
                          <th className="py-2">Expiry Date</th>
                          <th className="py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complianceData.expiring_certificates.map((cert: ExpiringCertDetail, index: number) => {
                          const date = new Date(cert.expiry_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });
                          const isExpired = cert.days_left <= 0;
                          return (
                            <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/10">
                              <td className="py-3 font-medium text-foreground">{cert.batch_name}</td>
                              <td className="py-3 text-muted-foreground">{cert.cert_type}</td>
                              <td className="py-3 text-muted-foreground">{date}</td>
                              <td className="py-3 text-right">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  isExpired 
                                    ? "bg-red-500/10 text-red-500" 
                                    : cert.days_left <= 7 
                                      ? "bg-amber-500/10 text-amber-500 animate-pulse" 
                                      : "bg-blue-500/10 text-blue-500"
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
              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Open Gaps by Regulation Article
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GapHeatmap data={gapsData || []} />
                </CardContent>
              </Card>

              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    Priority Action Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[420px] overflow-y-auto">
                  {actionData && actionData.length > 0 ? (
                    actionData.map((item: ActionFeedItem, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors">
                        <div className={`p-2 rounded shrink-0 ${
                          item.severity === "ERROR" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                        }`}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground leading-none">{item.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
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
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <span className="text-sm font-medium">All caught up! No urgent actions required.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Distribution Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
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

              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-500" />
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

              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-cyan-500" />
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

              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-500" />
                    Supplier Docs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusDistributionChart
                    data={toStatusItems(complianceData?.supplier_document_status || {})}
                    colors={["#f59e0b", "#059669", "#ef4444"]}
                    emptyMessage="No supplier docs"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Money & Incentives Tab (P0-4) */}
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
                />
                <ScanStatsCard
                  icon={<Award className="h-5 w-5" />}
                  label="Eligible Incentives"
                  value={formatCurrency(dgftData?.total_eligible_value ?? 0)}
                  iconColor="text-blue-500"
                  bgColor="bg-blue-500/10"
                />
                <ScanStatsCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label="DGFT Approval Rate"
                  value={`${(dgftData?.approval_rate ?? 0).toFixed(1)}%`}
                  iconColor="text-purple-500"
                  bgColor="bg-purple-500/10"
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
                />
              </div>

              {/* DGFT Claim Value Chart */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="bg-transparent border-border lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-blue-500" />
                      Incentives by DGFT Scheme
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dgftData ? (
                      <MoneyFunnelChart data={dgftData} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No financial data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* EPR target forecasts & obligation status */}
                <Card className="bg-transparent border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-emerald-500" />
                      EPR Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* India EPR obligation summary details */}
                    <div>
                      <span className="text-sm font-medium text-foreground">Annual Compliance Targets</span>
                      <p className="text-xs text-muted-foreground mt-1">Status of annual battery recycling targets under India BWM Rules.</p>
                    </div>
                    {complianceData?.alert_severity_breakdown && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Shortfall Penalty Exposure</span>
                          <span className="font-semibold text-foreground">₹0</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">ECC Status</span>
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                            Clear
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </FeatureGate>
          </TabsContent>

          {/* Scan Analytics Tab */}
          <TabsContent value="scans" className="space-y-6 mt-6">
            <FeatureGate feature="advanced_analytics">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <ScanStatsCard
                  icon={<Activity className="h-5 w-5" />}
                  label="Total Scans"
                  value={scanData.totalScans}
                  iconColor="text-blue-500"
                  bgColor="bg-blue-500/10"
                />
                <ScanStatsCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  label="Today's Scans"
                  value={scanData.todayScans}
                  iconColor="text-emerald-500"
                  bgColor="bg-emerald-500/10"
                />
                <ScanStatsCard
                  icon={<Globe className="h-5 w-5" />}
                  label="Countries"
                  value={uniqueCountries}
                  iconColor="text-purple-600"
                  bgColor="bg-purple-500/10"
                />
                <ScanStatsCard
                  icon={<Smartphone className="h-5 w-5" />}
                  label="Device Types"
                  value={scanData.deviceBreakdown.length}
                  iconColor="text-amber-500"
                  bgColor="bg-amber-500/10"
                />
              </div>

              {/* Charts and Feed Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-transparent border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Globe className="h-5 w-5 text-purple-600" />
                        Scans by Country
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {scanData.countryBreakdown.length > 0 ? (
                        <CountryChart data={scanData.countryBreakdown} />
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No scan data available yet
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-transparent border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-emerald-500" />
                        Global Scan Activity
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
                        height={320}
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-transparent border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-amber-500" />
                        Device Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {scanData.deviceBreakdown.length > 0 ? (
                        <DeviceChart data={scanData.deviceBreakdown} />
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No scan data available yet
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card className="bg-transparent border-border h-full">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Activity className="h-5 w-5 text-emerald-500" />
                        Live Scan Feed
                        <span className="ml-auto flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500/100"></span>
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                      <LiveScanFeed scans={scanData.scans} />
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
