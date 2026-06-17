"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanStatsCard } from "@/components/analytics/ScanStatsCard";
import { DeviceChart } from "@/components/analytics/DeviceChart";
import { CountryChart } from "@/components/analytics/CountryChart";
import { LiveScanFeed } from "@/components/analytics/LiveScanFeed";
import { ComplianceTrendChart } from "@/components/analytics/compliance-trend-chart";
import { CertificateExpiryChart } from "@/components/analytics/certificate-expiry-chart";
import { StatusDistributionChart } from "@/components/analytics/status-distribution-chart";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface ScanFeedItem {
  city: string;
  country: string;
  device_type: string;
  scanned_at: string;
  serial_number: string;
  batch_name: string;
}

interface ScanAnalyticsData {
  scans: ScanFeedItem[];
  totalScans: number;
  countryBreakdown: { country: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  todayScans: number;
}

interface ComplianceTrendPoint {
  period: string;
  avg_score: number;
  batch_count: number;
}

interface CertExpiryItem {
  cert_type: string;
  expiring_30d: number;
  expiring_7d: number;
  expired: number;
}

interface RegionItem {
  region: string;
  count: number;
}

interface StatusCountItem {
  status: string;
  count: number;
}

interface ComplianceAnalyticsData {
  compliance_trend: ComplianceTrendPoint[];
  certificate_expiry: CertExpiryItem[];
  carbon_distribution: { class: string; count: number }[];
  batch_status_breakdown: Record<string, number>;
  market_region_split: RegionItem[];
  supplier_document_status: Record<string, number>;
  dgft_claim_funnel: StatusCountItem[];
  alert_severity_breakdown: Record<string, number>;
}

function toStatusItems(record: Record<string, number>): { name: string; value: number }[] {
  return Object.entries(record).map(([name, value]) => ({ name, value }));
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [scanLoading, setScanLoading] = useState(true);
  const [complianceLoading, setComplianceLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [scanData, setScanData] = useState<ScanAnalyticsData>({
    scans: [],
    totalScans: 0,
    countryBreakdown: [],
    deviceBreakdown: [],
    todayScans: 0,
  });

  const [complianceData, setComplianceData] = useState<ComplianceAnalyticsData>({
    compliance_trend: [],
    certificate_expiry: [],
    carbon_distribution: [],
    batch_status_breakdown: {},
    market_region_split: [],
    supplier_document_status: {},
    dgft_claim_funnel: [],
    alert_severity_breakdown: {},
  });

  const fetchScanAnalytics = useCallback(async (showRefresh = false) => {
    if (!user) return;
    if (showRefresh) setRefreshing(true);

    try {
      const response = await api.get(`/scans/feed?tenant_id=${user.tenant_id}&limit=50`);
      const scans: ScanFeedItem[] = response.data.scans || [];

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

      setScanData({
        scans,
        totalScans: scans.length,
        countryBreakdown,
        deviceBreakdown,
        todayScans: todayCount,
      });
    } catch {
      toast.error("Failed to load scan analytics");
    } finally {
      setScanLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  }, [user]);

  const fetchComplianceAnalytics = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.get("/analytics/overview");
      const data = response.data || {};
      setComplianceData({
        compliance_trend: data.compliance_trend || [],
        certificate_expiry: data.certificate_expiry || [],
        carbon_distribution: data.carbon_distribution || [],
        batch_status_breakdown: data.batch_status_breakdown || {},
        market_region_split: data.market_region_split || [],
        supplier_document_status: data.supplier_document_status || {},
        dgft_claim_funnel: data.dgft_claim_funnel || [],
        alert_severity_breakdown: data.alert_severity_breakdown || {},
      });
    } catch {
      toast.error("Failed to load compliance analytics");
    } finally {
      setComplianceLoading(false);
    }
  }, [user]);

  const refreshAll = useCallback(() => {
    fetchScanAnalytics(true);
    fetchComplianceAnalytics();
  }, [fetchScanAnalytics, fetchComplianceAnalytics]);

  useEffect(() => {
    fetchScanAnalytics();
    fetchComplianceAnalytics();
    const interval = setInterval(() => {
      fetchScanAnalytics();
      fetchComplianceAnalytics();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchScanAnalytics, fetchComplianceAnalytics]);

  const uniqueCountries = scanData.countryBreakdown.length;

  const isLoading = scanLoading || complianceLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl text-foreground tracking-tight flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
              </div>
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Scan activity and compliance insights
            </p>
          </div>
          <Button
            onClick={refreshAll}
            disabled={refreshing}
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="scans" className="w-full">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="scans" className="data-[state=active]:bg-background">
              Scan Analytics
            </TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-background">
              Compliance & Operations
            </TabsTrigger>
          </TabsList>

          {/* Scan Analytics Tab */}
          <TabsContent value="scans" className="space-y-6 mt-6">
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
          </TabsContent>

          {/* Compliance & Operations Tab */}
          <TabsContent value="compliance" className="space-y-6 mt-6">
            {/* Top Row: Compliance Trend + Certificate Expiry */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-500" />
                    Compliance Score Trend (12 weeks)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ComplianceTrendChart data={complianceData.compliance_trend} />
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
                  <CertificateExpiryChart data={complianceData.certificate_expiry} />
                </CardContent>
              </Card>
            </div>

            {/* Middle Row: Distribution Charts */}
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
                    data={toStatusItems(complianceData.batch_status_breakdown)}
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
                    data={complianceData.carbon_distribution.map((d) => ({
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
                    data={complianceData.market_region_split.map((d) => ({
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
                    data={toStatusItems(complianceData.supplier_document_status)}
                    colors={["#f59e0b", "#059669", "#ef4444"]}
                    emptyMessage="No supplier docs"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row: DGFT + Alerts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-blue-500" />
                    DGFT Claim Funnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {complianceData.dgft_claim_funnel.length > 0 ? (
                    <div className="space-y-3">
                      {complianceData.dgft_claim_funnel.map((item) => (
                        <div key={item.status} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground capitalize">
                              {item.status}
                            </span>
                            <span className="font-medium">{item.count}</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (item.count /
                                    Math.max(
                                      1,
                                      complianceData.dgft_claim_funnel[0]?.count || 1
                                    )) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No DGFT claims yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-transparent border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Alert Severity Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusDistributionChart
                    data={toStatusItems(complianceData.alert_severity_breakdown)}
                    colors={["#3b82f6", "#f59e0b", "#ef4444"]}
                    emptyMessage="No alerts"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
