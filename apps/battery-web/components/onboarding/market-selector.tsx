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
    <div className="grid gap-4">
      {MARKETS.map((market) => (
        <motion.button
          key={market.id}
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(market.id)}
          className={`w-full p-4 rounded-none border text-left transition-all ${
            value === market.id
              ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
              : "border-border bg-transparent hover:bg-accent"
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">{market.icon}</span>
            <div>
              <p className="text-foreground">{market.label}</p>
              <p className="text-sm text-muted-foreground">{market.description}</p>
            </div>
            {value === market.id && (
              <CheckCircle2 className="ml-auto h-6 w-6 text-emerald-500" />
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
