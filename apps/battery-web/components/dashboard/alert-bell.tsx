"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, AlertTriangle, Info, AlertCircle } from "lucide-react";
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
import type { TenantAlert } from "@/lib/types";
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

export function AlertBell() {
  const [alerts, setAlerts] = useState<TenantAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getUnreadAlerts(10);
      setAlerts(data?.alerts ?? []);
      setUnreadCount(data?.count ?? 0);
    } catch {
      // Silently fail — alerts are non-critical
      setAlerts([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Poll every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleMarkRead = async (alertId: string) => {
    try {
      await markAlertRead(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      fetchAlerts().finally(() => setLoading(false));
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-none p-0">
        <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-foreground border-b border-border">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-1 text-muted-foreground">
              ({unreadCount} unread)
            </span>
          )}
        </DropdownMenuLabel>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              Loading...
            </div>
          ) : alerts.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              No new notifications
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={clsx(
                  "px-3 py-2.5 border-l-2 hover:bg-muted/50 transition-colors",
                  severityClass[alert.severity],
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">{severityIcon[alert.severity]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground leading-tight">
                      {alert.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {alert.message}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {alert.resource_type === "BATCH" && alert.resource_id && (
                          <Link
                            href={`/dashboard/batches/${alert.resource_id}`}
                            className="text-[10px] text-blue-400 hover:text-blue-300"
                            onClick={() => setOpen(false)}
                          >
                            View
                          </Link>
                        )}
                        <button
                          onClick={() => handleMarkRead(alert.id)}
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
            ))
          )}
        </div>
        {alerts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-xs text-muted-foreground cursor-pointer rounded-none focus:rounded-none"
              onClick={() => {
                Promise.all(alerts.map((a) => markAlertRead(a.id))).then(() => {
                  setAlerts([]);
                  setUnreadCount(0);
                });
              }}
            >
              Mark all as read
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
