"use client";

import { motion } from "framer-motion";

const logos = [
  { name: "Nordvolt", country: "DE" },
  { name: "Eurocell", country: "NL" },
  { name: "GreenCell", country: "FR" },
  { name: "BharatCells", country: "IN" },
  { name: "MeghnaPolymers", country: "IN" },
  { name: "TraceFabrics", country: "ES" },
  { name: "RenewPower", country: "IN" },
  { name: "ECOBattery", country: "IT" },
];

function LogoPill({ name, country }: { name: string; country: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-crew-paper-soft border border-crew-border">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-crew-navy text-white text-[9px] font-bold">
        {name.slice(0, 1)}
      </span>
      <span className="text-[13px] font-medium text-crew-ink whitespace-nowrap">{name}</span>
      <span className="text-[10px] text-crew-muted">{country}</span>
    </div>
  );
}

export default function LogoStrip() {
  return (
    <section className="py-10 bg-crew-paper border-b border-crew-border">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-[13px] text-crew-muted mb-6"
        >
          Trusted by Indian exporters shipping to Europe every day
        </motion.p>

        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-crew-paper to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-crew-paper to-transparent z-10" />

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex gap-4 animate-marquee-slow w-max"
          >
            {[...logos, ...logos, ...logos, ...logos].map((logo, i) => (
              <LogoPill key={`${logo.name}-${i}`} name={logo.name} country={logo.country} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
