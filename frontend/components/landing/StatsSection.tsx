"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Battery, Globe, Shield, Zap, TrendingUp } from "lucide-react";

interface StatItemProps {
  icon: React.ElementType;
  value: string;
  label: string;
  suffix?: string;
  delay: number;
  verified?: boolean;
}

function AnimatedNumber({
  value,
  suffix = "",
}: {
  value: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const numericValue = parseInt(value.replace(/[^0-9]/g, "")) || 0;

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setDisplayValue(numericValue);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, numericValue]);

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {value.includes("+")
        ? displayValue.toLocaleString() + "+"
        : displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

function StatItem({
  icon: Icon,
  value,
  label,
  suffix,
  delay,
  verified,
}: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center text-center group"
    >
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-[#1F7A5F]/10 to-[#1F7A5F]/5 border border-[#1F7A5F]/20 text-[#1F7A5F] mb-4 transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-[#0B1F3B] mb-2 flex items-center gap-2">
        <AnimatedNumber value={value} suffix={suffix} />
        {verified && (
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: delay + 0.3 }}
            className="h-5 w-5 rounded-full bg-[#1F7A5F] flex items-center justify-center"
            title="Verified"
          >
            <svg
              className="h-3 w-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        )}
      </div>
      <p className="text-sm text-slate-600">{label}</p>
    </motion.div>
  );
}

const stats = [
  {
    icon: Battery,
    value: "10847",
    label: "Battery Passports Generated",
    suffix: "",
    verified: true,
  },
  {
    icon: TrendingUp,
    value: "2400",
    label: "Cr+ Exports Enabled (₹)",
    suffix: "Cr+",
    verified: false,
  },
  {
    icon: Globe,
    value: "52",
    label: "Countries Supported",
    suffix: "+",
    verified: false,
  },
  {
    icon: Shield,
    value: "0",
    label: "Compliance Failures",
    suffix: "",
    verified: true,
  },
];

export function StatsSection() {
  return (
    <section className="py-20 bg-slate-50 border-y border-slate-200 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#1F7A5F]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#0B1F3B]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">
            Trusted by battery manufacturers worldwide
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <StatItem
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              delay={i * 0.1}
              verified={stat.verified}
            />
          ))}
        </div>

        {/* Trust note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-xs text-slate-500">
            All statistics verified as of{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
