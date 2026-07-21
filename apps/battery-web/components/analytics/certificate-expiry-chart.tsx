"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { AlertCircle } from "lucide-react";

interface CertExpiryItem {
  cert_type: string;
  expiring_30d: number;
  expiring_7d: number;
  expired: number;
}

interface CertificateExpiryChartProps {
  data: CertExpiryItem[];
}

function CustomCertTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/90 backdrop-blur-md border border-border/80 p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[150px]">
        <p className="font-semibold text-foreground border-b border-border/50 pb-1">
          {label} Certificates
        </p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function CertificateExpiryChart({ data }: CertificateExpiryChartProps) {
  if (
    data.length === 0 ||
    data.every((d) => d.expiring_30d + d.expiring_7d + d.expired === 0)
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground space-y-2">
        <AlertCircle className="h-8 w-8 text-amber-500/50" />
        <span>No certificate expiry risk detected.</span>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.3}
            vertical={false}
          />

          <XAxis
            dataKey="cert_type"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={5}
          />

          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />

          <Tooltip
            content={<CustomCertTooltip />}
            cursor={{ fill: "rgba(255, 255, 255, 0.04)", radius: 4 }}
          />

          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
            iconType="circle"
          />

          <Bar
            dataKey="expiring_30d"
            name="Expiring ≤30d"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="expiring_7d"
            name="Expiring ≤7d"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="expired"
            name="Expired"
            fill="#b91c1c"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
