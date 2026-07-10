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
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface NavChild {
  label: string;
  href: string;
  desc: string;
  icon: LucideIcon;
  /** tinted icon chip: [bg class, icon color class] */
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
        tone: ["bg-crew-coral-soft", "text-crew-coral"],
      },
      {
        label: "Textile DPP",
        href: "/textile",
        desc: "Fiber-to-product traceability, ready before the ESPR mandate.",
        icon: Shirt,
        tone: ["bg-[#fdf3e3]", "text-[#b45309]"],
      },
      {
        label: "Pricing",
        href: "/pricing",
        desc: "One-time credit packs — no subscriptions, no lock-in.",
        icon: Tag,
        tone: ["bg-[#eef3fd]", "text-[#1d4ed8]"],
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
        tone: ["bg-[#eef3fd]", "text-[#1d4ed8]"],
      },
      {
        label: "India BWM Rules",
        href: "/compliance/india-bwm-rules",
        desc: "BIS, CPCB EPR and BWM 2022 obligations in one place.",
        icon: Landmark,
        tone: ["bg-[#fdf3e3]", "text-[#b45309]"],
      },
      {
        label: "DGFT TRACE",
        href: "/battery",
        desc: "Auto-file export incentive claims from your passport data.",
        icon: Coins,
        tone: ["bg-crew-coral-soft", "text-crew-coral"],
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
        tone: ["bg-crew-coral-soft", "text-crew-coral"],
      },
      {
        label: "EU Battery Guide",
        href: "/compliance/eu-battery-regulation",
        desc: "The regulatory roadmap from CE marking to Feb 2027.",
        icon: BookOpen,
        tone: ["bg-[#eef3fd]", "text-[#1d4ed8]"],
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
        className={`${fixed ? "fixed top-0 left-0 right-0" : "relative"} z-50 bg-white/80 backdrop-blur-md transition-all duration-300`}
      >
        <div
          className={`max-w-[1240px] mx-auto px-6 grid grid-cols-[1fr_auto_1fr] items-center transition-all duration-300 ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          {/* Left: Brand */}
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-semibold tracking-tight shrink-0 text-crew-ink justify-self-start"
            style={{ fontSize: "24px" }}
          >
            <span
              aria-hidden="true"
              className="block bg-crew-coral"
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "5px",
                transform: "skewX(-10deg)",
              }}
            />
            Anviora
          </Link>

          {/* Center: Desktop links */}
          <div className="hidden md:flex items-center gap-1 justify-self-center">
            {navItems.map((item) => {
              const isOpen = activeLabel === item.label;
              if (!item.children) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="px-3 py-1.5 text-[15px] font-medium rounded-full text-crew-ink/70 hover:text-crew-ink hover:bg-paper transition-colors"
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
                    className={`flex items-center gap-1 px-3 py-1.5 text-[15px] font-medium rounded-full transition-colors ${
                      isOpen
                        ? "text-crew-ink bg-paper"
                        : "text-crew-ink/70 hover:text-crew-ink"
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
                    className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50 transition-all duration-200 origin-top ${
                      isOpen
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-[0.98] -translate-y-1 pointer-events-none"
                    }`}
                    onMouseEnter={cancelClose}
                    onMouseLeave={() => scheduleClose()}
                  >
                    <div className="w-[400px] rounded-3xl bg-white p-2.5 shadow-[0_24px_70px_rgba(15,40,30,0.16),0_4px_16px_rgba(15,40,30,0.06)]">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="group flex items-start gap-3.5 p-3.5 rounded-2xl hover:bg-paper transition-colors"
                        >
                          <span
                            className={`inline-flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${child.tone[0]} ${child.tone[1]}`}
                          >
                            <child.icon size={20} strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[14.5px] font-semibold text-crew-ink leading-tight">
                              {child.label}
                            </span>
                            <span className="block text-[12.5px] leading-[1.45] text-crew-muted mt-1">
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

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-4 justify-self-end text-[16px] font-medium">
            <a
              href="/request-access"
              className="inline-flex items-center justify-center h-[38px] px-5 rounded-full text-[14.5px] font-semibold text-white bg-crew-ink hover:bg-black transition-colors"
            >
              Request a Demo
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 justify-self-end text-crew-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-5 md:hidden overflow-y-auto">
          <div className="flex flex-col gap-1 pb-10">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <div className="pt-5 pb-2 px-1 text-[12px] font-semibold text-crew-muted uppercase tracking-wider">
                      {item.label}
                    </div>
                    <div className="grid gap-1">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-start gap-3 p-3 rounded-2xl bg-paper"
                        >
                          <span
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${child.tone[0]} ${child.tone[1]}`}
                          >
                            <child.icon size={18} strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[14px] font-semibold text-crew-ink leading-tight">
                              {child.label}
                            </span>
                            <span className="block text-[12px] leading-[1.4] text-crew-muted mt-0.5">
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
                    className="block px-1 py-3 mt-2 text-[15px] font-semibold text-crew-ink"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
            <a
              href="/request-access"
              className="inline-flex items-center justify-center h-11 rounded-full text-white text-[14.5px] font-semibold mt-5 bg-crew-ink"
            >
              Request a Demo
            </a>
          </div>
        </div>
      )}
    </>
  );
}
