"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, FileText, QrCode } from "lucide-react";
import TextReveal from "@/components/text-reveal";

const parsedFields = [
  { label: "Chemistry", value: "LFP" },
  { label: "Nominal voltage", value: "3.2 V" },
  { label: "Rated capacity", value: "280 Ah" },
  { label: "Cycle life", value: "6,000" },
  { label: "UN38.3", value: "Pass" },
  { label: "Mfg. country", value: "India" },
];

const assembleFields = [
  { label: "Identity & manufacturer", pct: 100 },
  { label: "Materials & composition", pct: 100 },
  { label: "Carbon footprint", pct: 80 },
  { label: "Supply chain due diligence", pct: 64 },
];

const carbonClasses = ["A", "B", "C", "D", "E"];

interface RowProps {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  cta?: { label: string; href: string };
  flip?: boolean;
  children: React.ReactNode;
}

function FeatureRow({ eyebrow, title, body, bullets, cta, flip, children }: RowProps) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center ${
        flip ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
          {eyebrow}
        </div>
        <h3 className="font-serif text-[clamp(28px,3.4vw,40px)] font-normal tracking-[-0.01em] leading-[1.08] text-crew-ink mb-5">
          <TextReveal as="span" className="block">
            {title}
          </TextReveal>
        </h3>
        <p className="text-[16px] leading-[1.6] text-[#131313] mb-3">{body}</p>
        <ul className="grid gap-2 mb-6">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[16px] leading-[1.6] text-[#131313]">
              <span className="inline-flex items-center justify-center w-[20px] h-[20px] mt-0.5 rounded-full bg-crew-coral-soft text-crew-coral shrink-0">
                <Check size={12} strokeWidth={3} />
              </span>
              {b}
            </li>
          ))}
        </ul>
        {cta && (
          <a
            href={cta.href}
            className="group inline-flex items-center gap-1 text-[15px] font-semibold text-crew-coral hover:text-crew-coral-light transition-colors"
          >
            {cta.label} <ArrowRight size={15} className="cta-arrow" />
          </a>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

const visualCard =
  "rounded-2xl border border-crew-border bg-crew-paper p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.1),0_18px_36px_-18px_rgba(0,0,0,0.08)]";

export default function Platform() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-crew-paper">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid gap-28 lg:gap-36">
          {/* Row 1 — Collect / Discover */}
          <FeatureRow
            eyebrow="Collect"
            title="Know what's missing before you ship"
            body="Drop in your BIS, EPR, UN38.3, IEC 62133 and MSDS PDFs. Anviora reads them, extracts 100+ fields, and maps every one against EU and India requirements — so you see exactly which gaps will block your next order."
            bullets={[
              "AI extracts 100+ fields from a certificate in seconds",
              "Live gap score per product line, updated as documents arrive",
              "Supplier reminders and expiry tracking built in",
            ]}
            cta={{ label: "Learn more", href: "/battery" }}
          >
            <div className={visualCard}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold text-crew-ink">Certificate parsing</span>
                <span className="inline-flex items-center h-6 px-2.5 rounded-md bg-crew-green-soft text-crew-green text-[11px] font-semibold">
                  112 fields · 98%
                </span>
              </div>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-crew-border mb-4">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-crew-coral-soft text-crew-coral shrink-0">
                  <FileText size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-crew-ink truncate">
                    UN38.3_LFP-B4471.pdf
                  </div>
                  <div className="text-[11px] text-crew-muted">Parsed in 4.2s · auto-mapped</div>
                </div>
                <span className="inline-flex items-center h-5 px-2 rounded-full bg-crew-green-soft text-crew-green text-[10.5px] font-semibold">
                  Done
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {parsedFields.map((f) => (
                  <div key={f.label} className="px-3 py-2 rounded-lg bg-crew-paper-soft">
                    <div className="text-[10px] uppercase tracking-wider text-crew-muted">
                      {f.label}
                    </div>
                    <div
                      className="text-[12.5px] font-semibold text-crew-ink"
                      style={{ fontFeatureSettings: '"tnum"' }}
                    >
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-crew-border text-[11px] font-medium text-crew-muted">
                Mapped to EU 2023/1542 + India BWM — 2 gaps flagged
              </div>
            </div>
          </FeatureRow>

          {/* Row 2 — Assemble / Build */}
          <FeatureRow
            eyebrow="Assemble"
            title="Build an EU-ready passport in minutes"
            body="Turn scattered certificates and ERP exports into a structured, versioned Battery Passport — every field the EU expects, a calculated carbon class, and a QR code buyers can verify in seconds."
            bullets={[
              "Every EU 2023/1542 passport field, pre-mapped",
              "Carbon footprint + A–G class, calculated for you",
              "Full version history on every field",
            ]}
            cta={{ label: "See how it works", href: "/battery" }}
            flip
          >
            <div className={visualCard}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-semibold text-crew-ink">LFP-B4471 — passport build</span>
                <span
                  className="text-[20px] font-bold tracking-[-0.02em] text-crew-ink"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  84%
                </span>
              </div>
              <div className="text-[11px] text-crew-muted mb-5">Ready to publish once due diligence closes</div>
              <div className="grid gap-4">
                {assembleFields.map((f) => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between mb-1.5 text-[12px]">
                      <span className="font-medium text-crew-ink-secondary">{f.label}</span>
                      <span
                        className={`font-semibold ${f.pct === 100 ? "text-crew-green" : "text-crew-muted"}`}
                        style={{ fontFeatureSettings: '"tnum"' }}
                      >
                        {f.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-crew-paper-soft overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${f.pct}%`,
                          background: f.pct === 100 ? "#22c55e" : "var(--color-crew-coral)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-crew-border flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-crew-muted mb-1.5">Carbon class</div>
                  <div className="flex items-center gap-1">
                    {carbonClasses.map((c) => (
                      <span
                        key={c}
                        className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold ${
                          c === "B"
                            ? "bg-crew-green text-white"
                            : "bg-crew-paper-soft text-crew-muted"
                        }`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg border border-crew-border text-crew-ink">
                  <QrCode size={28} />
                </span>
              </div>
            </div>
          </FeatureRow>

          {/* Row 3 — Share / Govern */}
          <FeatureRow
            eyebrow="Share"
            title="Share proof with buyers, on your terms"
            body="Publish a QR-coded public page and permissioned portals. Buyers verify in one click; regulators get the full audit trail; you control exactly which fields each side sees."
            bullets={[
              "Three access tiers — public, partner, regulator (Art. 78)",
              "Magic-link portals per buyer",
              "Scan analytics and view tracking",
            ]}
            cta={{ label: "Explore sharing", href: "/battery" }}
          >
            <div className={visualCard}>
              <div className="text-[13px] font-semibold text-crew-ink mb-4">Share passport — LFP-B4471</div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-crew-border bg-crew-paper-soft mb-4">
                <span className="flex-1 text-[11.5px] font-medium text-crew-muted truncate">
                  portal.anviora.com/p/lfp-b4471
                </span>
                <span className="inline-flex items-center h-6 px-2.5 rounded-md bg-crew-navy text-white text-[11px] font-semibold">
                  Copy link
                </span>
              </div>
              <div className="grid gap-2.5">
                {[
                  { label: "Public QR page", desc: "Regulated fields — anyone", on: true },
                  { label: "Buyer portal — Nordvolt", desc: "Partner: full evidence", on: true },
                  { label: "Regulator access", desc: "Complete audit trail", on: false },
                ].map((p) => (
                  <div key={p.label} className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[12.5px] font-semibold text-crew-ink">{p.label}</div>
                      <div className="text-[11px] text-crew-muted">{p.desc}</div>
                    </div>
                    <span
                      className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${
                        p.on ? "bg-crew-coral" : "bg-crew-border"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow ${
                          p.on ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-crew-border flex items-center gap-1.5 text-[11px] font-medium text-crew-muted">
                Viewed by Nordvolt GmbH 2 hours ago
                <ArrowRight size={11} />
              </div>
            </div>
          </FeatureRow>

          {/* Row 4 — Monitor / Optimize */}
          <FeatureRow
            eyebrow="Monitor"
            title="Catch problems before they reach the port"
            body="Anviora watches every certificate, carbon figure, and supplier record and warns you 30, 7, and 1 days out — so issues get fixed in Pune, not flagged in Rotterdam."
            bullets={[
              "Proactive expiry and compliance-drop alerts",
              "Multi-supplier dashboard with risk scoring",
              "Audit-ready evidence pack in one click",
            ]}
            cta={{ label: "See monitoring", href: "/battery" }}
            flip
          >
            <div className={visualCard}>
              <div className="text-[13px] font-semibold text-crew-ink mb-4">Compliance alerts — Next 30 days</div>
              <div className="grid gap-3">
                {[
                  { text: "CE Declaration expires in 14 days", tone: "#ea580c", icon: "!" },
                  { text: "2 suppliers missing REACH letters", tone: "#dc2626", icon: "!" },
                  { text: "Carbon data stale for PACK-M204", tone: "#a16207", icon: "•" },
                ].map((alert) => (
                  <div
                    key={alert.text}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-crew-border text-[13px] font-medium text-crew-ink"
                  >
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold shrink-0"
                      style={{ background: alert.tone }}
                    >
                      {alert.icon}
                    </span>
                    {alert.text}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-crew-border flex items-center justify-between text-[11px] font-medium text-crew-muted">
                <span>3 risks need attention</span>
                <a href="/battery" className="text-crew-coral hover:underline">
                  View all
                </a>
              </div>
            </div>
          </FeatureRow>
        </div>
      </div>
    </section>
  );
}
