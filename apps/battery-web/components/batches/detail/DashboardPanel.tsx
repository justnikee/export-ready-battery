"use client";

interface DashboardPanelProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function DashboardPanel({ children, className = "", noPadding }: DashboardPanelProps) {
  return (
    <div className={`border border-border bg-transparent relative ${noPadding ? "" : "p-4"} ${className}`}>
      <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
      {children}
    </div>
  );
}
