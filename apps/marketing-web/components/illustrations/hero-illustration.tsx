"use client";

import { motion } from "framer-motion";

export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 600 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#0F172A" floodOpacity="0.08" />
        </filter>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="20" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background glow orbs */}
      <motion.circle
        cx="450" cy="150" r="120"
        fill="url(#emeraldGrad)" opacity="0.08"
        animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.12, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="150" cy="350" r="100"
        fill="url(#amberGrad)" opacity="0.06"
        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Main globe */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <circle cx="300" cy="250" r="140" fill="url(#globeGrad)" filter="url(#shadow)" />
        {/* Globe grid lines */}
        <ellipse cx="300" cy="250" rx="140" ry="50" stroke="#334155" strokeWidth="1" fill="none" opacity="0.4" />
        <ellipse cx="300" cy="250" rx="140" ry="90" stroke="#334155" strokeWidth="1" fill="none" opacity="0.3" />
        <line x1="300" y1="110" x2="300" y2="390" stroke="#334155" strokeWidth="1" opacity="0.3" />
        <line x1="160" y1="250" x2="440" y2="250" stroke="#334155" strokeWidth="1" opacity="0.3" />
        
        {/* India dot */}
        <circle cx="360" cy="220" r="6" fill="#F59E0B" />
        <circle cx="360" cy="220" r="10" fill="#F59E0B" opacity="0.3" />
        
        {/* EU dot */}
        <circle cx="260" cy="180" r="6" fill="#10B981" />
        <circle cx="260" cy="180" r="10" fill="#10B981" opacity="0.3" />
        
        {/* Connection line India → EU */}
        <motion.path
          d="M 360 220 Q 310 180 260 180"
          stroke="#10B981"
          strokeWidth="2"
          strokeDasharray="6 4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        
        {/* Animated dot traveling the line */}
        <motion.circle
          r="4"
          fill="#10B981"
          animate={{
            cx: [360, 310, 260],
            cy: [220, 180, 180],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.g>

      {/* Floating document cards */}
      <motion.g
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{ filter: "url(#shadow)" }}
      >
        {/* Card 1 - Certificate */}
        <motion.g
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="420" y="120" width="110" height="140" rx="12" fill="url(#cardGrad)" stroke="#E2E8F0" strokeWidth="1" />
          <rect x="435" y="140" width="80" height="8" rx="4" fill="#CBD5E1" />
          <rect x="435" y="156" width="60" height="6" rx="3" fill="#E2E8F0" />
          <rect x="435" y="170" width="70" height="6" rx="3" fill="#E2E8F0" />
          <rect x="435" y="184" width="50" height="6" rx="3" fill="#E2E8F0" />
          <circle cx="475" cy="225" r="16" fill="#10B981" opacity="0.1" />
          <path d="M468 225l5 5 10-10" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>
      </motion.g>

      {/* Card 2 - QR Code */}
      <motion.g
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        style={{ filter: "url(#shadow)" }}
      >
        <motion.g
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <rect x="80" y="160" width="100" height="120" rx="12" fill="url(#cardGrad)" stroke="#E2E8F0" strokeWidth="1" />
          {/* QR code pattern */}
          <rect x="95" y="175" width="28" height="28" rx="4" fill="#0F172A" />
          <rect x="99" y="179" width="20" height="20" rx="2" fill="white" />
          <rect x="103" y="183" width="12" height="12" rx="1" fill="#0F172A" />
          
          <rect x="137" y="175" width="28" height="28" rx="4" fill="#0F172A" />
          <rect x="141" y="179" width="20" height="20" rx="2" fill="white" />
          <rect x="145" y="183" width="12" height="12" rx="1" fill="#0F172A" />
          
          <rect x="95" y="217" width="28" height="28" rx="4" fill="#0F172A" />
          <rect x="99" y="221" width="20" height="20" rx="2" fill="white" />
          <rect x="103" y="225" width="12" height="12" rx="1" fill="#0F172A" />
          
          <rect x="137" y="217" width="12" height="12" rx="2" fill="#0F172A" />
          <rect x="153" y="217" width="12" height="12" rx="2" fill="#0F172A" />
          <rect x="137" y="233" width="12" height="12" rx="2" fill="#0F172A" />
          <rect x="153" y="233" width="12" height="12" rx="2" fill="#0F172A" />
          
          <rect x="95" y="255" width="70" height="12" rx="4" fill="#10B981" opacity="0.1" />
          <text x="130" y="264" textAnchor="middle" fontSize="7" fill="#10B981" fontWeight="600" fontFamily="sans-serif">SCAN TO VERIFY</text>
        </motion.g>
      </motion.g>

      {/* Shield badge */}
      <motion.g
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <motion.g
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <circle cx="480" cy="320" r="40" fill="url(#shieldGrad)" stroke="#10B981" strokeWidth="1.5" opacity="0.3" />
          <path
            d="M480 295 L505 305 V325 C505 342 480 355 480 355 C480 355 455 342 455 325 V305 Z"
            fill="#10B981"
            opacity="0.15"
          />
          <path
            d="M480 300 L500 308 V325 C500 338 480 348 480 348 C480 348 460 338 460 325 V308 Z"
            stroke="#10B981"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.path
            d="M470 322 L477 329 L490 316"
            stroke="#10B981"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
          />
        </motion.g>
      </motion.g>

      {/* Small decorative shapes */}
      <motion.circle
        cx="130" cy="130" r="8" fill="#10B981" opacity="0.2"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.circle
        cx="520" cy="200" r="6" fill="#F59E0B" opacity="0.25"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
      />
      <motion.circle
        cx="110" cy="380" r="10" fill="#10B981" opacity="0.1"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 7, repeat: Infinity, delay: 1 }}
      />

      {/* Grid pattern overlay */}
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5" opacity="0.3" />
      </pattern>
      <rect width="600" height="500" fill="url(#grid)" opacity="0.5" />
    </svg>
  );
}
