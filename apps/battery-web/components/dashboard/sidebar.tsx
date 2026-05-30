"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Box,
  Home,
  Settings,
  CreditCard,
  Code,
  Users,
  Trophy,
  FileArchive,
  Landmark,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardPathFromPathname } from "@/lib/routes";

export function Sidebar() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const dashboardHref = dashboardPathFromPathname(pathname);

  const navItems = [
    { icon: Home, label: t("overview") },
    { icon: Box, label: t("batches"), subpath: "batches" },
    { icon: BarChart3, label: t("analytics"), subpath: "analytics" },
    { icon: Users, label: t("partners"), subpath: "partners" },
    { icon: FileArchive, label: t("exports"), subpath: "exports" },
    { icon: Landmark, label: t("dgft_claims"), subpath: "dgft-claims" },
    { icon: Trophy, label: t("rewards"), subpath: "rewards" },
    { icon: CreditCard, label: t("billing"), subpath: "billing" },
    { icon: Code, label: t("developer"), subpath: "developer" },
    { icon: Users, label: t("team"), subpath: "team" },
    { icon: Settings, label: t("settings"), subpath: "settings" },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center border-b px-6">
        <Link href={dashboardHref} className="flex items-center group">
          <span className="text-xl tracking-tight text-foreground">
            ANVAYALABS
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const href = dashboardPathFromPathname(pathname, item.subpath);
            const isActive =
              pathname === href ||
              (href !== dashboardHref && pathname.startsWith(`${href}/`));

            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary border-l-2 border-(--brand)"
                    : "text-sidebar-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
