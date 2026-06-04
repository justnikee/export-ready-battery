"use client";

import { motion } from "framer-motion";

export default function PromoBand() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative min-h-[170px] p-7 rounded-xl text-white overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, rgba(7,20,47,.88), rgba(7,20,47,.1)), linear-gradient(135deg, #07142f 0%, #533afd 36%, #f96bee 72%, #ff8b2f 100%)",
          }}
        >
          {/* Glow orb */}
          <div
            className="absolute right-6 -bottom-[42px] w-[300px] h-[180px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,.32), transparent 68%)",
            }}
          />
          <div className="relative z-[1]">
            <h2 className="max-w-[420px] text-[24px] sm:text-[30px] font-light leading-[1.1] mb-4">
              Building the compliance infrastructure for Indian exports
            </h2>
            <a
              href="#"
              className="inline-flex items-center justify-center h-[34px] px-4 rounded-full text-sm font-medium"
              style={{ background: "#fff", color: "#533afd" }}
            >
              Watch overview
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
