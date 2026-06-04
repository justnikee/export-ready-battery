"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Workflows() {
  return (
    <section className="bg-[#FAF9F6] py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#111111] leading-[1.1] tracking-[-0.02em] mb-6">
              Turn compliance into{" "}
              <span className="gradient-text">competitive advantage</span>
            </h2>
            <p className="text-[#666666] text-lg mb-8 leading-relaxed">
              Getting the right data is only half the battle; the real value comes from putting it into action. Connect your data to any tool in your tech stack to launch any compliance use case. Iterate and improve quickly.
            </p>

            <a
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#111111] text-white text-sm font-medium hover:bg-[#333333] transition-colors"
            >
              Start building for free
              <ArrowRight size={16} />
            </a>
          </motion.div>

          {/* Illustration - 3D shapes */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[300px] lg:h-[400px]"
          >
            <div className="absolute top-[20%] left-[10%] w-20 h-20 rounded-[30%] bg-gradient-to-br from-[#FF6B9D] to-[#C44569] shadow-xl float-slow" style={{ transform: "rotateX(15deg) rotateY(-15deg)" }} />
            <div className="absolute top-[50%] left-[30%] w-16 h-16 rounded-[30%] bg-gradient-to-br from-[#F8B500] to-[#F7971E] shadow-xl float-medium" style={{ transform: "rotateX(10deg) rotateY(10deg)", animationDelay: "1s" }} />
            <div className="absolute top-[30%] right-[20%] w-24 h-24 rounded-[30%] bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] shadow-xl float-fast" style={{ transform: "rotateX(-10deg) rotateY(15deg)", animationDelay: "0.5s" }} />
            <div className="absolute bottom-[20%] left-[50%] w-14 h-14 rounded-[30%] bg-gradient-to-br from-[#11998E] to-[#38EF7D] shadow-xl float-slow" style={{ transform: "rotateX(20deg) rotateY(-10deg)", animationDelay: "1.5s" }} />
            <div className="absolute top-[10%] right-[10%] w-12 h-12 rounded-[30%] bg-gradient-to-br from-[#667EEA] to-[#764BA2] shadow-xl float-medium" style={{ transform: "rotateX(-15deg) rotateY(20deg)", animationDelay: "2s" }} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
