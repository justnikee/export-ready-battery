import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { BarChart3, Globe, Smartphone, Activity, RefreshCw } from "lucide-react";

interface ScanFeedItem {
  city: string;
  country: string;
  device_type: string;
  scanned_at: string;
}

interface AnalyticsData {
  scans: ScanFeedItem[];
  totalScans: number;
  countryBreakdown: { country: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  todayScans: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsData>({
    scans: [],
    totalScans: 0,
    countryBreakdown: [],
    deviceBreakdown: [],
    todayScans: 0,
  });

  const fetchAnalytics = useCallback(async (showRefresh = false) => {
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
        if (new Date(scan.scanned_at).toDateString() === today) todayCount++;
      });

      const countryBreakdown = Array.from(countryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const deviceBreakdown = Array.from(deviceMap.entries())
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count);

      setData({ scans, totalScans: scans.length, countryBreakdown, deviceBreakdown, todayScans: todayCount });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(), 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
            </div>
            Scan Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track QR code scans and passport verifications</p>
        </div>
        <button onClick={() => fetchAnalytics(true)} disabled={refreshing} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { icon: Activity, label: "Total Scans", value: data.totalScans, color: "blue", bg: "bg-blue-500/10", text: "text-blue-500" },
          { icon: BarChart3, label: "Today's Scans", value: data.todayScans, color: "emerald", bg: "bg-emerald-500/10", text: "text-emerald-500" },
          { icon: Globe, label: "Countries", value: data.countryBreakdown.length, color: "purple", bg: "bg-purple-500/10", text: "text-purple-600" },
          { icon: Smartphone, label: "Device Types", value: data.deviceBreakdown.length, color: "amber", bg: "bg-amber-500/10", text: "text-amber-500" },
        ].map((stat) => (
          <div key={stat.label} className="relative bg-transparent border border-border rounded-none p-5"><div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{stat.label}</span>
              <div className={`w-8 h-8 ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.text}`} />
              </div>
            </div>
            <div className="font-mono text-3xl text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative bg-transparent border border-border rounded-none overflow-visible"><div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-medium text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" /> Scans by Country
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {data.countryBreakdown.length > 0 ? data.countryBreakdown.map((c) => (
              <div key={c.country} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{c.country}</span>
                <span className="font-mono text-muted-foreground">{c.count}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">No scan data available yet</div>
            )}
          </div>
        </div>

        <div className="relative bg-transparent border border-border rounded-none overflow-visible"><div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-medium text-foreground flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-amber-500" /> Device Distribution
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {data.deviceBreakdown.length > 0 ? data.deviceBreakdown.map((d) => (
              <div key={d.device} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{d.device}</span>
                <span className="font-mono text-muted-foreground">{d.count}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">No scan data available yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="relative bg-transparent border border-border rounded-none overflow-visible"><div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-medium text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" /> Live Scan Feed
          </h3>
        </div>
        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
          {data.scans.slice(0, 20).map((scan, i) => (
            <div key={i} className="px-6 py-3 flex items-center gap-3 hover:bg-accent">
              <Activity className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{scan.device_type || "Unknown device"}</p>
                <p className="text-xs text-muted-foreground">{scan.city || "Unknown"}, {scan.country || "Unknown"}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(scan.scanned_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
