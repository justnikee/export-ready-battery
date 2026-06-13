"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Battery Passport", href: "/battery" },
    { label: "Textile DPP", href: "/textile" },
    { label: "Pricing", href: "/pricing" },
    { label: "API Docs", href: "/docs" },
  ],
  Solutions: [
    { label: "EU Battery Regulation", href: "/battery" },
    { label: "India BWM Rules", href: "/battery" },
    { label: "DGFT TRACE", href: "/battery" },
    { label: "Compliance Coverage", href: "/battery" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "EU Battery Guide", href: "/battery" },
    { label: "BWM Rules Checklist", href: "/battery" },
    { label: "Help Center", href: "/docs" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "#" },
    { label: "Press Kit", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative pt-16 pb-9 overflow-hidden text-white"
      style={{ background: "linear-gradient(180deg, #2d2424 0%, #1f1818 100%)" }}
    >
      {/* Grain texture */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-[0.12] mix-blend-overlay pointer-events-none"
      >
        <filter id="footer-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#footer-grain)" />
      </svg>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-10 md:gap-8 mb-14">
          {/* Brand + newsletter */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white text-sm font-semibold"
            >
              <span
                className="w-4 h-4 rounded-[5px] bg-white"
                style={{ transform: "skewX(-10deg)" }}
              />
              ExportReady
            </Link>
            <p className="max-w-[260px] mt-3 text-[13px] leading-[1.55] text-white/75">
              AI compliance infrastructure for Indian battery and textile exporters
              selling into Europe.
            </p>

            <form
              className="mt-5"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <label htmlFor="newsletter" className="block text-[12px] font-medium text-white/90 mb-2">
                Subscribe to our newsletter
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="newsletter"
                  type="email"
                  placeholder="you@company.com"
                  className="flex-1 h-9 px-3 rounded-lg bg-white/10 border border-white/20 text-white text-[13px] placeholder:text-white/50 focus:outline-none focus:border-white/50"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white text-[#7c3a2e] hover:bg-white/90 transition-colors"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[13px] font-medium text-white mb-4">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] leading-[1.7] text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/15 pt-6 text-[12px] text-white/60">
          <span>© 2026 ExportReady. Built in India for Indian exporters. 🇮🇳</span>
          <div className="flex items-center gap-6 mt-3 sm:mt-0">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
