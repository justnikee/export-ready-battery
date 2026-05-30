"use client";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}

export function StatCard({ label, value, icon, iconColor, iconBg }: StatCardProps) {
  return (
    <div className="border border-border bg-transparent p-4 relative">
      <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} flex items-center justify-center shrink-0`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="font-mono text-2xl text-foreground tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
