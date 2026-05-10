"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  isPositive?: boolean;
  accentColor?: string;
}

export function StatsCard({
  title,
  value,
  subtext,
  trend,
  isPositive,
  accentColor = "var(--brand)",
}: StatsCardProps) {
  return (
    <div className="relative bg-transparent border border-border rounded-none p-5 hover:border-(--border-prominent) transition-colors cursor-pointer overflow-visible">
      {/* Corner squares */}
      <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />

      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <div
          className="w-5 h-5 flex items-center justify-center"
          style={{
            backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
          }}
        >
          <div className="w-2 h-2" style={{ backgroundColor: accentColor }} />
        </div>
      </div>

      <div className="font-mono text-3xl text-foreground tracking-tight">
        {value}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{subtext}</p>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-mono ${isPositive ? "text-emerald-500" : "text-red-500"}`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
