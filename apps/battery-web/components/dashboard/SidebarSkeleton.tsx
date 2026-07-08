"use client";

import { clsx } from "clsx";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductConfigByType } from "@/lib/products";

// bg-sidebar-accent (the real "active item" tone) is nearly indistinguishable
// from the bg-sidebar background in this theme (~4% contrast) — fine for a
// static highlight, too subtle to read as "loading". Use foreground-based
// opacity instead so the pulse is clearly visible in both themes.
function Bar({ className }: { className: string }) {
  return <Skeleton className={`bg-foreground/10 ${className}`} />;
}

/**
 * Pixel-matches the real DashboardSidebar (same fixed/border/width classes,
 * same nav group labels + item counts pulled live from the product config —
 * not hardcoded, so it can't drift the way the old DashboardSkeleton did).
 * Rendered before `user` is known (auth still resolving), so it can't read
 * per-tenant entitlements — item rows are plain bars, no lock icons.
 */
export function SidebarSkeleton({ isCollapsed }: { isCollapsed: boolean }) {
  // battery-web only ever serves the battery product config — see
  // getProductConfigByType, which ignores its argument entirely.
  const navGroups = getProductConfigByType(undefined).navGroups;

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border flex flex-col",
        "-translate-x-full md:translate-x-0",
        isCollapsed ? "md:w-16" : "md:w-60",
        "w-72",
      )}
    >
      <div
        className={clsx(
          "flex items-center border-b border-sidebar-border h-14 px-4",
          isCollapsed ? "md:justify-center" : "justify-between",
        )}
      >
        <Bar className={clsx("h-5 w-24", isCollapsed && "md:hidden")} />
        <Bar className="h-7 w-7 hidden md:flex shrink-0" />
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={clsx(groupIndex > 0 && "mt-6")}>
            <div
              className={clsx(
                "flex items-center justify-between px-3 mb-2",
                isCollapsed && "md:hidden",
              )}
            >
              <Bar className="h-2.5 w-16" />
              {group.collapsible && <Bar className="h-3.5 w-3.5" />}
            </div>
            {/* Collapsible groups (Developer, Admin) default to collapsed —
                match that: header only, no item rows. */}
            {!group.collapsible &&
              group.items.map((item, i) => (
                <div
                  key={item.name}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5",
                    isCollapsed && "md:justify-center md:px-0",
                    i > 0 && "mt-1",
                  )}
                >
                  <Bar className="h-5 w-5 shrink-0" />
                  <Bar className={clsx("h-3.5 flex-1 max-w-28", isCollapsed && "md:hidden")} />
                </div>
              ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
