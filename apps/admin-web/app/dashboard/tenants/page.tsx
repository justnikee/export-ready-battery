"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Search, Filter, MoreHorizontal, Battery, Shirt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@anvaya/ui/card";
import { Input } from "@anvaya/ui/input";
import { Badge } from "@anvaya/ui/badge";

const tenants = [
  { id: 1, name: "Tata AutoComp Systems", product: "Battery", plan: "Enterprise", users: 24, passports: 12400, status: "active", mrr: 45000 },
  { id: 2, name: "Arvind Limited", product: "Textile", plan: "Professional", users: 12, passports: 5800, status: "active", mrr: 15000 },
  { id: 3, name: "Exide Industries", product: "Battery", plan: "Professional", users: 18, passports: 9200, status: "active", mrr: 15000 },
  { id: 4, name: "Raymond UCO", product: "Textile", plan: "Starter", users: 5, passports: 1200, status: "active", mrr: 5000 },
  { id: 5, name: "Amara Raja Batteries", product: "Battery", plan: "Enterprise", users: 31, passports: 18500, status: "active", mrr: 45000 },
  { id: 6, name: "Vardhman Textiles", product: "Textile", plan: "Professional", users: 14, passports: 4100, status: "trial", mrr: 0 },
  { id: 7, name: "Luminous Power", product: "Battery", plan: "Starter", users: 3, passports: 800, status: "trial", mrr: 0 },
  { id: 8, name: "Trident Group", product: "Textile", plan: "Enterprise", users: 22, passports: 7800, status: "active", mrr: 45000 },
];

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tenant Management</h1>
        <p className="text-muted-foreground mt-1">
          View, manage, and monitor all platform tenants.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="cursor-pointer">All ({tenants.length})</Badge>
              <Badge variant="outline" className="cursor-pointer">Active ({tenants.filter(t => t.status === "active").length})</Badge>
              <Badge variant="outline" className="cursor-pointer">Trial ({tenants.filter(t => t.status === "trial").length})</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">All Tenants</CardTitle>
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
                  <th className="text-left font-medium pb-3 pr-4">Passports</th>
                  <th className="text-left font-medium pb-3 pr-4">MRR</th>
                  <th className="text-left font-medium pb-3 pr-4">Status</th>
                  <th className="text-left font-medium pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        t.product === "Battery" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                      }`}>
                        {t.product === "Battery" ? <Battery className="w-3 h-3" /> : <Shirt className="w-3 h-3" />}
                        {t.product}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={t.plan === "Enterprise" ? "default" : t.plan === "Professional" ? "secondary" : "outline"}>
                        {t.plan}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">{t.users}</td>
                    <td className="py-3 pr-4">{t.passports.toLocaleString()}</td>
                    <td className="py-3 pr-4 font-medium">
                      {t.mrr > 0 ? `₹${(t.mrr / 1000).toFixed(0)}K` : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                        t.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
