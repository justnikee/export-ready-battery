"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import {
  getRegulatoryItems,
  getRegulatoryAlerts,
  markRegulatoryAlertRead,
  dismissRegulatoryAlert,
  getRegulatorySources,
  forceFetchSource,
} from "@/lib/api/regulatory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Newspaper,
  AlertTriangle,
  Clock,
  ExternalLink,
  Check,
  X,
  RefreshCw,
  Globe,
  Filter,
} from "lucide-react";
import { clsx } from "clsx";

export default function RegulatoryDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "owner" || user?.role === "admin";
  const [productFilter, setProductFilter] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState("feed");

  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ["regulatoryItems", productFilter, regionFilter, urgencyFilter],
    queryFn: () =>
      getRegulatoryItems({
        product_type: productFilter || undefined,
        market_region: regionFilter || undefined,
        urgency: urgencyFilter || undefined,
        limit: 50,
      }),
  });

  const alertsQuery = useQuery({
    queryKey: ["regulatoryAlerts"],
    queryFn: () => getRegulatoryAlerts(true, 50),
    enabled: activeTab === "alerts",
  });

  const sourcesQuery = useQuery({
    queryKey: ["regulatorySources"],
    queryFn: () => getRegulatorySources(),
    enabled: activeTab === "sources" && isAdmin,
  });

  const markRead = useMutation({
    mutationFn: markRegulatoryAlertRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulatoryAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["regulatoryAlertUnreadCount"] });
    },
  });

  const dismiss = useMutation({
    mutationFn: dismissRegulatoryAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulatoryAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["regulatoryAlertUnreadCount"] });
    },
  });

  const forceFetch = useMutation({
    mutationFn: forceFetchSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulatoryItems"] });
    },
  });

  const items = itemsQuery.data?.items ?? [];
  const alerts = alertsQuery.data?.alerts ?? [];
  const sources = sourcesQuery.data?.sources ?? [];

  const urgencyBadge = (u: string) => {
    const map: Record<string, string> = {
      low: "bg-slate-100 text-slate-700",
      normal: "bg-blue-100 text-blue-700",
      high: "bg-amber-100 text-amber-700",
      critical: "bg-red-100 text-red-700",
    };
    return (
      <Badge variant="outline" className={clsx("text-[10px] font-medium", map[u] || map.normal)}>
        {u}
      </Badge>
    );
  };

  const daysUntil = (deadline?: string) => {
    if (!deadline) return null;
    const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return d;
  };

  return (
    <div className="min-h-screen bg-sidebar p-6 w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regulatory Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor policy changes across EU and India that affect your product workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => itemsQuery.refetch()}
            disabled={itemsQuery.isFetching}
          >
            <RefreshCw className={clsx("h-4 w-4 mr-1.5", itemsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="feed" className="text-xs">Feed</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">
            My Alerts {alerts.length > 0 && <span className="ml-1 text-[10px] text-red-500">({alerts.length})</span>}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="sources" className="text-xs">Sources</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="feed" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Product Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Products</SelectItem>
                    <SelectItem value="BATTERY">Battery</SelectItem>
                    <SelectItem value="TEXTILE">Textile</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Market Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Regions</SelectItem>
                    <SelectItem value="EU">EU</SelectItem>
                    <SelectItem value="INDIA">India</SelectItem>
                    <SelectItem value="GLOBAL">Global</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Urgency</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                {(productFilter || regionFilter || urgencyFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setProductFilter("");
                      setRegionFilter("");
                      setUrgencyFilter("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs w-[40%]">Title</TableHead>
                    <TableHead className="text-xs">Region</TableHead>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs">Urgency</TableHead>
                    <TableHead className="text-xs">Deadline</TableHead>
                    <TableHead className="text-xs w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        No regulatory items found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const d = daysUntil(item.deadline);
                      return (
                        <TableRow key={item.id} className="group">
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <Newspaper className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <div className="text-xs font-medium">{item.title}</div>
                                <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                  {item.summary}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.tags?.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              {item.market_region}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.product_type}</TableCell>
                          <TableCell>{urgencyBadge(item.urgency)}</TableCell>
                          <TableCell>
                            {d !== null ? (
                              <div className="flex items-center gap-1">
                                <Clock className={clsx("h-3 w-3", d <= 7 ? "text-red-500" : "text-muted-foreground")} />
                                <span className={clsx("text-xs", d <= 7 ? "text-red-500 font-medium" : "text-muted-foreground")}>
                                  {d}d
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs w-[50%]">Alert</TableHead>
                    <TableHead className="text-xs">Region</TableHead>
                    <TableHead className="text-xs">Urgency</TableHead>
                    <TableHead className="text-xs">Deadline</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertsQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : alerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        No unread regulatory alerts. You&apos;re all caught up.
                      </TableCell>
                    </TableRow>
                  ) : (
                    alerts.map((alert) => {
                      const d = daysUntil(alert.deadline);
                      return (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <AlertTriangle className={clsx("h-4 w-4 mt-0.5 shrink-0", alert.urgency === "critical" ? "text-red-500" : "text-amber-400")} />
                              <div>
                                <div className="text-xs font-medium">{alert.title}</div>
                                <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                  {alert.summary}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{alert.market_region}</TableCell>
                          <TableCell>{urgencyBadge(alert.urgency ?? "normal")}</TableCell>
                          <TableCell>
                            {d !== null ? (
                              <span className={clsx("text-xs", d <= 7 ? "text-red-500 font-medium" : "text-muted-foreground")}>
                                {d}d
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => markRead.mutate(alert.id)}
                                disabled={markRead.isPending}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => dismiss.mutate(alert.id)}
                                disabled={dismiss.isPending}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="sources" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Source</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Interval</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Last Fetched</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sourcesQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : sources.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                          No sources configured.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sources.map((source) => (
                        <TableRow key={source.id}>
                          <TableCell>
                            <div className="text-xs font-medium">{source.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[240px]">{source.url}</div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground uppercase">{source.source_type}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{source.fetch_interval}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={clsx(
                                "text-[10px]",
                                source.is_active ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-500",
                              )}
                            >
                              {source.is_active ? "Active" : "Paused"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {source.last_fetched_at
                              ? new Date(source.last_fetched_at).toLocaleString()
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px]"
                              onClick={() => forceFetch.mutate(source.id)}
                              disabled={forceFetch.isPending || !source.is_active}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Fetch Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
