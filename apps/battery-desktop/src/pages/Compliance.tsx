import { useAuth } from "@/context/auth-context";
import { Shield, CheckCircle2, AlertTriangle, Globe } from "lucide-react";

export default function CompliancePage() {
  const { user } = useAuth();
  const eprRegistered = !!user?.epr_registration_number;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight">India Compliance Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">BIS, EPR & PLI compliance tracking for Indian battery manufacturers</p>
      </div>

      {!eprRegistered && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">EPR Registration Missing</p>
            <p className="text-xs text-amber-500 mt-0.5">Add your CPCB EPR registration in Settings to unlock full compliance tracking.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "EPR Registration", status: user?.epr_status, detail: user?.epr_registration_number || "—", rule: "BWM Rules 2022" },
          { label: "BIS Certificate", status: user?.bis_status, detail: user?.bis_r_number || "—", rule: "IS 16046" },
          { label: "PLI Scheme", status: user?.pli_status, detail: "Production Linked Incentive", rule: "ACC PLI Phase II" },
        ].map(item => {
          const isVerified = item.status === 'VERIFIED';
          return (
            <div key={item.label} className={`relative bg-transparent border border-border rounded-none p-5 ${isVerified ? "border-emerald-500/30" : ""}`}>
              <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
              <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
              <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
              <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
              <div className="flex items-center gap-2 mb-2">
                {isVerified ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Shield className="h-5 w-5 text-muted-foreground" />}
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-7">{item.detail}</p>
              <p className="text-[10px] text-muted-foreground ml-7 mt-1">{item.rule}</p>
            </div>
          );
        })}
      </div>

      <div className="relative bg-transparent border border-border rounded-none p-6">
        <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
        <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
        <h3 className="text-base font-medium text-foreground mb-4 flex items-center gap-2"><Globe className="h-4 w-4 text-indigo-600" /> EU Battery Regulation Deadlines</h3>
        <div className="space-y-3">
          {[
            ["Feb 18, 2027", "Digital Battery Passport mandatory for EV & industrial >2kWh"],
            ["Aug 18, 2027", "Carbon footprint performance class (A-G) on label"],
            ["Aug 18, 2028", "Recycled content minimum thresholds enforced"],
          ].map(([date, desc]) => (
            <div key={date} className="flex items-start gap-3">
              <span className="text-xs text-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">{date}</span>
              <span className="text-sm text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
