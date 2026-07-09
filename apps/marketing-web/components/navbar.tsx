"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";

interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string; desc?: string }[];
}

const navItems: NavItem[] = [
  {
    label: "Products",
    children: [
      { label: "Battery Passport", href: "/battery", desc: "EU 2023/1542 ready" },
      { label: "Textile DPP", href: "/textile", desc: "Traceability & compliance" },
      { label: "Pricing", href: "/pricing", desc: "Plans for every scale" },
    ],
  },
  {
    label: "Solutions",
    children: [
      { label: "EU Battery Regulation", href: "/compliance/eu-battery-regulation", desc: "2023/1542 compliance" },
      { label: "India BWM Rules", href: "/compliance/india-bwm-rules", desc: "Domestic compliance" },
      { label: "DGFT TRACE", href: "/battery", desc: "Export incentive claims" },
    ],
  },
  {
    label: "Resources",
    children: [
      { label: "Blog", href: "/blog", desc: "Insights & updates" },
      { label: "EU Battery Guide", href: "/compliance/eu-battery-regulation", desc: "Regulatory roadmap" },
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
                    className="px-3 py-1.5 text-[16px] font-medium rounded-md text-crew-ink/70 hover:text-crew-ink transition-colors"
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
                    className={`flex items-center gap-1 px-3 py-1.5 text-[16px] font-medium rounded-md transition-colors ${
                      isOpen
                        ? "text-crew-ink bg-crew-paper-soft"
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

                  {/* Dropdown */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[220px] bg-crew-paper rounded-xl border border-crew-border shadow-[0_12px_40px_rgba(0,0,0,0.12)] py-2 z-50 transition-all duration-200 origin-top ${
                      isOpen
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-[0.97] -translate-y-1 pointer-events-none"
                    }`}
                    onMouseEnter={cancelClose}
                    onMouseLeave={() => scheduleClose()}
                  >
                    {item.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-2.5 hover:bg-crew-paper-soft transition-colors"
                      >
                        <div className="text-[13px] font-medium text-crew-ink">
                          {child.label}
                        </div>
                        {child.desc && (
                          <div className="text-[11px] text-crew-muted mt-0.5">
                            {child.desc}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-4 justify-self-end text-[16px] font-medium">
            <a
              href="/request-access"
              className="inline-flex items-center justify-center h-[38px] px-5 rounded-full text-[16px] font-semibold text-white bg-crew-ink hover:bg-black transition-colors"
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
        <div className="fixed inset-0 z-40 bg-crew-paper pt-20 px-6 md:hidden overflow-y-auto">
          <div className="flex flex-col gap-2 text-[15px] font-medium text-crew-ink">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <div className="py-2 text-[13px] font-semibold text-crew-muted uppercase tracking-wider">
                      {item.label}
                    </div>
                    <div className="pl-3 border-l border-crew-border ml-1 space-y-1">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="block py-2 text-[14px] text-crew-ink"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <a
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 border-b border-crew-border"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
            <a
              href="/request-access"
              className="inline-flex items-center justify-center h-10 rounded-full text-white text-sm font-semibold mt-2 bg-crew-ink"
            >
              Request a Demo
            </a>
          </div>
        </div>
      )}
    </>
  );
}
