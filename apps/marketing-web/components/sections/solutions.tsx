"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  FileText,
  FolderOpen,
  Globe,
  Package,
} from "lucide-react";
import TextReveal from "@/components/text-reveal";

function GlowHandlers(e: React.MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
}

const cardBase =
  "glow-card group bg-paper border border-hairline rounded-2xl p-7 transition-all duration-200 hover:shadow-[0_1px_3px_rgba(42,37,33,0.06),0_16px_40px_rgba(194,84,44,0.12)] flex flex-col";

function CardHeader({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent-soft text-accent mb-4">
        {icon}
      </div>
      <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink mb-2">
        {title}
      </h3>
      <p className="text-[14px] leading-[1.5] text-ink-mute">{children}</p>
    </div>
  );
}

function LearnMore({ href = "#" }: { href?: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 mt-4 text-[13.5px] font-semibold text-accent"
    >
      Learn more <ArrowRight size={13} className="cta-arrow" />
    </a>
  );
}

const passportFields = [
  ["Chemistry", "LFP"],
  ["Rated capacity", "105 Ah"],
  ["Carbon class", "B"],
  ["Recycled content", "12.4%"],
  ["Hazardous substances", "None declared"],
];

const vaultDocs = [
  { name: "BIS-R-41023881.pdf", meta: "Valid · expires Mar 2027", ok: true },
  { name: "UN38.3-TestReport.pdf", meta: "Valid · expires Nov 2026", ok: true },
  { name: "Cobalt-DueDiligence.docx", meta: "Awaiting supplier", ok: false },
];

const gapAlerts = [
  { text: "CE Declaration expires in 14 days", tone: "#ea580c" },
  { text: "2 suppliers missing REACH letters", tone: "#dc2626" },
  { text: "Carbon data stale for PACK-M204", tone: "#a16207" },
];

export default function Solutions() {
  return (
    <section id="product" className="py-24 bg-canvas-soft">
      <div className="max-w-[1080px] mx-auto px-6">
        {/* Head */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[640px] mb-14"
        >
          <div className="eyebrow mb-3">Modular products</div>
          <h2 className="display-lg text-[clamp(30px,4vw,42px)] mb-5">
            <TextReveal as="span" className="block">
              A fully integrated compliance suite
            </TextReveal>
          </h2>
          <p className="text-[17px] leading-[1.6] text-ink-mute">
            Reduce audit prep, blocked shipments, and buyer back-and-forth with one
            connected platform. Each product works on its own — together they run
            your entire export compliance programme.
          </p>
        </motion.div>

        {/* Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Passports — large */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`${cardBase} sm:col-span-2 lg:flex-row lg:items-center lg:gap-10`}
            onMouseMove={GlowHandlers}
          >
            <div className="lg:flex-1">
              <CardHeader icon={<Package size={18} />} title="Digital product passports">
                Publish versioned, QR-ready passports for every SKU — with the 80+
                fields the EU Battery Regulation expects, kept current automatically.
              </CardHeader>
              <LearnMore href="/battery" />
            </div>
            {/* Mini passport record */}
            <div className="mt-6 lg:mt-0 lg:w-[320px] shrink-0 rounded-xl border border-hairline bg-paper shadow-[0_8px_24px_rgba(42,37,33,0.07)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
                <span className="text-[12.5px] font-bold text-ink" style={{ fontFeatureSettings: '"tnum"' }}>
                  LFP-B4471
                </span>
                <span className="inline-flex items-center h-[20px] px-2 rounded-full bg-[#e8f7ef] text-[#1a7f4f] text-[10.5px] font-semibold">
                  Published · v14
                </span>
              </div>
              {passportFields.map(([k, v], i) => (
                <div
                  key={k}
                  className={`flex items-center justify-between px-4 py-[8px] text-[12px] ${
                    i < passportFields.length - 1 ? "border-b border-hairline" : ""
                  }`}
                >
                  <span className="text-ink-mute-2">{k}</span>
                  <span className="font-semibold text-ink" style={{ fontFeatureSettings: '"tnum"' }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </motion.article>

          {/* Supplier vault */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className={cardBase}
            onMouseMove={GlowHandlers}
          >
            <CardHeader icon={<FolderOpen size={18} />} title="Supplier evidence vault">
              Certificates, test reports, and declarations from every tier — organised,
              versioned, and linked to the products they cover.
            </CardHeader>
            <div className="mt-6 grid gap-2">
              {vaultDocs.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-hairline"
                >
                  <FileText size={14} className="shrink-0 text-ink-mute-2" />
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-semibold text-ink truncate">
                      {doc.name}
                    </div>
                    <div
                      className={`text-[10.5px] font-medium ${
                        doc.ok ? "text-[#1a7f4f]" : "text-[#a16207]"
                      }`}
                    >
                      {doc.meta}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <LearnMore />
          </motion.article>

          {/* Gap monitoring */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cardBase}
            onMouseMove={GlowHandlers}
          >
            <CardHeader icon={<Bell size={18} />} title="Gap monitoring">
              Catch expiring certificates and missing evidence months before they
              become blocked shipments.
            </CardHeader>
            <div className="mt-6 grid gap-2">
              {gapAlerts.map((alert) => (
                <div
                  key={alert.text}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-hairline text-[11.5px] font-medium text-ink"
                >
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: alert.tone }}
                  />
                  {alert.text}
                </div>
              ))}
            </div>
            <LearnMore />
          </motion.article>

          {/* Buyer portal */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className={cardBase}
            onMouseMove={GlowHandlers}
          >
            <CardHeader icon={<Globe size={18} />} title="Buyer portal">
              Give European buyers a polished, permissioned view of your evidence —
              no email attachments, no spreadsheets.
            </CardHeader>
            <div className="mt-6 rounded-lg border border-hairline overflow-hidden">
              <div className="px-3 py-2 bg-canvas-soft text-[11px] font-medium text-ink-mute-2 truncate">
                portal.anviora.com/p/lfp-b4471
              </div>
              <div className="px-3 py-2.5 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-accent border-2 border-paper" />
                  <span className="w-5 h-5 rounded-full bg-ink-secondary border-2 border-paper" />
                  <span className="w-5 h-5 rounded-full bg-[#d9a574] border-2 border-paper" />
                </div>
                <span className="text-[11px] font-medium text-ink-mute">
                  Viewed by Nordvolt GmbH · 2h ago
                </span>
              </div>
            </div>
            <LearnMore />
          </motion.article>

          {/* Audit packs */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cardBase}
            onMouseMove={GlowHandlers}
          >
            <CardHeader icon={<FileText size={18} />} title="Audit evidence packs">
              Assemble buyer packs and regulator exports from data you already
              have — in minutes, not weeks.
            </CardHeader>
            <div className="mt-6 rounded-lg border border-hairline px-3 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11.5px] font-semibold text-ink">
                  Q3 buyer pack — Nordvolt
                </span>
                <span
                  className="text-[11px] font-semibold text-accent"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  92%
                </span>
              </div>
              <div className="h-[6px] rounded-full bg-canvas-soft overflow-hidden">
                <div className="h-full w-[92%] rounded-full bg-accent" />
              </div>
              <div className="mt-2 text-[10.5px] font-medium text-ink-mute-2">
                312 documents · 4 product lines · 1 open gap
              </div>
            </div>
            <LearnMore />
          </motion.article>
        </div>
      </div>
    </section>
  );
}
