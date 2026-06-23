"use client";

import { motion } from "framer-motion";

export function RegulationsIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="docGrad1" x1="0" y1="0" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEE2E2" />
          <stop offset="100%" stopColor="#FECACA" />
        </linearGradient>
      </defs>
      {/* Stack of documents */}
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity }}>
        <rect x="25" y="55" width="70" height="50" rx="6" fill="url(#docGrad1)" opacity="0.4" />
        <rect x="30" y="50" width="70" height="50" rx="6" fill="url(#docGrad1)" opacity="0.6" />
        <rect x="35" y="45" width="70" height="50" rx="6" fill="url(#docGrad1)" opacity="0.8" />
        <rect x="40" y="40" width="70" height="50" rx="6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.3" />
        {/* Lines on top doc */}
        <rect x="50" y="52" width="50" height="4" rx="2" fill="#EF4444" opacity="0.2" />
        <rect x="50" y="62" width="40" height="4" rx="2" fill="#EF4444" opacity="0.15" />
        <rect x="50" y="72" width="45" height="4" rx="2" fill="#EF4444" opacity="0.15" />
        {/* Warning icon */}
        <circle cx="55" cy="28" r="14" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
        <path d="M55 22v7M55 32.5v1.5" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

export function PortDelayIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="shipGrad" x1="0" y1="0" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="100%" stopColor="#BFDBFE" />
        </linearGradient>
      </defs>
      {/* Ship container */}
      <motion.g animate={{ x: [0, 2, 0] }} transition={{ duration: 5, repeat: Infinity }}>
        <rect x="20" y="50" width="80" height="45" rx="8" fill="url(#shipGrad)" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.3" />
        {/* Container stripes */}
        <rect x="28" y="58" width="12" height="30" rx="2" fill="#3B82F6" opacity="0.2" />
        <rect x="46" y="58" width="12" height="30" rx="2" fill="#3B82F6" opacity="0.15" />
        <rect x="64" y="58" width="12" height="30" rx="2" fill="#3B82F6" opacity="0.2" />
        <rect x="82" y="58" width="12" height="30" rx="2" fill="#3B82F6" opacity="0.15" />
        {/* Ship base */}
        <path d="M15 95 L25 75 L95 75 L105 95 Z" fill="#1E3A5F" opacity="0.15" />
      </motion.g>
      {/* Water waves */}
      <motion.path
        d="M10 100 Q30 95 50 100 Q70 105 90 100 Q110 95 115 100"
        stroke="#3B82F6"
        strokeWidth="2"
        fill="none"
        strokeOpacity="0.3"
        animate={{ d: ["M10 100 Q30 95 50 100 Q70 105 90 100 Q110 95 115 100", "M10 100 Q30 105 50 100 Q70 95 90 100 Q110 105 115 100", "M10 100 Q30 95 50 100 Q70 105 90 100 Q110 95 115 100"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Stop sign */}
      <motion.g
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <circle cx="90" cy="30" r="16" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
        <rect x="84" y="24" width="12" height="4" rx="1" fill="#EF4444" />
      </motion.g>
      {/* Clock */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "35px 35px" }}
      >
        <circle cx="35" cy="35" r="12" stroke="#F59E0B" strokeWidth="2" fill="none" opacity="0.5" />
        <line x1="35" y1="35" x2="35" y2="27" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="35" y1="35" x2="40" y2="35" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

export function CostIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
      {/* Coins / Money stack */}
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 5, repeat: Infinity }}>
        {/* Bottom coins */}
        <ellipse cx="40" cy="85" rx="16" ry="6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
        <ellipse cx="70" cy="85" rx="16" ry="6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
        <ellipse cx="55" cy="80" rx="16" ry="6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
        {/* Middle coins */}
        <ellipse cx="45" cy="72" rx="14" ry="5" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
        <ellipse cx="65" cy="72" rx="14" ry="5" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
        {/* Top coin */}
        <ellipse cx="55" cy="65" rx="14" ry="5" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" />
        <text x="55" y="68" textAnchor="middle" fontSize="8" fill="#92400E" fontWeight="bold" fontFamily="sans-serif">₹</text>
      </motion.g>
      {/* Down arrow */}
      <motion.g
        animate={{ y: [0, 5, 0], opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <path d="M85 30 L85 55 M75 45 L85 55 L95 45" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
      {/* Wallet / hand */}
      <motion.path
        d="M85 70 C75 70 70 75 70 82 C70 89 75 94 85 94 C95 94 100 89 100 82 C100 75 95 70 85 70Z"
        fill="#FEE2E2"
        stroke="#EF4444"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        animate={{ x: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </svg>
  );
}
