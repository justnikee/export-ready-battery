"use client";

import { motion } from "framer-motion";
import { CreditCard, TrendingUp, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@anvaya/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const mrrStats = [
  { label: "Total MRR", value: "₹23.4L", change: "+15.2%", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "ARPU", value: "₹8,420", change: "+3.1%", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Trial → Paid", value: "34%", change: "+5%", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Churn Rate", value: "2.1%", change: "-0.4%", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
];

const mrrData = [
  { month: "Jan", mrr: 180000, new: 25000, churned: 5000 },
  { month: "Feb", mrr: 210000, new: 35000, churned: 5000 },
  { month: "Mar", mrr: 195000, new: 20000, churned: 35000 },
  { month: "Apr", mrr: 240000, new: 45000, churned: 0 },
  { month: "May", mrr: 280000, new: 40000, churned: 0 },
  { month: "Jun", mrr: 310000, new: 35000, churned: 5000 },
];

const planDistribution = [
  { name: "Enterprise", value: 28, color: "#10b981" },
  { name: "Professional", value: 52, color: "#3b82f6" },
  { name: "Starter", value: 76, color: "#f59e0b" },
];

const recentInvoices = [
  { id: "INV-001", tenant: "Tata AutoComp Systems", amount: 45000, status: "paid", date: "Jun 15, 2026" },
  { id: "INV-002", tenant: "Arvind Limited", amount: 15000, status: "paid", date: "Jun 14, 2026" },
  { id: "INV-003", tenant: "Exide Industries", amount: 15000, status: "pending", date: "Jun 12, 2026" },
  { id: "INV-004", tenant: "Trident Group", amount: 45000, status: "paid", date: "Jun 10, 2026" },
  { id: "INV-005", tenant: "Amara Raja Batteries", amount: 45000, status: "overdue", date: "May 31, 2026" },
];

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing Overview</h1>
        <p className="text-muted-foreground mt-1">
          Subscription revenue, plan distribution, and recent invoices.
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mrrStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <span className="text-sm font-medium text-emerald-600">{stat.change}</span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">MRR Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={mrrData}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${v / 1000}K`} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, ""]} />
                <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} fill="url(#mrrGrad)" name="MRR" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-2">
              {planDistribution.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    {p.name}
                  </div>
                  <span className="font-medium">{p.value} tenants</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left font-medium pb-3 pr-4">Invoice</th>
                  <th className="text-left font-medium pb-3 pr-4">Tenant</th>
                  <th className="text-left font-medium pb-3 pr-4">Amount</th>
                  <th className="text-left font-medium pb-3 pr-4">Status</th>
                  <th className="text-left font-medium pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs">{inv.id}</td>
                    <td className="py-3 pr-4 font-medium">{inv.tenant}</td>
                    <td className="py-3 pr-4 font-medium">₹{inv.amount.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                        inv.status === "paid" ? "bg-emerald-500/10 text-emerald-600" :
                        inv.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                        "bg-red-500/10 text-red-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          inv.status === "paid" ? "bg-emerald-500" :
                          inv.status === "pending" ? "bg-amber-500" :
                          "bg-red-500"
                        }`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{inv.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
