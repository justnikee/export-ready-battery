"use client";

import { motion } from "framer-motion";
import { Sparkles, Anchor, BadgeCheck, QrCode } from "lucide-react";
import TextReveal from "@/components/text-reveal";

const features = [
  {
    icon: <Sparkles size={20} />,
    title: "AI reads your certificates for you",
    body: "Drop in a BIS, EPR, UN38.3 or IEC 62133 PDF and Anviora extracts 100+ fields in seconds. You just review.",
  },
  {
    icon: <Anchor size={20} />,
    title: "Anchored to Bitcoin, provable forever",
    body: "Every certificate hash is timestamped on the Bitcoin blockchain via OpenTimestamps — free, independent, permanent proof, no wallet required.",
  },
  {
    icon: <BadgeCheck size={20} />,
    title: "Signed, portable Verifiable Credentials",
    body: "Every passport can be issued as a W3C Verifiable Credential — cryptographically signed and yours to share with any buyer or system.",
  },
  {
    icon: <QrCode size={20} />,
    title: "One serial, one QR code, one source of truth",
    body: "Every battery gets a unique BPAN V2 serial and QR code linking to a live, tiered-access passport page.",
  },
];

export default function FeatureGrid() {
  return (
    <section className="py-20 lg:py-24 bg-crew-paper-soft">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[640px] mb-14"
        >
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            Built different
          </div>
          <h2 className="font-serif text-[clamp(30px,4.4vw,48px)] font-normal tracking-[-0.01em] leading-[1.08] text-crew-ink">
            <TextReveal as="span" className="block">
              Not just a passport generator.
            </TextReveal>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="p-6 rounded-2xl bg-crew-paper border border-crew-border"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-crew-coral-soft text-crew-coral mb-5">
                {f.icon}
              </div>
              <h3 className="font-serif text-[22px] font-normal tracking-[-0.01em] text-crew-ink mb-2">
                {f.title}
              </h3>
              <p className="text-[16px] leading-[1.6] text-[#131313]">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
