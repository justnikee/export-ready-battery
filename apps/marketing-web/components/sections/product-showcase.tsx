"use client";

import { motion } from "framer-motion";

const screenshots = [
  {
    title: "Your command center",
    desc: "Every batch, every passport, every alert — in one view.",
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-[#F8FAFC] p-4">
            <p className="text-2xl font-bold text-[#0F172A]">24</p>
            <p className="text-xs text-[#64748B]">Active Batches</p>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] p-4">
            <p className="text-2xl font-bold text-[#0F172A]">156</p>
            <p className="text-xs text-[#64748B]">Passports</p>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] p-4">
            <p className="text-2xl font-bold text-[#10B981]">94%</p>
            <p className="text-xs text-[#64748B]">Compliance</p>
          </div>
        </div>
        <div className="rounded-lg bg-[#F8FAFC] p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <div className="h-2 w-24 rounded-full bg-[#0F172A]/10" />
            <div className="ml-auto h-2 w-12 rounded-full bg-[#10B981]/20" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <div className="h-2 w-32 rounded-full bg-[#0F172A]/10" />
            <div className="ml-auto h-2 w-12 rounded-full bg-[#F59E0B]/20" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <div className="h-2 w-20 rounded-full bg-[#0F172A]/10" />
            <div className="ml-auto h-2 w-12 rounded-full bg-[#10B981]/20" />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "One screen. Every detail.",
    desc: "From chemistry to compliance — all in one place.",
    content: (
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[#F8FAFC] p-4">
          <p className="text-xs text-[#64748B] mb-1">Battery Chemistry</p>
          <p className="text-sm font-medium text-[#0F172A]">LiFePO4</p>
        </div>
        <div className="rounded-lg bg-[#F8FAFC] p-4">
          <p className="text-xs text-[#64748B] mb-1">Capacity</p>
          <p className="text-sm font-medium text-[#0F172A]">48V / 20Ah</p>
        </div>
        <div className="rounded-lg bg-[#F8FAFC] p-4">
          <p className="text-xs text-[#64748B] mb-1">BIS Number</p>
          <p className="text-sm font-medium text-[#0F172A] font-mono">R-12345678</p>
        </div>
        <div className="rounded-lg bg-[#F8FAFC] p-4">
          <p className="text-xs text-[#64748B] mb-1">Carbon Class</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] text-xs font-bold">B</span>
          </div>
        </div>
        <div className="col-span-2 rounded-lg bg-[#F8FAFC] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#64748B]">Compliance Score</p>
            <p className="text-sm font-bold text-[#10B981]">94%</p>
          </div>
          <div className="h-2 rounded-full bg-[#E2E8F0]">
            <div className="h-full w-[94%] rounded-full bg-[#10B981]" />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Your buyer scans. They see trust.",
    desc: "Not a PDF attachment. A living digital passport.",
    content: (
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-xl bg-white border-2 border-[#E2E8F0] flex items-center justify-center">
          <div className="grid grid-cols-5 gap-[3px] w-14 h-14">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className={`rounded-[1px] ${i % 3 === 0 || i % 7 === 0 ? "bg-[#0F172A]" : "bg-transparent"}`} />
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-sm text-[#0F172A] font-medium">Verified on Blockchain</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#F8FAFC]" />
          <div className="h-2 w-3/4 rounded-full bg-[#F8FAFC]" />
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-[10px] font-medium">EU Ready</span>
            <span className="px-2 py-1 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] text-[10px] font-medium">BIS Valid</span>
          </div>
        </div>
      </div>
    ),
  },
];

export default function ProductShowcase() {
  return (
    <section className="relative bg-white py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#4F46E5] mb-4"
          >
            See the Platform
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-[-0.02em] mb-4"
          >
            This Is What Compliance Looks Like When It&apos;s Done Right.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#64748B]"
          >
            No tabs. No carousels. Just the product.
          </motion.p>
        </div>

        <div className="space-y-12">
          {screenshots.map((shot, i) => (
            <motion.div
              key={shot.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm hover:shadow-lg hover:shadow-[#4F46E5]/5 transition-shadow duration-300"
            >
              <div className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                  <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                  <div className="ml-auto h-2 w-32 rounded-full bg-[#F1F5F9]" />
                </div>
                {shot.content}
              </div>
              <div className="px-6 lg:px-8 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                <p className="text-sm font-medium text-[#0F172A]">{shot.title}</p>
                <p className="text-xs text-[#64748B]">{shot.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
