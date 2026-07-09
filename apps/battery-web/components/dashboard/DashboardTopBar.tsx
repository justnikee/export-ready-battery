"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, Settings, Languages } from "lucide-react";
import { AlertBell } from "./alert-bell";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { clsx } from "clsx";
import { dashboardPathFromPathname, stripProductPrefix } from "@/lib/routes";
import { getProductConfigByType, getPageTitles } from "@/lib/products";
import { useTranslations } from "next-intl";
import { useLocale, DASHBOARD_LOCALES } from "@/lib/i18n/locale-context";

interface DashboardTopBarProps {
  onMenuClick: () => void;
}

export function DashboardTopBar({ onMenuClick }: DashboardTopBarProps) {
  const t = useTranslations("topbar");
  const { locale, setLocale } = useLocale();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const unprefixedPathname = stripProductPrefix(pathname);
  const dashboardSubpath =
    unprefixedPathname === "/dashboard"
      ? ""
      : unprefixedPathname.replace(/^\/dashboard\/?/, "");

  const quotaBalance = user?.quota_balance ?? 0;
  const isLowQuota = quotaBalance <= 2;

  // Derive page title from product registry
  const productConfig = getProductConfigByType(user?.product_type);
  const pageTitles = getPageTitles(productConfig);

  const pageTitle =
    pageTitles[dashboardSubpath] ??
    pageTitles[
      Object.keys(pageTitles)
        .filter((key) => key && dashboardSubpath.startsWith(`${key}/`))
        .sort((a, b) => b.length - a.length)[0] ?? ""
    ] ??
    t("dashboard");

  const initials = user?.company_name
    ? user.company_name.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "AC");

  return (
    <header className="sticky top-0 z-30 h-14 bg-sidebar border-b border-border flex items-center justify-between px-4 md:px-6">
      {/* Left: Mobile menu + page title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
        <span className="text-sm font-medium text-foreground">{pageTitle}</span>
      </div>

      {/* Right: Quota + Theme + Profile */}
      <div className="flex items-center gap-2">
        {/* Quota Badge */}
        <Link href={dashboardPathFromPathname(pathname, "billing")}>
          <div
            className={clsx(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors border",
              isLowQuota
                ? "border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/15"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/15",
            )}
          >
            <span
              className={clsx(
                "h-2 w-2 rounded-full animate-pulse",
                isLowQuota ? "bg-red-500" : "bg-emerald-500",
              )}
            />
            <span className="hidden sm:inline">{t("quotaRemaining")}:</span>
            <span>{quotaBalance}</span>
          </div>
        </Link>

        {/* Alerts Bell */}
        <AlertBell />

        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" title="Language">
              <Languages className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-none">
            {DASHBOARD_LOCALES.map(({ code, label, flag }) => (
              <DropdownMenuItem
                key={code}
                onClick={() => setLocale(code)}
                className={clsx(
                  "rounded-none focus:rounded-none cursor-pointer",
                  locale === code && "bg-muted",
                )}
              >
                <span className="mr-2">{flag}</span>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.logo_url} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-none">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal pb-1">
              {t("profileSettings")}
            </DropdownMenuLabel>
            <DropdownMenuItem className="flex items-center justify-between rounded-none focus:rounded-none cursor-default select-none">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={user?.logo_url} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate max-w-30">
                  {user?.company_name || "Account"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                ✓
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              asChild
              className="rounded-none focus:rounded-none"
            >
              <Link
                href={dashboardPathFromPathname(pathname, "settings")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                {t("profileSettings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="flex items-center gap-2 rounded-none focus:rounded-none cursor-pointer text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
