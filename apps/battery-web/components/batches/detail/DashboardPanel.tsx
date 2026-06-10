"use client";

interface DashboardPanelProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  id?: string;
}

export function DashboardPanel({ children, className = "", noPadding, id }: DashboardPanelProps) {
  return (
    <div id={id} className={`border border-border bg-transparent relative ${noPadding ? "" : "p-4"} ${className}`}>{children}
    </div>
  );
}
