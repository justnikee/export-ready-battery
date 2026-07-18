"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Globe,
  Shield,
  CheckCircle2,
  Zap,
  Lock,
  FileCheck,
  Rocket,
  Star,
  BarChart3,
} from "lucide-react";

interface LeftPanelProps {
  currentStep: number;
}

// ── Per-step content ──────────────────────────────────────────────────
const STEP_CONTENT = [
  // Step 1 – Company Profile
  {
    badge: "Welcome to Anviora",
    headline: "Your battery\ncompliance journey\nstarts here.",
    sub: "Set up your workspace in under 2 minutes and get your first battery passport ready.",
    visual: <Step1Visual />,
    stats: [
      { value: "2 min", label: "Setup time" },
      { value: "100%", label: "EU compliant" },
      { value: "∞", label: "Batch scale" },
    ],
  },
  // Step 2 – Target Markets
  {
    badge: "Global Reach",
    headline: "Reach global\nbattery markets\nwith confidence.",
    sub: "Whether you're targeting India's EPR framework or Europe's Battery Regulation — we've got you covered.",
    visual: <Step2Visual />,
    stats: [
      { value: "2027", label: "EU deadline" },
      { value: "BWM", label: "India rules" },
      { value: "1 click", label: "Market switch" },
    ],
  },
  // Step 3 – Compliance Setup
  {
    badge: "Compliance Engine",
    headline: "Unlock full\nactivation with\nyour credentials.",
    sub: "Each credential you add unlocks more capabilities — from batch publishing to QR label generation.",
    visual: <Step3Visual />,
    stats: [
      { value: "EPR", label: "Batch publish" },
      { value: "BIS", label: "QR labels" },
      { value: "IEC", label: "Import track" },
    ],
  },
  // Step 4 – Review
  {
    badge: "Almost There",
    headline: "You're ready\nto launch your\ndashboard.",
    sub: "Your workspace is configured. Review your details and go live — you can always update settings later.",
    visual: <Step4Visual />,
    stats: [
      { value: "DPP", label: "Digital passport" },
      { value: "Live", label: "Status tracking" },
      { value: "API", label: "Integration ready" },
    ],
  },
];

// ── Step Visuals ──────────────────────────────────────────────────────
function Step1Visual() {
  return (
    <div className="relative w-full flex items-center justify-center h-52">
      {/* Outer glow rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-44 h-44 rounded-full border border-emerald-500/10 animate-pulse" />
        <div className="absolute w-32 h-32 rounded-full border border-emerald-500/20 animate-pulse" style={{ animationDelay: "0.3s" }} />
      </div>
      {/* Center card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10"
      >
        <Building2 className="w-10 h-10 text-emerald-400" />
      </motion.div>
      {/* Floating feature pills */}
      {[
        { label: "EPR Ready", icon: FileCheck, x: -90, y: -50, delay: 0.4 },
        { label: "EU Reg", icon: Globe, x: 80, y: -40, delay: 0.5 },
        { label: "BIS Certified", icon: Shield, x: -80, y: 55, delay: 0.6 },
        { label: "Secure", icon: Lock, x: 75, y: 50, delay: 0.7 },
      ].map(({ label, icon: Icon, x, y, delay }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay, type: "spring" }}
          style={{ position: "absolute", left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161616] border border-white/10 backdrop-blur-sm"
        >
          <Icon className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-slate-300 whitespace-nowrap">{label}</span>
        </motion.div>
      ))}
    </div>
  );
}

function Step2Visual() {
  return (
    <div className="relative w-full flex items-center justify-center h-52 gap-6">
      {/* India card */}
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#161616] border border-white/10 w-28"
      >
        <span className="text-3xl">🇮🇳</span>
        <span className="text-xs font-medium text-slate-200">India</span>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-emerald-400">BWM Rules</span>
        </div>
      </motion.div>

      {/* Connecting animation */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-1"
      >
        <div className="flex items-center gap-1">
          <div className="w-8 h-px bg-gradient-to-r from-emerald-500/50 to-blue-500/50" />
          <Zap className="w-4 h-4 text-emerald-400" />
          <div className="w-8 h-px bg-gradient-to-r from-blue-500/50 to-emerald-500/50" />
        </div>
        <span className="text-[9px] text-slate-500 whitespace-nowrap">Full coverage</span>
      </motion.div>

      {/* EU card */}
      <motion.div
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#161616] border border-white/10 w-28"
      >
        <span className="text-3xl">🇪🇺</span>
        <span className="text-xs font-medium text-slate-200">EU</span>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-[9px] text-blue-400">EU Reg 2027</span>
        </div>
      </motion.div>
    </div>
  );
}

function Step3Visual() {
  const creds = [
    { label: "EPR Registration", unlocks: "Batch publishing", color: "emerald", delay: 0.2 },
    { label: "BIS R-Number", unlocks: "QR label generation", color: "blue", delay: 0.35 },
    { label: "IEC Code", unlocks: "Import tracking", color: "violet", delay: 0.5 },
    { label: "MoRTH Code", unlocks: "BPAN serial numbers", color: "amber", delay: 0.65 },
  ];

  const colorMap: Record<string, string> = {
    emerald: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    blue: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    violet: "border-violet-500/30 text-violet-400 bg-violet-500/10",
    amber: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  };

  return (
    <div className="w-full h-52 flex flex-col justify-center gap-2">
      {creds.map(({ label, unlocks, color, delay }) => (
        <motion.div
          key={label}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay, type: "spring" }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#161616] border border-white/8"
        >
          <div className={`w-1.5 h-6 rounded-full ${colorMap[color].split(" ")[2]}`} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-300 font-medium truncate">{label}</p>
            <p className="text-[10px] text-slate-500 truncate">→ {unlocks}</p>
          </div>
          <div className={`px-1.5 py-0.5 rounded border text-[9px] ${colorMap[color]}`}>
            UNLOCK
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Step4Visual() {
  return (
    <div className="relative w-full flex flex-col items-center justify-center h-52 gap-4">
      {/* Big success checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
      >
        <CheckCircle2 className="w-10 h-10 text-white" />
      </motion.div>
      {/* Floating items */}
      <div className="flex items-center gap-3">
        {[
          { icon: Rocket, label: "Dashboard", delay: 0.5 },
          { icon: BarChart3, label: "Analytics", delay: 0.6 },
          { icon: Star, label: "Full Access", delay: 0.7 },
        ].map(({ icon: Icon, label, delay }) => (
          <motion.div
            key={label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, type: "spring" }}
            className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#161616] border border-white/10"
          >
            <Icon className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-slate-400">{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export function OnboardingLeftPanel({ currentStep }: LeftPanelProps) {
  const idx = Math.min(Math.max(currentStep - 1, 0), STEP_CONTENT.length - 1);
  const content = STEP_CONTENT[idx];

  return (
    <div className="relative flex flex-col justify-between h-full w-full p-8 lg:p-10 overflow-hidden select-none">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#080808] to-[#111111]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.07)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.06)_0%,_transparent_60%)]" />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Brand logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">Anviora</span>
        </div>
      </div>

      {/* Main content — animates per step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`panel-${currentStep}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative z-10 flex flex-col gap-8"
        >
          {/* Badge */}
          <div className="inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">{content.badge}</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-semibold text-white leading-tight whitespace-pre-line">
              {content.headline}
            </h2>
            <p className="text-base text-slate-400 leading-relaxed max-w-sm">{content.sub}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Stats row */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`stats-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="grid grid-cols-3 gap-3 pt-4 border-t border-white/8"
          >
            {content.stats.map(({ value, label }) => (
              <div key={label} className="space-y-0.5">
                <p className="text-base font-semibold text-white">{value}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
