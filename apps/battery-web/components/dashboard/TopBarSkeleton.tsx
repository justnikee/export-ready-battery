"use client";

import { Skeleton } from "@/components/ui/skeleton";

// Same rationale as SidebarSkeleton: bg-sidebar-accent is too close to
// bg-sidebar to read as a loading pulse — use foreground-based opacity.
function Bar({ className }: { className: string }) {
  return <Skeleton className={`bg-foreground/10 ${className}`} />;
}

/** Pixel-matches the real DashboardTopBar (same sticky/height/border classes). */
export function TopBarSkeleton() {
  return (
    <header className="sticky top-0 z-30 h-14 bg-sidebar border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Bar className="h-9 w-9 md:hidden shrink-0" />
        <Bar className="h-3.5 w-24" />
      </div>
      <div className="flex items-center gap-2">
        <Bar className="h-7 w-28" />
        <Bar className="h-9 w-9 shrink-0" />
        <Bar className="h-9 w-9 shrink-0" />
        <Bar className="h-9 w-9 shrink-0" />
        <Bar className="h-8 w-8 rounded-full shrink-0" />
      </div>
    </header>
  );
}
