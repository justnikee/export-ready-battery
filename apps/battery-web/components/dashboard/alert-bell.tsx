"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, AlertTriangle, Info, AlertCircle, Newspaper, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getUnreadAlerts,
  markAlertRead,
  getUnreadAlertCount,
} from "@/lib/api/alerts";
import {
  getRegulatoryAlertUnreadCount,
  getRegulatoryAlerts,
  markRegulatoryAlertRead,
  dismissRegulatoryAlert,
} from "@/lib/api/regulatory";
import type { TenantAlert, TenantRegulatoryAlert } from "@/lib/types";
import { clsx } from "clsx";
import Link from "next/link";

const severityIcon = {
  INFO: <Info className="h-4 w-4 text-blue-400" />,
  WARNING: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  CRITICAL: <AlertCircle className="h-4 w-4 text-red-400" />,
};

const severityClass = {
  INFO: "border-l-blue-400",
  WARNING: "border-l-amber-400",
  CRITICAL: "border-l-red-400",
};

const urgencyColor: Record<string, string> = {
  low: "text-muted-foreground",
  normal: "text-blue-400",
  high: "text-amber-400",
  critical: "text-red-400",
};

export function AlertBell() {
  const [legacyAlerts, setLegacyAlerts] = useState<TenantAlert[]>([]);
  const [regulatoryAlerts, setRegulatoryAlerts] = useState<TenantRegulatoryAlert[]>([]);
  const [legacyUnread, setLegacyUnread] = useState(0);
  const [regulatoryUnread, setRegulatoryUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "regulatory">("all");

  const fetchAlerts = useCallback(async () => {
    try {
      const [legacyData, regulatoryData, legacyCount, regulatoryCount] = await Promise.all([
        getUnreadAlerts(10),
        getRegulatoryAlerts(true, 10),
        getUnreadAlertCount(),
        getRegulatoryAlertUnreadCount(),
      ]);
      setLegacyAlerts(legacyData?.alerts ?? []);
      setLegacyUnread(legacyCount ?? 0);
      setRegulatoryAlerts(regulatoryData?.alerts ?? []);
      setRegulatoryUnread(regulatoryCount ?? 0);
    } catch {
      setLegacyAlerts([]);
      setRegulatoryAlerts([]);
      setLegacyUnread(0);
      setRegulatoryUnread(0);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleMarkLegacyRead = async (alertId: string) => {
    try {
      await markAlertRead(alertId);
      setLegacyAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setLegacyUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const handleMarkRegulatoryRead = async (alertId: string) => {
    try {
      await markRegulatoryAlertRead(alertId);
      setRegulatoryAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setRegulatoryUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const handleDismissRegulatory = async (alertId: string) => {
    try {
      await dismissRegulatoryAlert(alertId);
      setRegulatoryAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setRegulatoryUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      fetchAlerts().finally(() => setLoading(false));
    }
  };

  const totalUnread = legacyUnread + regulatoryUnread;
  const allAlerts = activeTab === "all"
    ? [
        ...legacyAlerts.map((a) => ({ type: "legacy" as const, data: a })),
        ...regulatoryAlerts.map((a) => ({ type: "regulatory" as const, data: a })),
      ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime())
    : regulatoryAlerts.map((a) => ({ type: "regulatory" as const, data: a }));

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-5 w-5 text-foreground" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 rounded-none p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-xs font-medium text-foreground">
            Notifications
            {totalUnread > 0 && (
              <span className="ml-1 text-muted-foreground">({totalUnread} unread)</span>
            )}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("all")}
              className={clsx(
                "text-[10px] px-2 py-0.5 rounded-sm",
                activeTab === "all" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("regulatory")}
              className={clsx(
                "text-[10px] px-2 py-0.5 rounded-sm",
                activeTab === "regulatory" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Regulatory
            </button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">Loading...</div>
          ) : allAlerts.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">No new notifications</div>
          ) : (
            allAlerts.map((alert) =>
              alert.type === "legacy" ? (
                <LegacyAlertRow
                  key={alert.data.id}
                  alert={alert.data}
                  onMarkRead={handleMarkLegacyRead}
                  onClose={() => setOpen(false)}
                />
              ) : (
                <RegulatoryAlertRow
                  key={alert.data.id}
                  alert={alert.data}
                  onMarkRead={handleMarkRegulatoryRead}
                  onDismiss={handleDismissRegulatory}
                />
              ),
            )
          )}
        </div>
        {(legacyAlerts.length > 0 || regulatoryAlerts.length > 0) && (
          <>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-3 py-1.5">
              <DropdownMenuItem
                className="text-xs text-muted-foreground cursor-pointer rounded-none focus:rounded-none"
                onClick={() => {
                  Promise.all([
                    ...legacyAlerts.map((a) => markAlertRead(a.id)),
                    ...regulatoryAlerts.map((a) => markRegulatoryAlertRead(a.id)),
                  ]).then(() => {
                    setLegacyAlerts([]);
                    setRegulatoryAlerts([]);
                    setLegacyUnread(0);
                    setRegulatoryUnread(0);
                  });
                }}
              >
                Mark all as read
              </DropdownMenuItem>
              <Link
                href="/dashboard/regulatory"
                className="text-[10px] text-blue-400 hover:text-blue-300 pr-2"
                onClick={() => setOpen(false)}
              >
                View all →
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LegacyAlertRow({
  alert,
  onMarkRead,
  onClose,
}: {
  alert: TenantAlert;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className={clsx("px-3 py-2.5 border-l-2 hover:bg-muted/50 transition-colors", severityClass[alert.severity])}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">{severityIcon[alert.severity]}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground leading-tight">{alert.title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">{new Date(alert.created_at).toLocaleDateString()}</span>
            <div className="flex items-center gap-1.5">
              {alert.resource_type === "BATCH" && alert.resource_id && (
                <Link
                  href={`/dashboard/batches/${alert.resource_id}`}
                  className="text-[10px] text-blue-400 hover:text-blue-300"
                  onClick={onClose}
                >
                  View
                </Link>
              )}
              <button
                onClick={() => onMarkRead(alert.id)}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
              >
                <Check className="h-3 w-3" />
                Mark read
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegulatoryAlertRow({
  alert,
  onMarkRead,
  onDismiss,
}: {
  alert: TenantRegulatoryAlert;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const daysUntil = alert.deadline
    ? Math.ceil((new Date(alert.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="px-3 py-2.5 border-l-2 border-l-indigo-400 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0"><Newspaper className={clsx("h-4 w-4", urgencyColor[alert.urgency ?? "normal"])} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground leading-tight line-clamp-1">{alert.title}</span>
            {alert.market_region && (
              <span className="text-[9px] px-1 py-0.5 bg-muted rounded-sm text-muted-foreground shrink-0">
                {alert.market_region}
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alert.summary}</div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              {daysUntil !== null && daysUntil >= 0 ? `${daysUntil}d until deadline` : "No deadline"}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onMarkRead(alert.id)}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
              >
                <Check className="h-3 w-3" />
                Read
              </button>
              <button
                onClick={() => onDismiss(alert.id)}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
