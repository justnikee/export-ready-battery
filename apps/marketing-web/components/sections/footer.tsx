"use client";

import Link from "next/link";
import { AnvioraLogo } from "../anviora-logo";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const footerNav: Record<string, FooterLink[]> = {
  Products: [
    { label: "Battery Passport", href: "/battery" },
    { label: "EU 2023/1542 Guide", href: "/compliance/eu-battery-regulation" },
    { label: "India BWM Rules", href: "/compliance/india-bwm-rules" },
    { label: "Pricing", href: "/pricing" },
  ],
  Connect: [
    { label: "Twitter (X)", href: "https://x.com", external: true },
    { label: "LinkedIn", href: "https://linkedin.com", external: true },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-[#0e9f6e] text-white border-t border-emerald-700/40 pt-[64px] pb-[160px] font-sans antialiased overflow-hidden">
      {/* CRT Scanlines Overlay (Matching Hero Texture) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.25] mix-blend-overlay z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)",
        }}
      />

      <div className="relative z-10 max-w-[1232px] mx-auto px-6 sm:px-8">
        {/* Top Section: Brand + Important Links */}
        <div className="flex flex-col md:flex-row justify-between gap-12 pb-16">
          {/* Brand Info */}
          <div className="space-y-3 max-w-[320px]">
            <Link
              href="/"
              className="inline-block hover:opacity-80 transition-opacity"
            >
              <AnvioraLogo className="h-7 sm:h-8 w-auto text-black" />
            </Link>
            <p className="text-[13px] leading-[1.65] text-emerald-950/80 font-medium text-pretty">
              Digital product passports and compliance for Indian battery exporters.
            </p>
          </div>

          {/* Minimalist Link Columns (Products, Connect, Legal) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 md:gap-16">
            {Object.entries(footerNav).map(([section, links]) => (
              <div key={section} className="space-y-4">
                <h4 className="text-[11px] font-mono font-bold tracking-[0.18em] uppercase text-emerald-950">
                  {section}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="text-[13.5px] text-black font-semibold hover:opacity-75 transition-opacity cursor-pointer"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider Line & Bottom Bar */}
        <div className="border-t border-black/15 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-emerald-950 font-semibold">
          <div>
            © 2026 ANVIORA LABS INC. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-2 text-black font-bold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 bg-black inline-block animate-pulse" />
            ALL SYSTEMS OPERATIONAL
          </div>
        </div>
      </div>
    </footer>
  );
}
