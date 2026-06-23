"use client";

import { ReactNode } from "react";

type BannerVariant = "info" | "success" | "warning";

const variantClasses: Record<BannerVariant, string> = {
  info: "bg-blue-500/10 border-blue-500/20",
  success: "bg-emerald-500/10 border-emerald-500/20",
  warning: "bg-amber-500/10 border-amber-500/20",
};

const titleClasses: Record<BannerVariant, string> = {
  info: "text-blue-800",
  success: "text-emerald-700",
  warning: "text-amber-700",
};

const textClasses: Record<BannerVariant, string> = {
  info: "text-blue-600",
  success: "text-emerald-700",
  warning: "text-amber-700",
};

interface InfoBannerProps {
  variant: BannerVariant;
  title?: ReactNode;
  children: ReactNode;
}

export function InfoBanner({ variant, title, children }: InfoBannerProps) {
  return (
    <div className={`rounded-none p-4 border ${variantClasses[variant]}`}>
      {title && <p className={`text-sm font-medium mb-2 ${titleClasses[variant]}`}>{title}</p>}
      <div className={`text-xs space-y-1 ${textClasses[variant]}`}>{children}</div>
    </div>
  );
}
