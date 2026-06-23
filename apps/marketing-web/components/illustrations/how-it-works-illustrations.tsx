"use client";

import { motion } from "framer-motion";

export function UploadIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      {/* Cloud */}
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <path
          d="M60 100 C40 100 30 85 35 70 C30 55 45 45 55 50 C60 35 80 30 95 40 C105 30 125 35 130 50 C145 45 155 60 150 75 C155 90 140 100 130 100Z"
          fill="#DBEAFE"
          stroke="#3B82F6"
          strokeWidth="1.5"
          strokeOpacity="0.3"
        />
        {/* Upload arrow */}
        <motion.path
          d="M100 85 L100 60 M90 70 L100 60 L110 70"
          stroke="#3B82F6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.g>
      {/* Document below */}
      <motion.g
        animate={{ y: [0, 3, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      >
        <rect x="70" y="110" width="60" height="40" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="78" y="118" width="44" height="4" rx="2" fill="#CBD5E1" />
        <rect x="78" y="126" width="34" height="4" rx="2" fill="#E2E8F0" />
        <rect x="78" y="134" width="40" height="4" rx="2" fill="#E2E8F0" />
        <rect x="108" y="134" width="14" height="8" rx="2" fill="#10B981" opacity="0.2" />
      </motion.g>
      {/* Small doc floating */}
      <motion.g
        animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      >
        <rect x="140" y="70" width="35" height="45" rx="5" fill="white" stroke="#E2E8F0" strokeWidth="1" />
        <rect x="146" y="78" width="23" height="3" rx="1.5" fill="#CBD5E1" />
        <rect x="146" y="86" width="18" height="3" rx="1.5" fill="#E2E8F0" />
      </motion.g>
    </svg>
  );
}

export function AIIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      {/* Brain / circuit shape */}
      <motion.g animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="100" cy="80" rx="50" ry="40" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.3" />
        {/* Circuit lines */}
        <path d="M70 80 H90 M110 80 H130 M100 60 V70 M100 90 V100" stroke="#10B981" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <circle cx="70" cy="80" r="4" fill="#10B981" opacity="0.5" />
        <circle cx="130" cy="80" r="4" fill="#10B981" opacity="0.5" />
        <circle cx="100" cy="60" r="4" fill="#10B981" opacity="0.5" />
        <circle cx="100" cy="100" r="4" fill="#10B981" opacity="0.5" />
        {/* Center node */}
        <circle cx="100" cy="80" r="10" fill="#10B981" opacity="0.2" />
        <circle cx="100" cy="80" r="6" fill="#10B981" opacity="0.4" />
      </motion.g>
      {/* Sparkles */}
      <motion.g
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
      >
        <path d="M55 45 L58 52 L65 55 L58 58 L55 65 L52 58 L45 55 L52 52Z" fill="#F59E0B" opacity="0.6" />
      </motion.g>
      <motion.g
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
      >
        <path d="M145 50 L147 55 L152 57 L147 59 L145 64 L143 59 L138 57 L143 55Z" fill="#F59E0B" opacity="0.5" />
      </motion.g>
      <motion.g
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}
      >
        <path d="M150 95 L152 100 L157 102 L152 104 L150 109 L148 104 L143 102 L148 100Z" fill="#10B981" opacity="0.5" />
      </motion.g>
      {/* Input → Output arrows */}
      <motion.path
        d="M30 80 H50 M150 80 H170"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeDasharray="4 2"
        animate={{ strokeDashoffset: [0, -12] }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}

export function PassportIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      {/* Passport document */}
      <motion.g
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="50" y="30" width="100" height="100" rx="10" fill="white" stroke="#E2E8F0" strokeWidth="2" filter="url(#shadow)" />
        <rect x="50" y="30" width="100" height="30" rx="10" fill="#0F172A" />
        <rect x="50" y="48" width="100" height="12" fill="#0F172A" />
        <text x="100" y="50" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold" fontFamily="sans-serif">BATTERY PASSPORT</text>
        {/* QR Code */}
        <rect x="65" y="72" width="28" height="28" rx="4" fill="#0F172A" />
        <rect x="69" y="76" width="20" height="20" rx="2" fill="white" />
        <rect x="73" y="80" width="12" height="12" rx="1" fill="#0F172A" />
        <rect x="107" y="72" width="28" height="28" rx="4" fill="#0F172A" />
        <rect x="111" y="76" width="20" height="20" rx="2" fill="white" />
        <rect x="115" y="80" width="12" height="12" rx="1" fill="#0F172A" />
        <rect x="65" y="104" width="28" height="14" rx="3" fill="#10B981" opacity="0.15" />
        <text x="79" y="114" textAnchor="middle" fontSize="7" fill="#10B981" fontWeight="600" fontFamily="sans-serif">EU</text>
        <rect x="107" y="104" width="28" height="14" rx="3" fill="#10B981" opacity="0.15" />
        <text x="121" y="114" textAnchor="middle" fontSize="7" fill="#10B981" fontWeight="600" fontFamily="sans-serif">✓</text>
      </motion.g>
      {/* Phone scanning */}
      <motion.g
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <rect x="135" y="85" width="45" height="70" rx="8" fill="#1E293B" stroke="#334155" strokeWidth="2" />
        <rect x="140" y="92" width="35" height="50" rx="4" fill="#0F172A" />
        {/* Scan line */}
        <motion.rect
          x="142" y="95" width="31" height="2" rx="1" fill="#10B981"
          animate={{ y: [0, 44, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx="157" cy="148" r="3" fill="#334155" />
      </motion.g>
    </svg>
  );
}

export function ShipIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      {/* Globe line */}
      <motion.path
        d="M30 130 Q60 100 100 100 Q140 100 170 130"
        stroke="#10B981"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
        animate={{ strokeDashoffset: [0, -40] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      {/* Origin - India */}
      <motion.g animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>
        <circle cx="30" cy="130" r="12" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
        <text x="30" y="134" textAnchor="middle" fontSize="10" fill="#92400E" fontWeight="bold" fontFamily="sans-serif">IN</text>
      </motion.g>
      {/* Destination - EU */}
      <motion.g animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}>
        <circle cx="170" cy="130" r="12" fill="#D1FAE5" stroke="#10B981" strokeWidth="2" />
        <text x="170" y="134" textAnchor="middle" fontSize="10" fill="#065F46" fontWeight="bold" fontFamily="sans-serif">EU</text>
      </motion.g>
      {/* Flying package */}
      <motion.g
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ offsetPath: "path('M30 130 Q60 100 100 100 Q140 100 170 130')" }}
      >
        <rect x="-12" y="-10" width="24" height="20" rx="4" fill="white" stroke="#10B981" strokeWidth="1.5" />
        <path d="M-12 -10 L0 0 L12 -10" stroke="#10B981" strokeWidth="1" fill="none" opacity="0.3" />
        <motion.path
          d="M-4 0 L0 -4 L4 0"
          stroke="#10B981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </motion.g>
      {/* Checkmark at destination */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
      >
        <circle cx="170" cy="85" r="14" fill="#10B981" opacity="0.15" />
        <circle cx="170" cy="85" r="10" fill="#10B981" opacity="0.2" />
        <path d="M165 85 L168 88 L175 81" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </motion.g>
    </svg>
  );
}
