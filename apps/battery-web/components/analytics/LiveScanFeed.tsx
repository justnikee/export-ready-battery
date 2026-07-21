"use client";

import { useState } from "react";
import {
  Smartphone,
  Monitor,
  Tablet,
  Bot,
  HelpCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanFeedItem {
  city: string;
  country: string;
  device_type: string;
  scanned_at: string;
  serial_number: string;
  batch_name: string;
}

interface LiveScanFeedProps {
  scans: ScanFeedItem[];
}

const deviceIcons: Record<string, React.ReactNode> = {
  Mobile: <Smartphone className="h-4 w-4" />,
  Desktop: <Monitor className="h-4 w-4" />,
  Tablet: <Tablet className="h-4 w-4" />,
  Bot: <Bot className="h-4 w-4" />,
  Unknown: <HelpCircle className="h-4 w-4" />,
};

const deviceColors: Record<string, string> = {
  Mobile: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  Desktop: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  Tablet: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  Bot: "text-muted-foreground bg-muted border-border",
  Unknown: "text-muted-foreground bg-muted border-border",
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 15) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function LiveScanFeed({ scans }: LiveScanFeedProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  if (scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
        <MapPin className="h-8 w-8 text-emerald-500/50" />
        <p className="text-sm font-medium text-foreground">No live scans recorded yet</p>
        <p className="text-xs">QR passport scans will stream here in real-time</p>
      </div>
    );
  }

  const totalPages = Math.ceil(scans.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedScans = scans.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-3">
      {/* Stream Items List */}
      <div className="space-y-2.5 min-h-[340px]">
        {paginatedScans.map((scan, index) => {
          const globalIndex = (safePage - 1) * pageSize + index;
          const device = scan.device_type || "Unknown";
          const colorClass = deviceColors[device] || deviceColors.Unknown;
          const icon = deviceIcons[device] || deviceIcons.Unknown;
          const isFirst = globalIndex === 0;

          return (
            <div
              key={`${scan.serial_number}-${globalIndex}`}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
                isFirst
                  ? "bg-emerald-500/5 border-emerald-500/30 shadow-sm"
                  : "bg-card/40 border-border/60 hover:bg-card/80"
              }`}
            >
              {/* Device Icon */}
              <div className={`p-2 rounded-lg border shrink-0 ${colorClass}`}>
                {icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground text-xs truncate flex items-center gap-1.5">
                    {scan.city || "Unknown"}, {scan.country || "Unknown"}
                    {isFirst && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
                    {formatRelativeTime(scan.scanned_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1 gap-2">
                  <span className="truncate">{scan.batch_name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/80 shrink-0">
                    {scan.serial_number}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {scans.length > pageSize && (
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
          <span className="text-muted-foreground">
            Showing {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, scans.length)} of {scans.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="h-7 w-7 p-0 border-border/60 text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 font-medium text-foreground">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="h-7 w-7 p-0 border-border/60 text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
