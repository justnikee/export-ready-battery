import { CreditCard } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function BillingPage() {
  const { user } = useAuth();
  const quotaUsed = (user as unknown as { quota_used?: number })?.quota_used || 0;
  const quotaLimit = (user as unknown as { quota_limit?: number })?.quota_limit || 5000;
  const pct = Math.round((quotaUsed / quotaLimit) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight">Billing & License</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription and passport quota</p>
      </div>

      <div className="relative bg-transparent border border-border rounded-none p-6"><div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-medium text-foreground">Passport Quota</h3>
          </div>
          <span className="text-sm text-muted-foreground">{pct}% used</span>
        </div>
        <div className="w-full bg-muted h-2">
          <div className={`h-2 ${pct >= 100 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <p className="text-sm text-muted-foreground mt-2">{quotaUsed.toLocaleString()} / {quotaLimit.toLocaleString()} passports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["Starter", "Professional", "Enterprise"].map((plan, i) => (
          <div key={plan} className={`relative bg-transparent border border-border rounded-none p-5 ${i === 1 ? "border-emerald-500/30" : ""}`}><h3 className="text-base font-medium text-foreground">{plan}</h3>
            <p className="text-xs text-muted-foreground mt-1">{["India-only, 5K passes", "India + EU, 50K passes", "Unlimited, multi-market"][i]}</p>
            {i === 1 && <span className="inline-block mt-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Current</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
