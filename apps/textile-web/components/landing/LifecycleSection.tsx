"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  Factory,
  Package,
  Truck,
  Battery,
  Recycle,
  RotateCcw,
} from "lucide-react";

const mainStates = [
  {
    key: "IN_PRODUCTION",
    label: "IN_PRODUCTION",
    color: "bg-amber-500",
    icon: Factory,
    desc: "Manufacturing",
  },
  {
    key: "MANUFACTURED",
    label: "MANUFACTURED",
    color: "bg-[#0B1F3B]",
    icon: Package,
    desc: "QC Passed",
  },
  {
    key: "IN_STOCK",
    label: "IN_STOCK",
    color: "bg-[#1F7A5F]",
    icon: Package,
    desc: "Warehouse",
  },
  {
    key: "SHIPPED",
    label: "SHIPPED",
    color: "bg-[#1F7A5F]",
    icon: Truck,
    desc: "In Transit",
  },
  {
    key: "IN_USE",
    label: "IN_USE",
    color: "bg-emerald-500",
    icon: Battery,
    desc: "Deployed",
  },
  {
    key: "COLLECTED",
    label: "COLLECTED",
    color: "bg-zinc-400",
    icon: RotateCcw,
    desc: "Returned",
  },
  {
    key: "RECYCLED",
    label: "RECYCLED",
    color: "bg-zinc-600",
    icon: Recycle,
    desc: "Processed",
  },
];

function StateNode({
  state,
  index,
  isLast,
}: {
  state: (typeof mainStates)[0];
  index: number;
  isLast: boolean;
}) {
  const Icon = state.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="group relative flex flex-col items-center"
    >
      {/* Node Card */}
      <div className="bg-white border-2 border-zinc-200 rounded-xl px-4 py-3 shadow-none transition-all duration-300 group-hover:border-[#1F7A5F] group-hover:shadow-none group-hover:-translate-y-1">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-lg ${state.color} flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono text-zinc-700">{state.label}</p>
            <p className="text-[10px] text-zinc-500">{state.desc}</p>
          </div>
        </div>
      </div>

      {/* Step Number */}
      <div className="mt-3 text-xs font-mono text-zinc-400">
        Step {index + 1}
      </div>

      {/* Arrow to next - Desktop */}
      {!isLast && (
        <div className="hidden lg:flex items-center justify-center w-8 mx-2">
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
          >
            <ArrowRight className="h-4 w-4 text-zinc-300" />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export function LifecycleSection() {
  return (
    <section className="py-28 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#1F7A5F]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B1F3B]/5 border border-[#0B1F3B]/10 rounded-full mb-6">
            <span className="text-xs font-medium text-[#0B1F3B]">
              EU Battery Regulation Compliant
            </span>
          </span>
          <h2 className="text-3xl md:text-4xl font-heading text-[#0B1F3B] mb-4">
            One lifecycle. Zero shortcuts.
          </h2>
          <p className="text-base text-zinc-600 max-w-[55ch] mx-auto">
            The 7 lifecycle states required by EU Battery Regulation, enforced
            by AnvayaLabs at the system level.
          </p>
        </motion.div>

        {/* Main Lifecycle Flow */}
        <div className="relative mb-12">
          {/* Desktop: Horizontal Flow */}
          <div className="hidden lg:flex items-center justify-center">
            {mainStates.map((state, index) => (
              <StateNode
                key={state.key}
                state={state}
                index={index}
                isLast={index === mainStates.length - 1}
              />
            ))}
          </div>

          {/* Mobile: Vertical Flow */}
          <div className="lg:hidden flex flex-col items-center gap-4">
            {mainStates.map((state, index) => (
              <div
                key={state.key}
                className="flex items-center gap-4 w-full max-w-sm"
              >
                <StateNode
                  state={state}
                  index={index}
                  isLast={index === mainStates.length - 1}
                />
                {index < mainStates.length - 1 && (
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                    className="ml-4"
                  >
                    <ArrowRight className="h-4 w-4 text-zinc-300 rotate-90" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RECALLED Branch */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-r from-rose-50 to-rose-100/50 border border-rose-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-none hover:shadow-rose-100/50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-none shadow-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-rose-700">
                    RECALLED
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-rose-200 text-rose-700 rounded-full font-medium">
                    Exception State
                  </span>
                </div>
                <p className="text-sm text-zinc-600">
                  Can transition from any active state. Triggers immediate
                  notification workflows and audit logging.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center max-w-[60ch] mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-5 py-3 bg-[#1F7A5F]/10 text-[#1F7A5F] rounded-full text-sm font-medium border border-[#1F7A5F]/20">
            AnvayaLabs enforces this lifecycle at the system level, not through
            guidelines or best practices.
          </span>
        </motion.p>
      </div>
    </section>
  );
}
