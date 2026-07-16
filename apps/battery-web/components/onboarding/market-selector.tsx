"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface MarketOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

const MARKETS: MarketOption[] = [
  {
    id: "eu",
    label: "European Union",
    description: "EU Battery Regulation compliant passports",
    icon: "🇪🇺",
  },
  {
    id: "india",
    label: "India",
    description: "BWM Rules 2022 & BIS compliant",
    icon: "🇮🇳",
  },
  {
    id: "both",
    label: "Both Markets",
    description: "Full compliance for global export",
    icon: "🌍",
  },
];

interface MarketSelectorProps {
  value: string;
  onChange: (marketId: string) => void;
}

export function MarketSelector({ value, onChange }: MarketSelectorProps) {
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {MARKETS.map((market) => {
        const selected = value === market.id;
        return (
          <motion.button
            key={market.id}
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onChange(market.id)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              textAlign: "left",
              background: selected ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
              border: selected
                ? "1px solid rgba(16,185,129,0.4)"
                : "1px solid rgba(255,255,255,0.08)",
              boxShadow: selected ? "0 0 0 2px rgba(16,185,129,0.15)" : "none",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "28px", lineHeight: 1 }}>{market.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: 500, color: selected ? "#e2e8f0" : "#94a3b8", marginBottom: "2px" }}>
                  {market.label}
                </p>
                <p style={{ fontSize: "12px", color: "#475569" }}>{market.description}</p>
              </div>
              {selected && (
                <CheckCircle2 style={{ width: "20px", height: "20px", color: "#10b981", flexShrink: 0 }} />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
