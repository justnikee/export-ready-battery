"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import { motion } from "framer-motion";

interface PricingCardProps {
  planName: string;
  description: string;
  price: number | string;
  billingPeriod?: "monthly" | "yearly";
  features: { text: string; available?: boolean; highlight?: boolean }[];
  recommended?: boolean;
  ctaText: string;
  ctaLink: string;
  ctaVariant?: "default" | "outline";
  priceSuffix?: string;
}

export function PricingCard({
  planName,
  description,
  price,
  billingPeriod,
  features,
  recommended,
  ctaText,
  ctaLink,
  ctaVariant = "outline",
  priceSuffix,
}: PricingCardProps) {
  const displayPrice =
    billingPeriod === "yearly" && typeof price === "number" && price > 0
      ? Math.floor(price * 0.8)
      : price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="relative group h-full"
    >
      {/* Recommended glow */}
      {recommended && (
        <div className="absolute inset-0 rounded-[28px] bg-linear-to-br from-[#1F7A5F]/12 via-[#3ecf8e]/6 to-transparent blur-xl" />
      )}

      <div
        className={clsx(
          "relative h-full overflow-hidden rounded-[28px] border transition-all duration-300",
          recommended
            ? "border-[#1F7A5F]/30 bg-linear-to-br from-white via-emerald-50/40 to-white shadow-[0_24px_60px_rgba(16,185,129,0.14)]"
            : "border-zinc-200 bg-linear-to-b from-white to-zinc-50/70 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_44px_rgba(15,23,42,0.08)]",
        )}
      >
        <div className="p-8 flex flex-col h-full">
          {/* Plan header */}
          <div className="mb-8">
            <div className="mb-4 flex min-h-8 items-start justify-between gap-3">
              <span
                className={clsx(
                  "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
                  recommended
                    ? "bg-[#1F7A5F]/12 text-[#1F7A5F]"
                    : "bg-zinc-100 text-zinc-700",
                )}
              >
                {planName}
              </span>
              {recommended && (
                <span className="inline-flex items-center rounded-full bg-[#0B1F3B] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  Most Popular
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-zinc-600">
              {description}
            </p>
          </div>

          {/* Price */}
          <div className="mb-8">
            <div className="flex flex-wrap items-end gap-2">
              <span className="text-4xl md:text-5xl tracking-tight text-[#0B1F3B]">
                {typeof displayPrice === "number"
                  ? displayPrice === 0
                    ? "Free"
                    : `₹${displayPrice.toLocaleString("en-IN")}`
                  : displayPrice}
              </span>
              {priceSuffix && (
                <span className="pb-1 text-sm font-medium text-zinc-500">
                  {priceSuffix}
                </span>
              )}
            </div>
            {billingPeriod === "yearly" &&
              typeof price === "number" &&
              typeof displayPrice === "number" &&
              price > 0 && (
                <p className="text-xs text-[#1F7A5F] font-medium mt-2">
                  Save 20% with yearly billing
                </p>
              )}
          </div>

          {/* CTA Button */}
          <Link
            href={ctaLink}
            className={clsx(
              "mb-8 flex items-center justify-center rounded-full px-4 py-3 text-sm font-medium transition-all duration-200",
              recommended
                ? "bg-[#0B1F3B] text-white hover:bg-[#1F7A5F]"
                : ctaVariant === "default"
                  ? "bg-[#0B1F3B] text-white hover:bg-[#1F7A5F]"
                  : "border border-zinc-300 bg-white text-[#0B1F3B] hover:border-[#0B1F3B] hover:bg-[#0B1F3B] hover:text-white",
            )}
          >
            {ctaText}
          </Link>

          {/* Divider */}
          <div className="mb-8 h-px bg-linear-to-r from-transparent via-zinc-200 to-transparent" />

          {/* Features */}
          <div className="space-y-4 grow">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
              What&apos;s included
            </p>
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div
                  className={clsx(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    feature.highlight
                      ? "bg-[#1F7A5F]/20 text-[#1F7A5F]"
                      : "bg-zinc-100 text-zinc-500",
                  )}
                >
                  <Check className="h-3 w-3" />
                </div>
                <span
                  className={clsx(
                    "text-sm leading-relaxed text-zinc-700",
                    feature.highlight && "text-[#0B1F3B] font-medium",
                  )}
                >
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
