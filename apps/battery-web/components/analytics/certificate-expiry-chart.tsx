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

interface CertExpiryItem {
  cert_type: string;
  expiring_30d: number;
  expiring_7d: number;
  expired: number;
}

interface CertificateExpiryChartProps {
  data: CertExpiryItem[];
}

export function CertificateExpiryChart({ data }: CertificateExpiryChartProps) {
  if (data.length === 0 || data.every((d) => d.expiring_30d + d.expiring_7d + d.expired === 0)) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No certificate expiry data. Add certificate dates to batch specs.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="cert_type"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              borderColor: "var(--border)",
              borderRadius: "6px",
              boxShadow: "none",
              color: "var(--popover-foreground)",
            }}
            itemStyle={{ color: "var(--foreground)" }}
            labelStyle={{ color: "var(--muted-foreground)", fontWeight: 500 }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "var(--muted-foreground)" }}
          />
          <Bar
            dataKey="expiring_30d"
            name="Expiring ≤30d"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expiring_7d"
            name="Expiring ≤7d"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expired"
            name="Expired"
            fill="#7f1d1d"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
