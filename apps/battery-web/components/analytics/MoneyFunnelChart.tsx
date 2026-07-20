"use client";

import { DGFTValueSummary } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MoneyFunnelChartProps {
  data: DGFTValueSummary;
}

export function MoneyFunnelChart({ data }: MoneyFunnelChartProps) {
  const chartData = data.scheme_breakdown.map((s) => ({
    name: s.scheme,
    Claimed: s.claimed_value,
    Eligible: s.eligible_value,
  }));

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No scheme data available
      </div>
    );
  }

  // Format currency in Indian Rupees
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} />
          <XAxis 
            dataKey="name" 
            stroke="var(--muted-foreground)" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="var(--muted-foreground)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} // Format in Lakhs
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.1 }}
            contentStyle={{
              backgroundColor: "var(--popover)",
              borderColor: "var(--border)",
              borderRadius: "8px",
              boxShadow: "none",
              color: "var(--popover-foreground)",
            }}
            formatter={(value: any) => [formatCurrency(Number(value || 0)), ""]}
          />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }}
          />
          <Bar 
            dataKey="Eligible" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]} 
            name="Eligible Incentives (₹)"
          />
          <Bar 
            dataKey="Claimed" 
            fill="#059669" 
            radius={[4, 4, 0, 0]} 
            name="Claimed Incentives (₹)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
