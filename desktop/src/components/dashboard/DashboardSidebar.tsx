import { Link, useLocation } from "react-router-dom";
import {
  X,
  Home,
  Box,
  Users,
  CreditCard,
  Settings,
  FileDown,
  ChevronDown,
  ChevronUp,
  Key,
  BookOpen,
  LayoutTemplate,
  TrendingUp,
  Shield,
  Activity,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clsx } from "clsx";
import { useState, useEffect } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
    ],
  },
  {
    label: "Production",
    items: [
      { name: "Batches", href: "/dashboard/batches", icon: Box },
      { name: "Lifecycle", href: "/dashboard/lifecycle", icon: Activity },
      { name: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
    ],
  },
  {
    label: "Compliance",
    items: [
      { name: "Compliance", href: "/dashboard/compliance", icon: Shield },
      { name: "Exports", href: "/dashboard/exports", icon: FileDown },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Team", href: "/dashboard/team", icon: Users },
      { name: "Partners", href: "/dashboard/partners", icon: Building2 },
      { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
  {
    label: "Developer",
    collapsible: true,
    items: [
      { name: "API Keys", href: "/dashboard/developer", icon: Key },
      { name: "Docs", href: "/docs", icon: BookOpen },
    ],
  },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const [devExpanded, setDevExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar-dev-expanded");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-dev-expanded", JSON.stringify(devExpanded));
  }, [devExpanded]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(href);
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
          "fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 w-60",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border h-14 px-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2"
            onClick={onClose}
          >
            <span className="text-xl tracking-tight text-foreground">
              ANVAYALABS
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
                    className="flex items-center justify-between w-full px-3 mb-2 hover:opacity-80 transition-colors code-label"
                  >
                    <span>{group.label}</span>
                    {devExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : (
                  <div className="px-3 mb-2 code-label">{group.label}</div>
                )}

                {isGroupExpanded && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={onClose}
                          className={clsx(
                            "group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <Icon
                            className={clsx(
                              "h-5 w-5 shrink-0 transition-colors",
                              active
                                ? "text-[var(--brand)]"
                                : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                            )}
                          />
                          <span>{item.name}</span>
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

  return {
    isOpen,
    setIsOpen,
    toggleOpen: () => setIsOpen((prev) => !prev),
  };
}
