"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { AnvioraLogo } from "./anviora-logo";

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
        className={`${fixed ? "fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-xs" : "relative z-50 bg-transparent"} transition-all duration-300`}
      >
        <div className="max-w-[1320px] mx-auto px-6 grid grid-cols-[1fr_auto_1fr] items-center transition-all duration-300 h-16 sm:h-20">
          {/* Left: Brand Logo */}
          <Link
            href="/"
            className="inline-flex items-center hover:opacity-80 transition-opacity shrink-0 justify-self-start"
          >
            <AnvioraLogo className="h-7 sm:h-8 w-auto text-black" />
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
                    className="px-3.5 py-1.5 text-[14px] font-mono uppercase tracking-wider text-black/90 hover:text-black hover:bg-black/5 rounded-none transition-colors cursor-pointer"
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
                    onClick={() => setActiveLabel(isOpen ? null : item.label)}
                    className={`flex items-center gap-1 px-3.5 py-1.5 text-[14px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                      isOpen
                        ? "text-black bg-black/10 font-semibold"
                        : "text-black/90 hover:text-black hover:bg-black/5"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-black" : ""
                      }`}
                    />
                  </button>

                  {/* Mega dropdown with Framer Motion smooth transitions */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-1 z-50 origin-top pointer-events-auto"
                        onMouseEnter={cancelClose}
                        onMouseLeave={() => scheduleClose()}
                      >
                        {/* Invisible Hover Bridge */}
                        <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />

                        <div className="w-[420px] bg-[#090e14] border border-black/80 shadow-2xl p-2.5 rounded-none clip-chamfer-lg text-white overflow-hidden">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 6 }}
                              transition={{ duration: 0.12, ease: "easeInOut" }}
                            >
                              {item.children.map((child) => (
                                <a
                                  key={child.label}
                                  href={child.href}
                                  className="group flex items-start gap-3.5 p-3 transition-all rounded-none cursor-pointer"
                                >
                                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-none shrink-0 bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 transition-transform group-hover:scale-105">
                                    <child.icon size={18} strokeWidth={1.8} />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[14px] font-semibold text-white group-hover:text-emerald-400 transition-colors leading-tight">
                                      {child.label}
                                    </span>
                                    <span className="block text-[12px] leading-[1.45] text-slate-400 mt-1 font-sans">
                                      {child.desc}
                                    </span>
                                  </span>
                                </a>
                              ))}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Right: Chamfered Retro-Tech CTA button matching reference */}
          <div className="hidden md:flex items-center gap-4 justify-self-end">
            <a
              href="/request-access"
              className="inline-flex items-center justify-center h-10 px-5 text-[12px] font-mono font-bold tracking-widest uppercase text-white bg-black hover:bg-slate-900 transition-all clip-chamfer press-scale shadow-sm cursor-pointer"
            >
              Get Early Access
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
