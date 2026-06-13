"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import TextReveal from "@/components/text-reveal";

const supplierRequests = [
  { name: "Shree Cells Pvt Ltd", item: "REACH declaration", status: "Received", tone: "green" },
  { name: "Meghna Polymers", item: "RoHS test report", status: "Opened", tone: "amber" },
  { name: "Kavya Metals", item: "Cobalt origin record", status: "Sent", tone: "gray" },
];

const assembleFields = [
  { label: "Identity & manufacturer", pct: 100 },
  { label: "Materials & composition", pct: 100 },
  { label: "Carbon footprint", pct: 80 },
  { label: "Supply chain due diligence", pct: 64 },
];

function StatusChip({ status, tone }: { status: string; tone: string }) {
  const styles =
    tone === "green"
      ? "bg-crew-green-soft text-crew-green"
      : tone === "amber"
        ? "bg-crew-amber-soft text-crew-amber"
        : "bg-crew-paper-soft text-crew-muted";
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-full text-[10.5px] font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

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
        <h3 className="text-[clamp(28px,3.4vw,40px)] font-semibold tracking-[-0.03em] leading-[1.1] text-crew-ink mb-5">
          <TextReveal as="span" className="block">
            {title}
          </TextReveal>
        </h3>
        <p className="text-[17px] leading-[1.6] text-crew-muted mb-6">{body}</p>
        <ul className="grid gap-3 mb-6">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[15px] text-crew-ink-secondary">
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
            body="ExportReady maps every certificate, test report, and supplier declaration against EU Battery Regulation and India BWM requirements — so you see exactly which gaps will block your next shipment."
            bullets={[
              "AI reads BIS, EPR, UN38.3, IEC 62133, MSDS and extracts 40+ fields",
              "Gap score per product line, updated as documents arrive",
              "Supplier reminders and expiry tracking built in",
            ]}
            cta={{ label: "Learn more", href: "/battery" }}
          >
            <div className={visualCard}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold text-crew-ink">Evidence requests</span>
                <span className="inline-flex items-center h-6 px-2.5 rounded-md bg-crew-coral-soft text-crew-coral text-[11px] font-semibold">
                  + New request
                </span>
              </div>
              <div className="grid gap-2">
                {supplierRequests.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-crew-border"
                  >
                    <div>
                      <div className="text-[12.5px] font-semibold text-crew-ink">{r.name}</div>
                      <div className="text-[11px] text-crew-muted">{r.item}</div>
                    </div>
                    <StatusChip status={r.status} tone={r.tone} />
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-crew-border text-[11px] font-medium text-crew-muted">
                14 of 17 suppliers responded this quarter
              </div>
            </div>
          </FeatureRow>

          {/* Row 2 — Assemble / Build */}
          <FeatureRow
            eyebrow="Assemble"
            title="Easy to build EU-ready passports"
            body="Turn scattered certificates and ERP exports into structured, versioned Battery Passports — with all 80+ fields the EU expects, and QR codes buyers can verify in seconds."
            bullets={[
              "80+ EU Battery Regulation fields, pre-mapped",
              "One-click QR-coded passport generation",
              "Full version history for every field change",
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
            </div>
          </FeatureRow>

          {/* Row 3 — Share / Govern */}
          <FeatureRow
            eyebrow="Share"
            title="Share evidence with buyers, under your control"
            body="Publish permissioned portals and QR-ready public pages. Buyers verify compliance in one click; you control exactly which fields each stakeholder sees."
            bullets={[
              "QR codes resolve to live, versioned records",
              "Per-buyer permissions on sensitive fields",
              "View tracking for every shared pack",
            ]}
            cta={{ label: "Explore sharing", href: "/battery" }}
          >
            <div className={visualCard}>
              <div className="text-[13px] font-semibold text-crew-ink mb-4">Share passport — LFP-B4471</div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-crew-border bg-crew-paper-soft mb-4">
                <span className="flex-1 text-[11.5px] font-medium text-crew-muted truncate">
                  portal.exportready.in/p/lfp-b4471
                </span>
                <span className="inline-flex items-center h-6 px-2.5 rounded-md bg-crew-navy text-white text-[11px] font-semibold">
                  Copy link
                </span>
              </div>
              <div className="grid gap-2.5">
                {[
                  { label: "Nordvolt GmbH", desc: "Full evidence access", on: true },
                  { label: "Eurocell Logistics", desc: "Passport fields only", on: true },
                  { label: "Public QR view", desc: "Regulated fields only", on: false },
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
            title="Catch compliance gaps before they become blocked shipments"
            body="Get 30/7/day-of alerts for expiring certificates, stale carbon data, and missing supplier evidence — so your team fixes problems before they reach Rotterdam."
            bullets={[
              "Proactive alerts for certificate expiry and compliance drops",
              "Multi-supplier dashboard with risk scoring",
              "Audit-ready evidence packs in one click",
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
