"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardPathFromPathname } from "@/lib/routes";
import { getProductConfigByType } from "@/lib/products";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
import NProgress from "nprogress";
import { useLocale } from "@/lib/i18n/locale-context";
import { NAV_GROUP_LABEL_KEYS, NAV_ITEM_LABEL_KEYS } from "@/lib/i18n/nav-labels";
import { useEntitlements } from "@/hooks/use-entitlements";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  productType?: string;
}

export function DashboardSidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  productType,
}: DashboardSidebarProps) {
  const productConfig = getProductConfigByType(productType);
  const navGroups = productConfig.navGroups;
  const pathname = usePathname();
  const { t } = useLocale();
  const { has } = useEntitlements();
  const translateGroupLabel = (label: string) =>
    NAV_GROUP_LABEL_KEYS[label] ? t(NAV_GROUP_LABEL_KEYS[label]) : label;
  const translateItemName = (name: string) =>
    NAV_ITEM_LABEL_KEYS[name] ? t(NAV_ITEM_LABEL_KEYS[name]) : name;
  const [devExpanded, setDevExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("sidebar-dev-expanded");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-dev-expanded", JSON.stringify(devExpanded));
  }, [devExpanded]);

  const isActive = (href: string) => {
    if (href === dashboardPathFromPathname(pathname)) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
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
          <Link
            href={dashboardPathFromPathname(pathname)}
            className="flex items-center gap-2"
            onClick={onClose}
          >
            <span
              className={clsx(
                "text-xl tracking-tight text-foreground",
                isCollapsed && "md:hidden",
              )}
            >
              ANVIORA
            </span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={clsx(
              "h-7 w-7 hidden md:flex",
              isCollapsed &&
                "md:absolute md:-right-3 md:top-4 md:bg-transparent md:border md:border-border md:rounded-full",
            )}
            onClick={onToggleCollapse}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3">
          {navGroups.map((group, groupIndex) => {
            const isDevGroup = group.collapsible;
            const isGroupExpanded = isDevGroup ? devExpanded : true;

            return (
              <div key={group.label} className={clsx(groupIndex > 0 && "mt-6")}>
                {isDevGroup ? (
                  <button
                    onClick={() => setDevExpanded((prev: boolean) => !prev)}
                    className={clsx(
                      "flex items-center justify-between w-full px-3 mb-2 hover:opacity-80 transition-colors code-label",
                      isCollapsed && "md:hidden",
                    )}
                  >
                    <span>{translateGroupLabel(group.label)}</span>
                    {devExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : (
                  <div
                    className={clsx(
                      "px-3 mb-2 code-label",
                      isCollapsed && "md:hidden",
                    )}
                  >
                    {translateGroupLabel(group.label)}
                  </div>
                )}

                {isGroupExpanded && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const href = item.href
                        ? item.href
                        : dashboardPathFromPathname(
                            pathname,
                            item.dashboardSubpath,
                          );
                      const Icon = item.icon;
                      const active = isActive(href);
                      const locked = item.feature ? !has(item.feature) : false;

                      return (
                        <Link
                          key={item.name}
                          href={href}
                          onClick={() => {
                            if (!active) NProgress.start();
                            onClose();
                          }}
                          title={isCollapsed ? translateItemName(item.name) : undefined}
                          className={clsx(
                            "group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            isCollapsed && "md:justify-center md:px-0",
                            locked && "opacity-60",
                          )}
                        >
                          {locked ? (
                            <Lock
                              className={clsx(
                                "h-5 w-5 shrink-0 transition-colors text-muted-foreground",
                              )}
                            />
                          ) : (
                            <Icon
                              className={clsx(
                                "h-5 w-5 shrink-0 transition-colors",
                                active
                                  ? "text-(--brand)"
                                  : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                              )}
                            />
                          )}
                          <span className={clsx(isCollapsed && "md:hidden", "flex-1")}>
                            {translateItemName(item.name)}
                          </span>
                          {locked && !isCollapsed && (
                            <span className="hidden md:inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-400 leading-none">
                              Growth
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export function useSidebarState() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return {
    isOpen,
    setIsOpen,
    isCollapsed,
    setIsCollapsed,
    toggleOpen: () => setIsOpen((prev: boolean) => !prev),
    toggleCollapse: () => setIsCollapsed((prev: boolean) => !prev),
  };
}
