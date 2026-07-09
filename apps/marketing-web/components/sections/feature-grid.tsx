"use client";

import { motion } from "framer-motion";
import { Sparkles, Anchor, BadgeCheck, QrCode } from "lucide-react";
import TextReveal from "@/components/text-reveal";

/* Decorative mini QR (not scannable) for the BPAN cell */
function MiniQR({ size = 96 }: { size?: number }) {
  const s = size / 9;
  const cells = [
    [0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2],
    [0, 6], [0, 7], [0, 8], [1, 6], [1, 8], [2, 6], [2, 7], [2, 8],
    [6, 0], [6, 1], [6, 2], [7, 0], [7, 2], [8, 0], [8, 1], [8, 2],
    [3, 4], [4, 1], [4, 3], [4, 5], [4, 7], [5, 2], [5, 4], [5, 6],
    [6, 4], [6, 6], [7, 5], [7, 7], [8, 4], [8, 6], [8, 8],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {cells.map(([r, c], i) => (
        <rect
          key={i}
          x={c * s}
          y={r * s}
          width={s - 1.5}
          height={s - 1.5}
          rx={1.5}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

const cellReveal = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function FeatureGrid() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div {...cellReveal(0)} className="max-w-[640px] mb-12">
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            Built different
          </div>
          <h2 className="font-serif text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.02em] leading-[1.08] text-crew-ink text-balance">
            <TextReveal as="span" className="block">
              Not just a passport generator.
            </TextReveal>
          </h2>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Cell 1 — AI parsing (large, green tint) */}
          <motion.div
            {...cellReveal(0.05)}
            className="lg:col-span-7 rounded-[28px] bg-crew-coral-soft p-8 lg:p-10 flex flex-col"
          >
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white text-crew-coral mb-6">
              <Sparkles size={20} />
            </div>
            <h3 className="text-[22px] font-semibold tracking-[-0.01em] text-crew-ink mb-2 text-balance">
              AI reads your certificates for you
            </h3>
            <p className="text-[15.5px] leading-[1.6] text-crew-ink/70 max-w-[440px] mb-8 text-pretty">
              Drop in a BIS, EPR, UN38.3 or IEC 62133 PDF and Anviora extracts
              100+ fields in seconds. You just review.
            </p>
            <div className="mt-auto flex flex-wrap gap-2">
              {[
                "Chemistry · LFP",
                "UN38.3 · Pass",
                "Capacity · 280 Ah",
                "BIS · Valid 2027",
                "Cycle life · 6,000",
                "+95 more",
              ].map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center h-8 px-3.5 rounded-full bg-white text-[12.5px] font-semibold text-crew-ink"
                >
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Cell 2 — Bitcoin anchoring (dark panel) */}
          <motion.div
            {...cellReveal(0.1)}
            className="lg:col-span-5 rounded-[28px] bg-[#122019] p-8 lg:p-10 flex flex-col"
          >
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 text-crew-amber mb-6">
              <Anchor size={20} />
            </div>
            <h3 className="text-[22px] font-semibold tracking-[-0.01em] text-white mb-2 text-balance">
              Anchored to Bitcoin, provable forever
            </h3>
            <p className="text-[15.5px] leading-[1.6] text-white/65 mb-8 text-pretty">
              Every certificate hash is timestamped via OpenTimestamps — free,
              independent, permanent proof. No wallet required.
            </p>
            <div className="mt-auto rounded-2xl bg-white/7 px-4 py-3.5 font-mono text-[12px] leading-relaxed">
              <div className="text-white/50">sha256 · a91f…c4e2</div>
              <div className="text-crew-amber">✓ anchored — block 842,190</div>
            </div>
          </motion.div>

          {/* Cell 3 — W3C VC (blue tint) */}
          <motion.div
            {...cellReveal(0.15)}
            className="lg:col-span-5 rounded-[28px] bg-[#eef3fd] p-8 lg:p-10 flex flex-col"
          >
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white text-[#1d4ed8] mb-6">
              <BadgeCheck size={20} />
            </div>
            <h3 className="text-[22px] font-semibold tracking-[-0.01em] text-crew-ink mb-2 text-balance">
              Signed, portable Verifiable Credentials
            </h3>
            <p className="text-[15.5px] leading-[1.6] text-crew-ink/70 mb-8 text-pretty">
              Every passport can be issued as a W3C Verifiable Credential —
              cryptographically signed and yours to share with any buyer or system.
            </p>
            <div className="mt-auto rounded-2xl bg-white px-4 py-3.5 font-mono text-[12px] leading-relaxed">
              <div className="text-crew-muted">did:key:z6Mk…9fQ2</div>
              <div className="text-[#1d4ed8] font-semibold">✓ Ed25519 signature valid</div>
            </div>
          </motion.div>

          {/* Cell 4 — BPAN + QR (white, QR visual) */}
          <motion.div
            {...cellReveal(0.2)}
            className="lg:col-span-7 rounded-[28px] bg-white shadow-[0_2px_16px_rgba(26,32,26,0.05)] p-8 lg:p-10 flex flex-col sm:flex-row sm:items-center gap-8"
          >
            <div className="flex-1">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-crew-coral-soft text-crew-coral mb-6">
                <QrCode size={20} />
              </div>
              <h3 className="text-[22px] font-semibold tracking-[-0.01em] text-crew-ink mb-2 text-balance">
                One serial, one QR code, one source of truth
              </h3>
              <p className="text-[15.5px] leading-[1.6] text-crew-ink/70 text-pretty">
                Every battery gets a unique BPAN V2 serial and QR code linking
                to a live, tiered-access passport page.
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-3 rounded-3xl bg-paper px-8 py-7">
              <span className="text-crew-ink">
                <MiniQR size={96} />
              </span>
              <span className="font-mono text-[12px] font-semibold text-crew-ink">
                IN-LFP-2024-B4471
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
