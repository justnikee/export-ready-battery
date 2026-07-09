"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Loader2 } from "lucide-react";
import { getRegulatoryAlerts } from "@/lib/api/regulatory";
import type { TenantRegulatoryAlert } from "@/lib/types";

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function urgencyTextClass(days: number): string {
  if (days < 30) return "text-red-500";
  if (days < 90) return "text-amber-500";
  return "text-emerald-500";
}

export function RegulatoryDeadlines({ regulatoryHref }: { regulatoryHref: string }) {
  const [deadlines, setDeadlines] = useState<TenantRegulatoryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRegulatoryAlerts(true, 50)
      .then((res) => {
        const withDeadlines = (res.alerts || [])
          .filter((a) => !!a.deadline)
          .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
          .slice(0, 3);
        setDeadlines(withDeadlines);
      })
      .catch(() => setDeadlines([]))
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = !loading && deadlines.length === 0;

  return (
    <div className="relative bg-muted rounded-md overflow-visible">
      <div className="px-6 py-4 flex items-center justify-between">
        <h3 className="text-base font-medium text-foreground">Regulatory Deadlines</h3>
        {!isEmpty && (
          <Link href={regulatoryHref} className="text-xs text-(--brand-link) hover:underline font-medium">
            View All →
          </Link>
        )}
      </div>
      {loading ? (
        <div className="px-6 pb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : isEmpty ? (
        <div className="px-6 pb-5 text-xs text-muted-foreground">Nothing due in the next 90 days</div>
      ) : (
        <div className="divide-y divide-background">
          {deadlines.map((d) => {
            const days = daysUntil(d.deadline!);
            return (
              <div key={d.id} className="px-6 py-4 flex items-start gap-3 hover:bg-background/60">
                <div className="p-2 bg-background">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.market_region}</p>
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${urgencyTextClass(days)}`}>
                  {days <= 0 ? "Due now" : `${days} days`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
