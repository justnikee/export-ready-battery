"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Bell,
  Settings,
  Shield,
  Users,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Building2, label: "Tenants", href: "/dashboard/tenants" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: Users, label: "Users", href: "/dashboard/users" },
  { icon: Activity, label: "System Health", href: "/dashboard/health" },
  { icon: Bell, label: "Announcements", href: "/dashboard/announcements" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen sticky top-0 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
            E
          </div>
          <div>
            <span className="font-bold text-foreground">ExportReady</span>
            <span className="ml-1.5 text-[10px] uppercase tracking-wider font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Shield className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-sm">
            <p className="font-medium">Super Admin</p>
            <p className="text-xs text-muted-foreground">ops@anvaya.io</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
