"use client";

interface DashboardPanelProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function DashboardPanel({ children, className = "", noPadding }: DashboardPanelProps) {
  return (
    <div className={`border border-border bg-transparent relative ${noPadding ? "" : "p-4"} ${className}`}>{children}
    </div>
  );
}
