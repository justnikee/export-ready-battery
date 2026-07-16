"use client";

import { ReactNode } from "react";

type BannerVariant = "info" | "success" | "warning";

const variantStyles: Record<BannerVariant, { wrap: React.CSSProperties; title: React.CSSProperties; text: React.CSSProperties }> = {
  info: {
    wrap: { background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" },
    title: { color: "#60a5fa" },
    text: { color: "#93c5fd" },
  },
  success: {
    wrap: { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" },
    title: { color: "#34d399" },
    text: { color: "#6ee7b7" },
  },
  warning: {
    wrap: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" },
    title: { color: "#fbbf24" },
    text: { color: "#fcd34d" },
  },
};

interface InfoBannerProps {
  variant: BannerVariant;
  title?: ReactNode;
  children: ReactNode;
}

export function InfoBanner({ variant, title, children }: InfoBannerProps) {
  const styles = variantStyles[variant];
  return (
    <div style={{ ...styles.wrap, borderRadius: "10px", padding: "8px 12px" }}>
      {title && (
        <p style={{ ...styles.title, fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>
          {title}
        </p>
      )}
      <div style={{ ...styles.text, fontSize: "11px", lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}
