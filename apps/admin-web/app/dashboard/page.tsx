"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Battery,
  Shirt,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@anvaya/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const stats = [
  {
    label: "Total Tenants",
    value: "156",
    change: "+12",
    trend: "up",
    icon: Building2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Active Users",
    value: "2,847",
    change: "+8.3%",
    trend: "up",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    label: "MRR",
    value: "₹23.4L",
    change: "+15.2%",
    trend: "up",
    icon: CreditCard,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    label: "Passports Generated",
    value: "48,291",
    change: "+1,204",
    trend: "up",
    icon: TrendingUp,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

const revenueData = [
  { month: "Jan", revenue: 180000, target: 200000 },
  { month: "Feb", revenue: 210000, target: 220000 },
  { month: "Mar", revenue: 195000, target: 230000 },
  { month: "Apr", revenue: 240000, target: 240000 },
  { month: "May", revenue: 280000, target: 250000 },
  { month: "Jun", revenue: 310000, target: 260000 },
];

const productSplit = [
  { name: "Battery", count: 32100, fill: "#10b981" },
  { name: "Textile", count: 16191, fill: "#3b82f6" },
];

const recentTenants = [
  { name: "Tata AutoComp Systems", product: "Battery", plan: "Enterprise", users: 24, joined: "2 days ago" },
  { name: "Arvind Limited", product: "Textile", plan: "Professional", users: 12, joined: "3 days ago" },
  { name: "Exide Industries", product: "Battery", plan: "Professional", users: 18, joined: "5 days ago" },
  { name: "Raymond UCO", product: "Textile", plan: "Starter", users: 5, joined: "1 week ago" },
  { name: "Amara Raja Batteries", product: "Battery", plan: "Enterprise", users: 31, joined: "1 week ago" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">
          Real-time stats across all tenants and products.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                    {stat.change}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
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
            <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${v / 1000}K`} />
                <Tooltip
                  formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Passports by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productSplit} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={60} />
                <Tooltip formatter={(v) => [Number(v).toLocaleString(), "Passports"]} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {productSplit.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill }} />
                    {p.name}
                  </div>
                  <span className="font-medium">{p.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left font-medium pb-3 pr-4">Tenant</th>
                  <th className="text-left font-medium pb-3 pr-4">Product</th>
                  <th className="text-left font-medium pb-3 pr-4">Plan</th>
                  <th className="text-left font-medium pb-3 pr-4">Users</th>
                  <th className="text-left font-medium pb-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentTenants.map((t) => (
                  <tr key={t.name} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4 font-medium">{t.name}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                        t.product === "Battery" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                      }`}>
                        {t.product === "Battery" ? <Battery className="w-3 h-3" /> : <Shirt className="w-3 h-3" />}
                        {t.product}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        t.plan === "Enterprise" ? "bg-purple-500/10 text-purple-600" :
                        t.plan === "Professional" ? "bg-amber-500/10 text-amber-600" :
                        "bg-gray-500/10 text-gray-600"
                      }`}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{t.users}</td>
                    <td className="py-3 text-muted-foreground">{t.joined}</td>
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
