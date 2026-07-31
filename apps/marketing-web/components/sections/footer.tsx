"use client";

import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Battery Passport", href: "/battery" },
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
    <footer className="relative bg-gradient-to-b from-[#045c43] via-[#044e3a] to-[#022c22] text-white border-t border-emerald-500/20 pt-16 pb-12 overflow-x-clip">
      {/* Background Subtle Noise / Texture Accent */}
      <div className="absolute inset-0 pointer-events-none opacity-15 mix-blend-overlay">
        <svg className="w-full h-full">
          <filter id="grainFooter">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grainFooter)" />
        </svg>
      </div>

      <div className="relative max-w-[1240px] mx-auto px-6 z-10">
        {/* Top: brand + link columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-12 lg:gap-20 pb-16">
          {/* Brand */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center font-heading font-semibold text-[24px] uppercase tracking-normal text-white hover:text-emerald-300 transition-colors"
            >
              ANVIORA
            </Link>
            <p className="max-w-[340px] text-[14px] leading-[1.65] text-emerald-100/75 text-pretty">
              Digital product passports and compliance for Indian battery manufacturers selling at home and into Europe.
            </p>
          </div>

          {/* Link columns + Connect */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-[11px] font-mono font-semibold tracking-[0.14em] uppercase text-emerald-300/80 mb-4">
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[14px] font-medium text-emerald-100/80 hover:text-white transition-all inline-block hover:translate-x-0.5"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Connect section */}
            <div>
              <h4 className="text-[11px] font-mono font-semibold tracking-[0.14em] uppercase text-emerald-300/80 mb-4">
                Connect
              </h4>
              <div className="flex items-center gap-4 text-emerald-100/80">
                {/* X / Twitter */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors hover:scale-110 transform"
                  aria-label="X (Twitter)"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* GitHub */}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors hover:scale-110 transform"
                  aria-label="GitHub"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors hover:scale-110 transform"
                  aria-label="LinkedIn"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-emerald-500/20 py-6 text-[13px] text-emerald-200/60 font-mono">
          <span>© 2026 ANVIORA · ALL RIGHTS RESERVED</span>
          <span className="inline-flex items-center gap-2 text-emerald-300/80">
            <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-pulse" />
            EU Battery Passport deadline — 18 Feb 2027
          </span>
        </div>

        {/* Premium Watermark Wordmark */}
        <div className="relative w-full mt-6 pb-2 select-none pointer-events-none flex justify-center">
          <div className="leading-[0.9] text-center font-heading font-extrabold tracking-[-0.04em] text-transparent bg-clip-text bg-gradient-to-b from-white/[0.14] via-white/[0.04] to-transparent text-[clamp(72px,15vw,200px)]">
            Anviora
          </div>
        </div>
      </div>
    </footer>
  );
}
