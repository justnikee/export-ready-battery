"use client";

import { useEffect, useState } from "react";
import { getComplianceDeadlines, type ComplianceDeadline } from "@/lib/api/compliance";
import { Calendar, Loader2 } from "lucide-react";

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function urgencyClasses(days: number): string {
  if (days < 90) return "text-red-500 border-red-500/20 bg-red-500/5";
  if (days < 365) return "text-amber-500 border-amber-500/20 bg-amber-500/5";
  return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
}

export default function DeadlinesTab() {
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComplianceDeadlines("battery", "eu")
      .then((res) => setDeadlines(res.deadlines || []))
      .catch(() => setDeadlines([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading deadlines...
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="bg-muted rounded-md p-12 text-center">
        <p className="text-sm text-muted-foreground">No EU Battery Regulation deadlines found.</p>
      </div>
    );
  }

  const sorted = [...deadlines].sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime());

  return (
    <div className="space-y-3">
      {sorted.map((d) => {
        const days = daysUntil(d.deadline_date);
        const isPast = days < 0;
        return (
          <div key={d.id} className={`border p-4 flex items-start gap-4 ${urgencyClasses(days)}`}>
            <Calendar className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{d.label}</span>
                <span className="text-xs font-medium whitespace-nowrap">
                  {isPast ? "Passed" : `${days}d remaining`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(d.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
