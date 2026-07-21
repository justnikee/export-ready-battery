"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ScanStatsCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  iconColor: string;
  bgColor: string;
  trend?: string;
  trendUp?: boolean;
  subtext?: string;
}

export function ScanStatsCard({
  icon,
  label,
  value,
  iconColor,
  bgColor,
  trend,
  trendUp = true,
  subtext,
}: ScanStatsCardProps) {
  return (
    <Card className="relative overflow-hidden bg-card/70 backdrop-blur-md border border-border/80 hover:border-emerald-500/40 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 group">
      {/* Subtle background glow effect on hover */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500 pointer-events-none" />

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-2.5 rounded-xl ${bgColor} ring-1 ring-white/10 shrink-0 transition-transform duration-300 group-hover:scale-105`}
            >
              <div className={iconColor}>{icon}</div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                {label}
              </p>
            </div>
          </div>

          {trend && (
            <div
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                trendUp
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {trendUp ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{trend}</span>
            </div>
          )}
        </div>

        {subtext && (
          <p className="text-[11px] text-muted-foreground/80 mt-3 pt-2 border-t border-border/40">
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
