"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, Settings } from "lucide-react";
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

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/batches": "Batches",
  "/dashboard/passports": "Passports",
  "/dashboard/compliance": "Compliance",
  "/dashboard/billing": "Billing",
  "/dashboard/settings": "Settings",
  "/dashboard/templates": "Templates",
  "/dashboard/tokens": "API Tokens",
  "/dashboard/exports": "Exports",
  "/dashboard/analytics": "Analytics",
  "/dashboard/onboarding": "Onboarding",
};

interface DashboardTopBarProps {
  onMenuClick: () => void;
}

export function DashboardTopBar({ onMenuClick }: DashboardTopBarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const quotaBalance = user?.quota_balance ?? 0;
  const isLowQuota = quotaBalance <= 2;

  // Derive page title: exact match first, then longest prefix match
  const pageTitle =
    PAGE_TITLES[pathname] ??
    PAGE_TITLES[
      Object.keys(PAGE_TITLES)
        .filter((k) => k !== "/dashboard" && pathname.startsWith(k))
        .sort((a, b) => b.length - a.length)[0] ?? ""
    ] ??
    "Dashboard";

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
        <Link href="/dashboard/billing">
          <div
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors border",
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
            <span className="hidden sm:inline">Licenses:</span>
            <span>{quotaBalance}</span>
          </div>
        </Link>

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
              Company Account
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
                href="/dashboard/settings"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="flex items-center gap-2 rounded-none focus:rounded-none cursor-pointer text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
