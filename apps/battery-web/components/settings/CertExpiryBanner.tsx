"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Check } from "lucide-react";
import { getUnreadAlerts, markAlertRead } from "@/lib/api/alerts";
import { dashboardPathFromPathname } from "@/lib/routes";
import type { TenantAlert } from "@/lib/types";

export function CertExpiryBanner() {
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<TenantAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUnreadAlerts(50)
      .then((res) =>
        setAlerts((res.alerts ?? []).filter((a) => a.alert_type === "CERTIFICATE_EXPIRY")),
      )
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = async (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    try {
      await markAlertRead(alertId);
    } catch {
      // Best-effort — the alert will just reappear next load.
    }
  };

  if (loading || alerts.length === 0) return null;

  const hasCritical = alerts.some((a) => a.severity === "CRITICAL");

  return (
    <div
      className={`flex items-start gap-3 p-4 border ${
        hasCritical
          ? "bg-red-500/10 border-red-500/20"
          : "bg-amber-500/10 border-amber-500/20"
      }`}
    >
      <AlertTriangle
        className={`w-5 h-5 shrink-0 mt-0.5 ${hasCritical ? "text-red-500" : "text-amber-500"}`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${hasCritical ? "text-red-800" : "text-amber-800"}`}
        >
          {alerts.length} certificate{alerts.length > 1 ? "s" : ""}{" "}
          {hasCritical ? "expired or expiring" : "expiring"} within 30 days
        </p>
        <div className="mt-2 space-y-1.5">
          {alerts.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span
                className={alert.severity === "CRITICAL" ? "text-red-600" : "text-amber-600"}
              >
                {alert.title}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {alert.resource_type === "BATCH" && alert.resource_id && (
                  <Link
                    href={dashboardPathFromPathname(pathname, `batches/${alert.resource_id}`)}
                    className="text-muted-foreground hover:text-foreground underline"
                  >
                    View batch
                  </Link>
                )}
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {alerts.length > 5 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            + {alerts.length - 5} more
          </p>
        )}
      </div>
    </div>
  );
}
