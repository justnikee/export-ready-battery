"use client";

import { motion } from "framer-motion";
import TextReveal from "@/components/text-reveal";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Before ExportReady, we spent 3 days preparing compliance docs for every EU shipment. Last month we did it in 20 minutes. Our German buyer actually complimented us on how professional our Battery Passports looked.",
    author: "Head of Exports",
    role: "lithium battery manufacturer, Pune",
    stat: "85%",
    statLabel: "faster documentation",
  },
  {
    quote:
      "We used to miss certificate renewals and rush at the last minute. Now we get alerts 30 days out, and the evidence pack is ready before the auditor even asks. It changed how our compliance team works.",
    author: "Compliance Officer",
    role: "textile exporter, Surat",
    stat: "₹20L+",
    statLabel: "consultant cost saved / year",
  },
];

export default function Business() {
  return (
    <section className="py-24 lg:py-32 bg-crew-paper">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[640px] mb-14"
        >
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            Testimonials
          </div>
          <h2 className="text-[clamp(30px,4vw,42px)] font-semibold tracking-[-0.03em] leading-[1.1] text-crew-ink">
            <TextReveal as="span" className="block">
              Our clients love us
            </TextReveal>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative flex flex-col justify-between p-8 rounded-2xl bg-crew-paper-soft border border-crew-border min-h-[360px]"
            >
              <div>
                <Quote size={28} className="text-crew-coral mb-5" />
                <blockquote className="text-[18px] sm:text-[20px] font-medium tracking-[-0.015em] leading-[1.45] text-crew-ink">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>

              <div className="mt-8 flex items-end justify-between gap-6">
                <div>
                  <div className="text-[14px] font-semibold text-crew-ink">{t.author}</div>
                  <div className="text-[13px] text-crew-muted">{t.role}</div>
                </div>
                <div className="text-right">
                  <div
                    className="text-[32px] font-bold tracking-[-0.03em] text-crew-coral leading-none"
                    style={{ fontFeatureSettings: '"tnum"' }}
                  >
                    {t.stat}
                  </div>
                  <div className="text-[12px] text-crew-muted mt-1">{t.statLabel}</div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
