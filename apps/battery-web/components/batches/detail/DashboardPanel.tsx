"use client";

interface DashboardPanelProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  id?: string;
}

export function DashboardPanel({ children, className = "", noPadding, id }: DashboardPanelProps) {
  return (
    <div id={id} className={`bg-background rounded-md relative ${noPadding ? "" : "p-4"} ${className}`}>{children}
    </div>
  );
}
