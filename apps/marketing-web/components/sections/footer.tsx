"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Every href below points at a route that actually exists — /contact and
// /docs were dead links (no such routes in app/); replaced with the real
// lead-gen route or dropped rather than left pointing at nothing.
const footerLinks = {
  Product: [
    { label: "Battery Passport", href: "/battery" },
    { label: "Textile DPP", href: "/textile" },
    { label: "Pricing", href: "/pricing" },
  ],
  Solutions: [
    { label: "EU Battery Regulation", href: "/compliance/eu-battery-regulation" },
    { label: "India BWM Rules", href: "/compliance/india-bwm-rules" },
    { label: "DGFT TRACE", href: "/battery" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "EU Battery Guide", href: "/compliance/eu-battery-regulation" },
    { label: "BWM Rules Checklist", href: "/compliance/india-bwm-rules" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/request-access" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-paper">
      <div className="relative max-w-[1240px] mx-auto px-6 pt-16 lg:pt-20">
        {/* Top: brand + link columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_2fr] gap-12 lg:gap-20 pb-14">
          {/* Brand + newsletter */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-crew-ink"
              style={{ fontSize: "24px" }}
            >
              <span
                className="w-[18px] h-[18px] rounded-[5px] bg-crew-coral"
                style={{ transform: "skewX(-10deg)" }}
              />
              Anviora
            </Link>
            <p className="max-w-[320px] mt-4 text-[14px] leading-[1.65] text-crew-muted text-pretty">
              Digital product passports and compliance for Indian battery and
              textile manufacturers selling at home and into Europe.
            </p>

            <form
              className="mt-7"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <label
                htmlFor="newsletter"
                className="block text-[12px] font-semibold text-crew-ink mb-2.5"
              >
                Regulation updates, monthly. No spam.
              </label>
              <div className="flex items-center gap-2 max-w-[340px]">
                <input
                  id="newsletter"
                  type="email"
                  placeholder="you@company.com"
                  className="flex-1 h-11 px-4 rounded-full bg-white text-crew-ink text-[14px] placeholder:text-crew-muted focus:outline-none focus:ring-2 focus:ring-crew-coral/25 transition-shadow"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-crew-coral text-white hover:bg-crew-coral-light transition-colors shrink-0"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-crew-muted mb-4">
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[14px] font-medium text-crew-ink/70 hover:text-crew-coral transition-colors"
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

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-crew-ink/8 py-6 text-[13px] text-crew-muted">
          <span>© 2026 Anviora · Built in India for Indian exporters 🇮🇳</span>
          <span className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-crew-coral" />
            EU Battery Passport deadline — 18 Feb 2027
          </span>
        </div>
      </div>

      {/* Watermark wordmark */}
      <div
        aria-hidden="true"
        className="relative select-none pointer-events-none leading-none text-center font-semibold tracking-[-0.04em] text-crew-ink/5 text-[clamp(100px,18vw,230px)] -mb-[0.24em]"
      >
        Anviora
      </div>
    </footer>
  );
}
