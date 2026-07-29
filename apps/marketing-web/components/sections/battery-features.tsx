"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Bell,
  ShieldCheck,
  Truck,
} from "lucide-react";

/* ─── Visual building blocks ──────────────────────────────── */

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="w-full">{children}</div>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-none border border-border/70 bg-slate-50/70 p-5 ${className}`}>{children}</div>;
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[12px] font-bold uppercase tracking-wider text-slate-900 mb-4">{children}</div>
  );
}

/* 1 — Certificate parsing */
function ParseVisual() {
  return (
    <Panel tint="green">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-crew-coral-soft text-crew-coral shrink-0">
            <FileText size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-crew-ink truncate">
              UN38.3_LFP-B4471.pdf
            </div>
            <div className="text-[11px] text-crew-muted">Parsed · auto-mapped to EU + BIS</div>
          </div>
          <span className="inline-flex items-center h-5 px-2 rounded-full bg-crew-green-soft text-crew-green text-[10.5px] font-semibold">
            Done
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Chemistry · LFP", "Voltage · 3.2 V", "Capacity · 280 Ah", "T1–T8 · Pass", "Mfg · India", "+107 more"].map((c) => (
            <span key={c} className="inline-flex items-center h-7 px-2.5 rounded-full bg-paper text-[11.5px] font-semibold text-crew-ink">
              {c}
            </span>
          ))}
        </div>
      </Card>
    </Panel>
  );
}

/* 2 — Carbon class */
function CarbonVisual() {
  const classes = ["A", "B", "C", "D", "E", "F", "G"];
  return (
    <Panel tint="blue">
      <Card>
        <CardLabel>Carbon footprint — LFP-B4471</CardLabel>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-[30px] font-bold tracking-[-0.03em] text-crew-ink leading-none" style={{ fontFeatureSettings: '"tnum"' }}>
              84
            </div>
            <div className="text-[11px] text-crew-muted mt-1">kg CO₂e / kWh</div>
          </div>
          <div className="text-[11px] text-crew-muted text-right">
            JRC-aligned<br />methodology
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {classes.map((c) => (
            <span
              key={c}
              className={`flex-1 inline-flex items-center justify-center h-9 rounded-lg text-[13px] font-bold ${
                c === "B" ? "bg-crew-coral text-white" : "bg-paper text-crew-muted"
              }`}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="mt-3 text-[11px] font-medium text-crew-coral">
          Performance class B — ready for Annex II declaration
        </div>
      </Card>
    </Panel>
  );
}

/* 3 — Renewal alerts */
function RenewalVisual() {
  const alerts = [
    { name: "BIS IS 16046", days: "30 days", tone: "#a16207", bg: "#fdf3e3" },
    { name: "UN38.3 test report", days: "7 days", tone: "#ea580c", bg: "#ffedd5" },
    { name: "MSDS revision", days: "1 day", tone: "#dc2626", bg: "#fef2f2" },
  ];
  return (
    <Panel tint="amber">
      <Card>
        <CardLabel>Expiry timeline — next 30 days</CardLabel>
        <div className="grid gap-2.5">
          {alerts.map((a) => (
            <div key={a.name} className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ background: a.bg, color: a.tone }}>
                <Bell size={14} />
              </span>
              <span className="flex-1 text-[13px] font-medium text-crew-ink">{a.name}</span>
              <span className="text-[12px] font-bold" style={{ color: a.tone, fontFeatureSettings: '"tnum"' }}>
                {a.days}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-crew-ink/8 text-[11px] text-crew-muted">
          Email + in-app · 30, 7 and 1 days out
        </div>
      </Card>
    </Panel>
  );
}

/* 4 — Bitcoin anchoring */
function AnchorVisual() {
  return (
    <div className="rounded-none border border-slate-800 bg-slate-950 p-5 font-mono text-[12px] leading-relaxed text-white shadow-md">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bitcoin Anchor</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>
      <div className="text-slate-400 text-[10.5px] uppercase tracking-wider mb-0.5">certificate</div>
      <div className="text-white font-semibold mb-3 truncate">BIS_IS16046_2024.pdf</div>
      <div className="text-slate-400 text-[10.5px] uppercase tracking-wider mb-0.5">sha256 digest</div>
      <div className="text-amber-300 font-mono text-[11px] mb-4 truncate">a91f 7c2e 08d4 … 44b1 c4e2</div>
      <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-400" />
          Anchored via OpenTimestamps
        </span>
        <span className="text-slate-400 font-medium">Block #842,190</span>
      </div>
    </div>
  );
}

/* 5 — Mass balance ledger */
function MassBalanceVisual() {
  const rows = [
    { mat: "Cobalt", inQty: "1,240 kg", alloc: "980 kg", bal: "260 kg" },
    { mat: "Lithium", inQty: "3,600 kg", alloc: "3,180 kg", bal: "420 kg" },
    { mat: "Nickel", inQty: "820 kg", alloc: "790 kg", bal: "30 kg" },
  ];
  return (
    <Panel tint="green">
      <Card>
        <CardLabel>Recycled-content ledger (Art. 8)</CardLabel>
        <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold text-crew-muted mb-2 px-1">
          <span>Material</span>
          <span className="text-right">In</span>
          <span className="text-right">Allocated</span>
          <span className="text-right">Balance</span>
        </div>
        <div className="grid gap-1.5">
          {rows.map((r) => (
            <div key={r.mat} className="grid grid-cols-4 gap-2 items-center rounded-lg bg-paper px-2.5 py-2 text-[12px]" style={{ fontFeatureSettings: '"tnum"' }}>
              <span className="font-semibold text-crew-ink">{r.mat}</span>
              <span className="text-right text-crew-muted">{r.inQty}</span>
              <span className="text-right text-crew-muted">{r.alloc}</span>
              <span className="text-right font-bold text-crew-coral">{r.bal}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] font-medium text-crew-green">
          ✓ Book-and-claim consistent — no negative balances
        </div>
      </Card>
    </Panel>
  );
}

/* 6 — DGFT claims */
function DgftVisual() {
  const claims = [
    { name: "RoDTEP claim — Q1", amt: "₹1,84,200", status: "Filed" },
    { name: "Duty drawback — SB 4471", amt: "₹92,600", status: "Filed" },
    { name: "Interest equalization", amt: "₹41,800", status: "Draft" },
  ];
  return (
    <Panel tint="amber">
      <Card>
        <CardLabel>Export incentive claims</CardLabel>
        <div className="grid gap-1.5">
          {claims.map((c) => (
            <div key={c.name} className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2.5">
              <span className="flex-1 text-[12.5px] font-medium text-crew-ink truncate">{c.name}</span>
              <span className="text-[12.5px] font-bold text-crew-ink" style={{ fontFeatureSettings: '"tnum"' }}>{c.amt}</span>
              <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold ${c.status === "Filed" ? "bg-crew-green-soft text-crew-green" : "bg-crew-amber-soft text-[#b45309]"}`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] font-medium text-crew-coral">
          Generated from the same passport data — up to 75% of platform cost back
        </div>
      </Card>
    </Panel>
  );
}

/* 7 — Fleet health */
function FleetVisual() {
  const packs = [
    { id: "PACK-M201", soh: 97, tone: "#157a5b" },
    { id: "PACK-M204", soh: 91, tone: "#157a5b" },
    { id: "PACK-M209", soh: 74, tone: "#ea580c" },
  ];
  return (
    <Panel tint="blue">
      <Card>
        <CardLabel>Fleet health — shipped units</CardLabel>
        <div className="grid gap-3">
          {packs.map((p) => (
            <div key={p.id}>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="font-mono font-semibold text-crew-ink">{p.id}</span>
                <span className="font-bold" style={{ color: p.tone, fontFeatureSettings: '"tnum"' }}>
                  SoH {p.soh}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-paper overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p.soh}%`, background: p.tone }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#fff7ed] px-3 py-2 text-[11.5px] font-medium text-[#c2410c]">
          <Truck size={13} /> PACK-M209 — thermal event flagged, buyer notified
        </div>
      </Card>
    </Panel>
  );
}

/* 8 — Supplier due diligence */
function SupplierVisual() {
  const suppliers = [
    { name: "Vedanta Metals", region: "Odisha, IN", risk: "Low", tone: "bg-crew-green-soft text-crew-green" },
    { name: "Congo Cobalt Co.", region: "DRC", risk: "High", tone: "bg-[#fef2f2] text-[#dc2626]" },
    { name: "Ganfeng Lithium", region: "Jiangxi, CN", risk: "Medium", tone: "bg-crew-amber-soft text-[#b45309]" },
  ];
  return (
    <Panel tint="green">
      <Card>
        <CardLabel>Supplier risk — OECD-aligned scoring</CardLabel>
        <div className="grid gap-1.5">
          {suppliers.map((s) => (
            <div key={s.name} className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-crew-ink truncate">{s.name}</div>
                <div className="text-[11px] text-crew-muted">{s.region}</div>
              </div>
              <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold ${s.tone}`}>
                {s.risk}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-crew-muted">CMRT upload accepted · Art. 11 evidence pack ready</div>
      </Card>
    </Panel>
  );
}

/* 9 — W3C Verifiable Credential */
function VcVisual() {
  return (
    <div className="rounded-none border border-slate-800 bg-slate-950 p-5 font-mono text-[12px] leading-relaxed text-white shadow-md">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
        <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-500/20 text-emerald-400">
          <ShieldCheck size={16} />
        </span>
        <span className="font-heading text-[13px] font-bold text-white">BatteryPassportCredential</span>
      </div>
      <div className="space-y-2">
        <div>
          <div className="text-slate-400 text-[10.5px] uppercase tracking-wider">issuer</div>
          <div className="text-slate-200 font-semibold truncate">did:key:z6Mk…9fQ2 (Anviora)</div>
        </div>
        <div>
          <div className="text-slate-400 text-[10.5px] uppercase tracking-wider">subject</div>
          <div className="text-slate-200 font-semibold">IN-LFP-2024-B4471</div>
        </div>
        <div className="pt-2 border-t border-slate-800 text-emerald-400 font-bold text-[11.5px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-400" />
          Ed25519 Cryptographic Signature Valid
        </div>
      </div>
    </div>
  );
}

/* 10 — Tally sync */
function TallyVisual() {
  const rows = [
    { doc: "Purchase — Cathode sheets", gst: "GST 29AA…1Z5", amt: "₹4,20,000" },
    { doc: "BoM — LFP-B4471 rev 3", gst: "142 line items", amt: "synced" },
    { doc: "Supplier invoice — #INV-889", gst: "GST 27BB…4H2", amt: "₹1,16,500" },
  ];
  return (
    <Panel tint="amber">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[12px] font-semibold text-crew-ink">Tally Prime → Anviora</span>
          <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full bg-crew-green-soft text-crew-green text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-crew-green animate-pulse" /> Live sync
          </span>
        </div>
        <div className="grid gap-1.5">
          {rows.map((r) => (
            <div key={r.doc} className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-crew-ink truncate">{r.doc}</div>
                <div className="text-[11px] text-crew-muted">{r.gst}</div>
              </div>
              <span className="text-[12px] font-semibold text-crew-ink" style={{ fontFeatureSettings: '"tnum"' }}>
                {r.amt}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </Panel>
  );
}

/* ─── Feature rows ────────────────────────────────────────── */

const features = [
  {
    title: "Upload a PDF. Get 100+ fields.",
    description:
      "Drag and drop your BIS, EPR, UN38.3, IEC 62133 and MSDS certificates. Anviora reads them in seconds — manufacturer details, chemistry, test dates, hazardous substances, all auto-populated. You just review.",
    visual: <ParseVisual />,
  },
  {
    title: "A–G carbon class, calculated.",
    description:
      "Enter your bill of materials. We calculate kg CO₂e per kWh using JRC-aligned methodology and return your performance class — ready for EU Annex II declarations, with third-party verification workflows built in.",
    visual: <CarbonVisual />,
  },
  {
    title: "Never miss a renewal.",
    description:
      "BIS IS 16046, UN38.3, IEC 62133, MSDS — Anviora tracks every expiry on a visual timeline and warns you 30, 7, and 1 days out, by email and in-app.",
    visual: <RenewalVisual />,
  },
  {
    title: "Anchored to Bitcoin. Provable forever.",
    description:
      "Every certificate hash is anchored to the Bitcoin blockchain via OpenTimestamps — a free, open protocol, no wallet or crypto knowledge required. Anyone can independently verify a certificate existed at a given time, permanently, without trusting Anviora's servers.",
    visual: <AnchorVisual />,
  },
  {
    title: "Track every gram of recycled content.",
    description:
      "EU Article 8 requires book-and-claim accounting for recycled cobalt, lithium, nickel and lead. Our mass-balance ledger tracks incoming, allocated and balance amounts — audit-ready, with no negative balances.",
    visual: <MassBalanceVisual />,
  },
  {
    title: "File your DGFT claims automatically.",
    description:
      "Anviora turns the same data into RoDTEP, duty-drawback and interest-equalization claim documents — an export incentive that can reimburse up to 75% of your platform cost.",
    visual: <DgftVisual />,
  },
  {
    title: "Know a battery's health, anywhere in the world.",
    description:
      "Fleet Health and BMS Telemetry monitoring track state-of-health, thermal events, and recall status across every unit you've shipped — so you catch a failing pack before your buyer's warranty claim does.",
    visual: <FleetVisual />,
  },
  {
    title: "Vet your suppliers, not just your own paperwork.",
    description:
      "EU Article 11 due diligence isn't optional past August 2027. Anviora runs OECD-aligned supplier risk scoring and accepts CMRT (Conflict Minerals Reporting Template) uploads directly, so your supply-chain evidence is ready before an auditor asks for it.",
    visual: <SupplierVisual />,
  },
  {
    title: "A signed, portable record of every passport.",
    description:
      "Every battery passport can be issued as a W3C Verifiable Credential — cryptographically signed, machine-verifiable, and yours to hand to any buyer, regulator, or downstream system without re-entering data.",
    visual: <VcVisual />,
  },
  {
    title: "Built for how Indian manufacturers actually run finance.",
    description:
      "A native Tally sync pulls bills of materials, supplier invoices, and GST-linked transactions straight into Anviora — plus API keys and webhooks for teams who want to build their own integrations.",
    visual: <TallyVisual />,
  },
];

export default function BatteryFeatures() {
  return (
    <section className="py-20 lg:py-28 antialiased">
      <div className="max-w-[1232px] mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-[700px] mb-14 text-center mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase rounded-none border border-emerald-500/20 mb-4">
            END-TO-END CAPABILITIES
          </div>
          <h2 className="font-heading text-text text-[clamp(32px,4.5vw,52px)] font-bold tracking-[-0.035em] leading-[1.08] mb-4 text-balance">
            Everything you need for complete compliance.
          </h2>
          <p className="text-[16px] leading-[1.65] text-text-muted text-pretty">
            From automated PDF certificate parsing to Bitcoin blockchain anchoring and native Tally sync — built specifically for battery manufacturers.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Hero Spotlight (Spans 2 columns on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-1 md:col-span-2 rounded-none border border-emerald-700/80 bg-blue p-8 lg:p-10 text-white flex flex-col lg:flex-row gap-8 items-center justify-between shadow-2xl"
          >
            <div className="flex-1 max-w-[540px]">
              <span className="font-mono text-xs font-bold text-emerald-200 bg-white/15 border border-white/20 px-2.5 py-0.5 rounded-none mb-4 inline-block">
                [01] HERO SPOTLIGHT
              </span>
              <h3 className="font-heading text-[clamp(24px,3vw,34px)] font-bold tracking-[-0.03em] leading-tight text-white mb-4">
                {features[0].title}
              </h3>
              <p className="text-[15px] leading-[1.65] text-white/90 text-pretty">
                {features[0].description}
              </p>
            </div>
            <div className="w-full lg:w-[480px] shrink-0">
              {features[0].visual}
            </div>
          </motion.div>

          {/* Cards 2 & 3 */}
          {features.slice(1, 3).map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-none border border-border bg-white p-7 lg:p-8 flex flex-col justify-between transition-all duration-300 hover:border-border-strong shadow-xs"
            >
              <div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-none mb-4 inline-block">
                  [{String(i + 2).padStart(2, "0")}]
                </span>
                <h3 className="font-heading text-[22px] font-bold text-slate-950 tracking-[-0.025em] leading-tight mb-3">
                  {f.title}
                </h3>
                <p className="text-[14.5px] leading-[1.6] text-text-muted text-pretty mb-6">
                  {f.description}
                </p>
              </div>
              <div className="mt-2">{f.visual}</div>
            </motion.div>
          ))}

          {/* Card 4: Full-Width Bitcoin Anchor Banner (Spans 2 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-1 md:col-span-2 rounded-none border border-emerald-700/80 bg-blue p-8 lg:p-10 text-white flex flex-col lg:flex-row gap-8 items-center justify-between shadow-xl"
          >
            <div className="flex-1 max-w-[540px]">
              <span className="font-mono text-xs font-bold text-amber-300 bg-white/15 border border-white/20 px-2.5 py-0.5 rounded-none mb-4 inline-block">
                [04] BLOCKCHAIN ANCHOR
              </span>
              <h3 className="font-heading text-[clamp(24px,3vw,34px)] font-bold tracking-[-0.03em] leading-tight text-white mb-4">
                {features[3].title}
              </h3>
              <p className="text-[15px] leading-[1.65] text-white/90 text-pretty">
                {features[3].description}
              </p>
            </div>
            <div className="w-full lg:w-[480px] shrink-0">
              {features[3].visual}
            </div>
          </motion.div>

          {/* Cards 5 through 10 */}
          {features.slice(4).map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-none border border-border bg-white p-7 lg:p-8 flex flex-col justify-between transition-all duration-300 hover:border-border-strong shadow-xs"
            >
              <div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-none mb-4 inline-block">
                  [{String(i + 5).padStart(2, "0")}]
                </span>
                <h3 className="font-heading text-[22px] font-bold text-slate-950 tracking-[-0.025em] leading-tight mb-3">
                  {f.title}
                </h3>
                <p className="text-[14.5px] leading-[1.6] text-text-muted text-pretty mb-6">
                  {f.description}
                </p>
              </div>
              <div className="mt-2">{f.visual}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
