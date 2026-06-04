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
      { label: "Anviora Battery", href: "/battery", desc: "Digital battery passports" },
      { label: "Anviora Textile", href: "/textile", desc: "Textile DPP & traceability" },
      { label: "Pricing", href: "/pricing", desc: "Plans for every scale" },
    ],
  },
  {
    label: "Solutions",
    children: [
      { label: "EU Battery Regulation", href: "/battery", desc: "2023/1542 compliance" },
      { label: "India BWM Rules", href: "/battery", desc: "Domestic compliance" },
      { label: "DGFT TRACE", href: "/battery", desc: "Export incentive claims" },
    ],
  },
  {
    label: "Resources",
    children: [
      { label: "Blog", href: "/blog", desc: "Insights & updates" },
      { label: "Documentation", href: "/docs", desc: "API & platform docs" },
      { label: "EU Battery Guide", href: "/battery", desc: "Regulatory roadmap" },
    ],
  },
  { label: "Company", href: "#" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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

  // Close on escape
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-[#e3e8ee]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1080px] mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left cluster: Logo + Nav */}
          <div className="flex items-center gap-8">
            {/* Brand */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#0d253d] text-sm font-semibold shrink-0"
            >
              <span
                className="w-4 h-4 rounded-[5px]"
                style={{
                  background: "linear-gradient(135deg, #533afd, #ea2261)",
                  transform: "skewX(-10deg)",
                  boxShadow: "rgba(83,58,253,.26) 0 8px 18px",
                }}
              />
              Anviora
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isOpen = activeLabel === item.label;
                if (!item.children) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="px-3 py-1.5 text-[13px] font-medium text-[#61718a] hover:text-[#0d253d] transition-colors rounded-md"
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
                      className={`flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                        isOpen
                          ? "text-[#0d253d] bg-[#f6f9fc]"
                          : "text-[#61718a] hover:text-[#0d253d]"
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
                      className={`absolute top-full left-0 mt-1 w-[220px] bg-white rounded-xl border border-[#e3e8ee] shadow-[rgba(0,55,112,0.08)_0_12px_40px] py-2 z-50 transition-all duration-200 origin-top-left ${
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
                          className="block px-4 py-2.5 hover:bg-[#f6f9fc] transition-colors"
                        >
                          <div className="text-[13px] font-medium text-[#0d253d]">
                            {child.label}
                          </div>
                          {child.desc && (
                            <div className="text-[11px] text-[#64748d] mt-0.5">
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
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-3.5 text-[13px] font-medium text-[#61718a]">
            <a
              href="/login"
              className="hover:text-[#0d253d] transition-colors"
            >
              Sign in
            </a>
            <a
              href="/demo"
              className="inline-flex items-center justify-center gap-1.5 h-[30px] px-3.5 rounded-full text-[13px] font-medium text-white"
              style={{ background: "#533afd" }}
            >
              Book demo
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-[#0d253d]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-16 px-6 md:hidden overflow-y-auto">
          <div className="flex flex-col gap-2 text-[15px] font-medium text-[#0d253d]">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <div className="py-2 text-[13px] font-semibold text-[#64748d] uppercase tracking-wider">
                      {item.label}
                    </div>
                    <div className="pl-3 border-l border-[#e3e8ee] ml-1 space-y-1">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="block py-2 text-[14px] text-[#0d253d]"
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
                    className="block py-2 border-b border-[#e3e8ee]"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
            <a href="/login" className="py-2 text-[#61718a]">
              Sign in
            </a>
            <a
              href="/demo"
              className="inline-flex items-center justify-center h-9 rounded-full text-white text-sm font-medium mt-2"
              style={{ background: "#533afd" }}
            >
              Book demo
            </a>
          </div>
        </div>
      )}
    </>
  );
}
