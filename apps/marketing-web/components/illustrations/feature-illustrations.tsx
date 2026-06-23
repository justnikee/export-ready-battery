"use client";

import { motion } from "framer-motion";

export function BatchManagementIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
      <motion.rect x="15" y="45" width="50" height="28" rx="6" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.4"
        animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.rect x="20" y="35" width="40" height="22" rx="5" fill="#BFDBFE" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.4"
        animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.3 }}
      />
      <motion.rect x="25" y="25" width="30" height="18" rx="4" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.4"
        animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.6 }}
      />
      <motion.circle cx="40" cy="18" r="8" fill="#10B981" opacity="0.2"
        animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.path d="M36 18 L39 21 L44 15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }}
      />
    </svg>
  );
}

export function AIParsingIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
      <motion.rect x="20" y="20" width="40" height="50" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="1.5"
        animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity }}
      />
      <rect x="28" y="30" width="24" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="28" y="38" width="18" height="3" rx="1.5" fill="#E2E8F0" />
      <rect x="28" y="46" width="22" height="3" rx="1.5" fill="#E2E8F0" />
      <motion.circle cx="55" cy="28" r="14" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4"
        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}
      />
      <text x="55" y="32" textAnchor="middle" fontSize="14" fill="#10B981" fontWeight="bold" fontFamily="sans-serif">AI</text>
      <motion.path d="M50 48 L55 43 L60 48" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
        animate={{ y: [0, 2, 0] }} transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  );
}

export function BlockchainIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
      {/* Chain links */}
      <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity }}>
        <rect x="20" y="30" width="18" height="18" rx="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.4" transform="rotate(15 29 39)" />
      </motion.g>
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}>
        <rect x="35" y="28" width="18" height="18" rx="4" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" transform="rotate(-10 44 37)" />
      </motion.g>
      <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}>
        <rect x="48" y="34" width="18" height="18" rx="4" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.4" transform="rotate(20 57 43)" />
      </motion.g>
      {/* Connection lines */}
      <motion.line x1="32" y1="38" x2="38" y2="36" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 2"
        animate={{ strokeDashoffset: [0, -10] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.line x1="46" y1="36" x2="52" y2="40" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 2"
        animate={{ strokeDashoffset: [0, -10] }} transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: 0.5 }}
      />
      {/* Lock */}
      <motion.g animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>
        <rect x="34" y="52" width="12" height="10" rx="2" fill="#10B981" opacity="0.2" />
        <path d="M37 52 V49 A3 3 0 0 1 43 49 V52" stroke="#10B981" strokeWidth="1.5" fill="none" />
      </motion.g>
    </svg>
  );
}

export function AlertIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
      <motion.path
        d="M40 15 L65 60 H15 Z"
        fill="#FEF3C7"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.line x1="40" y1="32" x2="40" y2="44" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle cx="40" cy="52" r="2.5" fill="#F59E0B"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Ring animation */}
      <motion.circle cx="40" cy="42" r="28" stroke="#F59E0B" strokeWidth="1" fill="none" opacity="0.2"
        animate={{ r: [28, 35, 28], opacity: [0.2, 0, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </svg>
  );
}

export function TeamIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
      <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity }}>
        <circle cx="28" cy="32" r="10" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="28" cy="28" r="4" fill="#3B82F6" opacity="0.3" />
        <path d="M20 42 Q28 36 36 42" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.3" fill="none" />
      </motion.g>
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.3 }}>
        <circle cx="52" cy="32" r="10" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="52" cy="28" r="4" fill="#10B981" opacity="0.3" />
        <path d="M44 42 Q52 36 60 42" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.3" fill="none" />
      </motion.g>
      <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.6 }}>
        <circle cx="40" cy="52" r="10" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="40" cy="48" r="4" fill="#F59E0B" opacity="0.3" />
        <path d="M32 62 Q40 56 48 62" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.3" fill="none" />
      </motion.g>
      {/* Connection lines */}
      <motion.line x1="36" y1="38" x2="44" y2="38" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2"
        animate={{ strokeDashoffset: [0, -8] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      <motion.line x1="32" y1="46" x2="36" y2="50" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2"
        animate={{ strokeDashoffset: [0, -8] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
      />
      <motion.line x1="48" y1="46" x2="44" y2="50" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2"
        animate={{ strokeDashoffset: [0, -8] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 1 }}
      />
    </svg>
  );
}

export function AuditIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
      <motion.rect x="20" y="18" width="40" height="50" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="1.5"
        animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity }}
      />
      <rect x="26" y="26" width="20" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="26" y="34" width="28" height="3" rx="1.5" fill="#E2E8F0" />
      <rect x="26" y="42" width="24" height="3" rx="1.5" fill="#E2E8F0" />
      <rect x="26" y="50" width="18" height="3" rx="1.5" fill="#E2E8F0" />
      {/* Checkmarks */}
      <motion.g initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <path d="M52 28 L54 30 L58 26" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </motion.g>
      <motion.g initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.6 }}>
        <path d="M52 36 L54 38 L58 34" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </motion.g>
      <motion.g initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.9 }}>
        <path d="M52 44 L54 46 L58 42" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </motion.g>
      {/* Stamp */}
      <motion.g
        animate={{ rotate: [0, -5, 0], y: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      >
        <circle cx="55" cy="58" r="12" fill="#10B981" opacity="0.1" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.3" />
        <text x="55" y="62" textAnchor="middle" fontSize="8" fill="#10B981" fontWeight="bold" fontFamily="sans-serif">PASS</text>
      </motion.g>
    </svg>
  );
}

export function QRIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
      <motion.rect x="18" y="18" width="44" height="44" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1.5"
        animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity }}
      />
      {/* QR pattern */}
      <rect x="24" y="24" width="14" height="14" rx="3" fill="#0F172A" />
      <rect x="27" y="27" width="8" height="8" rx="2" fill="white" />
      <rect x="29" y="29" width="4" height="4" rx="1" fill="#0F172A" />
      
      <rect x="42" y="24" width="14" height="14" rx="3" fill="#0F172A" />
      <rect x="45" y="27" width="8" height="8" rx="2" fill="white" />
      <rect x="47" y="29" width="4" height="4" rx="1" fill="#0F172A" />
      
      <rect x="24" y="42" width="14" height="14" rx="3" fill="#0F172A" />
      <rect x="27" y="45" width="8" height="8" rx="2" fill="white" />
      <rect x="29" y="47" width="4" height="4" rx="1" fill="#0F172A" />
      
      <rect x="42" y="42" width="6" height="6" rx="2" fill="#0F172A" />
      <rect x="50" y="42" width="6" height="6" rx="2" fill="#0F172A" />
      <rect x="42" y="50" width="6" height="6" rx="2" fill="#0F172A" />
      <rect x="50" y="50" width="6" height="6" rx="2" fill="#0F172A" />
      {/* Scan frame */}
      <motion.rect x="16" y="16" width="48" height="48" rx="10" stroke="#10B981" strokeWidth="2" fill="none" strokeDasharray="8 4"
        animate={{ strokeDashoffset: [0, -24] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}
