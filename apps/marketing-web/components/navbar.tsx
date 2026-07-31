"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu,
  X,
  ChevronDown,
  BatteryCharging,
  Shirt,
  Tag,
  ScrollText,
  Landmark,
  Coins,
  Newspaper,
  BookOpen,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface NavChild {
  label: string;
  href: string;
  desc: string;
  icon: LucideIcon;
  tone: [string, string];
}

interface NavItem {
  label: string;
  href?: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  {
    label: "Products",
    children: [
      {
        label: "Battery Passport",
        href: "/battery",
        desc: "EU 2023/1542 passports, BIS & carbon compliance for battery exporters.",
        icon: BatteryCharging,
        tone: ["bg-blue-tint", "text-blue"],
      },
      {
        label: "Pricing",
        href: "/pricing",
        desc: "One-time credit packs — no subscriptions, no lock-in.",
        icon: Tag,
        tone: ["bg-blue-tint", "text-blue"],
      },
    ],
  },
  {
    label: "Solutions",
    children: [
      {
        label: "EU Battery Regulation",
        href: "/compliance/eu-battery-regulation",
        desc: "Everything 2023/1542 requires, mapped article by article.",
        icon: ScrollText,
        tone: ["bg-blue-tint", "text-blue"],
      },
      {
        label: "India BWM Rules",
        href: "/compliance/india-bwm-rules",
        desc: "BIS, CPCB EPR and BWM 2022 obligations in one place.",
        icon: Landmark,
        tone: ["bg-amber-soft", "text-amber-text"],
      },
      {
        label: "DGFT TRACE",
        href: "/battery",
        desc: "Auto-file export incentive claims from your passport data.",
        icon: Coins,
        tone: ["bg-blue-tint", "text-blue"],
      },
    ],
  },
  {
    label: "Resources",
    children: [
      {
        label: "Blog",
        href: "/blog",
        desc: "Regulation updates and export playbooks for manufacturers.",
        icon: Newspaper,
        tone: ["bg-blue-tint", "text-blue"],
      },
      {
        label: "EU Battery Guide",
        href: "/compliance/eu-battery-regulation",
        desc: "The regulatory roadmap from CE marking to Feb 2027.",
        icon: BookOpen,
        tone: ["bg-blue-tint", "text-blue"],
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export default function Navbar({
  fixed = true,
}: {
  fixed?: boolean;
  transparent?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openDropdown = useCallback((label: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveLabel(label);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setActiveLabel(null);
    }, 150);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveLabel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        onMouseLeave={() => scheduleClose()}
        className={`${fixed ? "fixed top-0 left-0 right-0" : "relative"} z-50 bg-bg/80 backdrop-blur-md border-b border-border/60 transition-all duration-300`}
      >
        <div className="max-w-[1240px] mx-auto px-6 grid grid-cols-[1fr_auto_1fr] items-center transition-all duration-300 h-20">
          {/* Left: Brand Logo (Mona Sans, 600 weight, normal tracking, Uppercase) */}
          <Link
            href="/"
            className="inline-flex items-center font-heading font-semibold text-[24px] uppercase tracking-normal text-slate-950 hover:text-emerald-600 transition-colors shrink-0 justify-self-start"
          >
            ANVIORA
          </Link>

          {/* Center: Desktop links */}
          <div className="hidden md:flex items-center gap-0.5 justify-self-center">
            {navItems.map((item) => {
              const isOpen = activeLabel === item.label;
              if (!item.children) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="px-3 py-1.5 text-[14px] font-medium tracking-[-0.01em] text-text hover:text-text-muted transition-colors"
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => openDropdown(item.label)}
                  onMouseLeave={() => scheduleClose()}
                >
                  <button
                    className={`flex items-center gap-1 px-3 py-1.5 text-[14px] font-medium tracking-[-0.01em] transition-colors ${
                      isOpen
                        ? "text-text"
                        : "text-text hover:text-text-muted"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Mega dropdown */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 transition-all duration-200 origin-top ${
                      isOpen
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-[0.98] -translate-y-1 pointer-events-none"
                    }`}
                    onMouseEnter={cancelClose}
                    onMouseLeave={() => scheduleClose()}
                  >
                    <div className="w-[420px] bg-paper border border-border shadow-[0_24px_70px_-12px_rgba(5,98,239,0.18),0_8px_24px_-8px_rgba(11,16,21,0.08)] p-2">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="group flex items-start gap-3.5 p-3 hover:bg-bg-alt transition-colors rounded-sm"
                        >
                          <span
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${child.tone[0]} ${child.tone[1]}`}
                          >
                            <child.icon size={18} strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[14px] font-medium text-text leading-tight">
                              {child.label}
                            </span>
                            <span className="block text-[12px] leading-[1.45] text-text-muted mt-1">
                              {child.desc}
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Actions — Supermemory split CTA */}
          <div className="hidden md:flex items-center gap-4 justify-self-end">
            <a
              href="/request-access"
              className="btn-primary press-scale"
            >
              <span className="btn-primary-label">Request a Demo</span>
              <span className="btn-primary-arrow">
                <ArrowRight size={15} />
              </span>
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 justify-self-end text-text"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-bg pt-20 px-5 md:hidden overflow-y-auto">
          <div className="flex flex-col gap-1 pb-10">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <div className="pt-5 pb-2 px-1 text-[11px] font-medium font-mono tracking-[0.18em] uppercase text-text-dim">
                      {item.label}
                    </div>
                    <div className="grid gap-1">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-start gap-3 p-3 bg-paper border border-border rounded-md"
                        >
                          <span
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${child.tone[0]} ${child.tone[1]}`}
                          >
                            <child.icon size={18} strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[14px] font-medium text-text leading-tight">
                              {child.label}
                            </span>
                            <span className="block text-[12px] leading-[1.4] text-text-muted mt-0.5">
                              {child.desc}
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <a
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-1 py-3 mt-2 text-[15px] font-medium text-text"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
            <a
              href="/request-access"
              className="btn-primary press-scale mt-5"
            >
              <span className="btn-primary-label">Request a Demo</span>
              <span className="btn-primary-arrow">
                <ArrowRight size={15} />
              </span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
