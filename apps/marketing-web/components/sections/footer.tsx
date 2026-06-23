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
    <footer className="relative pt-20 pb-10 overflow-hidden text-white"
      style={{ background: "linear-gradient(180deg, #11251d 0%, #0a160f 100%)" }}
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
              className="inline-flex items-center gap-2.5 font-serif italic text-white"
              style={{ fontSize: "24px" }}
            >
              <span
                className="w-[18px] h-[18px] rounded-[5px] bg-crew-coral"
                style={{ transform: "skewX(-10deg)" }}
              />
              Anviora
            </Link>
            <p className="max-w-[280px] mt-4 text-[14px] leading-[1.65] text-white/60">
              The Digital Product Identity Platform — compliance and passports for Indian
              battery and textile manufacturers selling at home and into Europe.
            </p>

            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <label htmlFor="newsletter" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45 mb-2.5">
                Subscribe to our newsletter
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="newsletter"
                  type="email"
                  placeholder="you@company.com"
                  className="flex-1 h-10 px-3.5 rounded-lg bg-white/[0.07] border border-white/15 text-white text-[14px] placeholder:text-white/40 focus:outline-none focus:border-crew-coral-light transition-colors"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-crew-coral text-white hover:bg-crew-coral-light transition-colors"
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
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45 mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[14px] text-white/65 hover:text-white transition-colors"
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
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/10 pt-7 text-[12.5px] text-white/50">
          <span>© 2026 Anviora. Built in India for Indian exporters. 🇮🇳</span>
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
