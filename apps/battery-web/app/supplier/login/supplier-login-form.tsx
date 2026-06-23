"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { Upload } from "lucide-react";

export default function SupplierLoginForm() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant_id") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !tenantId) {
      toast.error("Email, password, and tenant ID are required");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/supplier/login", {
        email,
        password,
        tenant_id: tenantId,
      });
      localStorage.setItem("supplier_token", res.data.token);
      localStorage.setItem("supplier_id", res.data.supplier_id);
      localStorage.setItem("tenant_id", res.data.tenant_id);
      toast.success("Logged in successfully");
      window.location.href = "/supplier/dashboard";
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F5F3] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Upload className="w-10 h-10 text-[#37322F]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#37322F]">Supplier Portal</h1>
          <p className="text-sm text-muted-foreground">
            Upload certificates and provenance data for your buyer
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
