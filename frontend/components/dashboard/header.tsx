"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, HelpCircle } from "lucide-react";
import Link from "next/link";

import { usePathname } from "next/navigation";
import { dashboardPathFromPathname } from "@/lib/routes";

const navItems = [
  { label: "Overview" },
  { label: "Batches", subpath: "batches" },
  { label: "Analytics", subpath: "analytics" },
  { label: "Billing", subpath: "billing" },
  { label: "Settings", subpath: "settings" },
];

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const dashboardHref = dashboardPathFromPathname(pathname);
  const billingHref = dashboardPathFromPathname(pathname, "billing");

  const initials = user?.company_name
    ? user.company_name.substring(0, 2).toUpperCase()
    : "U";

  const quotaBalance = user?.quota_balance ?? 0;
  const isLowQuota = quotaBalance <= 2;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      {/* Left: Logo */}
      <Link href={dashboardHref} className="flex items-center shrink-0 group">
        <Image
          src="/logo/logo-1.svg"
          className=""
          alt="ANVAYALABS"
          width={32}
          height={32}
        />
        <span className="text-xl tracking-tight text-foreground">
          ANVAYALABS
        </span>
      </Link>

      {/* Center: Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => {
          const href = dashboardPathFromPathname(pathname, item.subpath);
          const isActive =
            pathname === href ||
            (href !== dashboardHref && pathname.startsWith(`${href}/`));

          return (
            <Link
              key={item.label}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-(--brand)"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: Quota Badge + User Profile */}
      <div className="flex items-center gap-3">
        {/* Quota Badge */}
        <Link href={billingHref}>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
              isLowQuota
                ? "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/15"
                : "border-(--brand-border) bg-emerald-500/10 text-(--brand) hover:bg-emerald-500/15"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isLowQuota ? "bg-red-500" : "bg-emerald-500"}`}
            />
            <span>Licenses: {quotaBalance}</span>
          </div>
        </Link>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0 hover:bg-accent"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.company_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href="mailto:support@anvayalabs.in">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Support</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
