"use client";

import { Activity, CheckCircle, AlertTriangle, Server, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@anvaya/ui/card";

const services = [
  { name: "Platform Core API", status: "healthy", uptime: "99.98%", latency: "45ms" },
  { name: "Battery API", status: "healthy", uptime: "99.95%", latency: "62ms" },
  { name: "Textile API", status: "healthy", uptime: "99.97%", latency: "58ms" },
  { name: "Database (Platform)", status: "healthy", uptime: "100%", latency: "12ms" },
  { name: "Database (Battery)", status: "healthy", uptime: "100%", latency: "14ms" },
  { name: "Database (Textile)", status: "degraded", uptime: "99.2%", latency: "180ms" },
];

export default function HealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground mt-1">Monitor all services and databases.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">5/6</p>
                <p className="text-sm text-muted-foreground">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Degraded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">99.85%</p>
                <p className="text-sm text-muted-foreground">Avg Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {s.name.includes("Database") ? <Database className="w-4 h-4 text-muted-foreground" /> : <Server className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-muted-foreground">{s.uptime} uptime</span>
                  <span className="text-muted-foreground">{s.latency}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                    s.status === "healthy" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
