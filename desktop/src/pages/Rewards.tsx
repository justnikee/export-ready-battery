import { Award, Gift, Star } from "lucide-react";

export default function RewardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight">Rewards</h1>
        <p className="text-sm text-muted-foreground mt-1">PLI incentives, compliance badges, and partner benefits</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "PLI Credits", desc: "₹0 earned this quarter", icon: Award, color: "amber" },
          { title: "Compliance Badges", desc: "0 badges unlocked", icon: Star, color: "emerald" },
          { title: "Partner Benefits", desc: "No active benefits", icon: Gift, color: "blue" },
        ].map(item => (
          <div key={item.title} className="relative bg-transparent border border-border rounded-none p-5">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <item.icon className={`h-6 w-6 text-${item.color}-500 mb-3`} />
            <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
