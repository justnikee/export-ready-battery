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
    <div className="bg-background rounded-md p-4 relative"><div className="flex items-center gap-3">
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
