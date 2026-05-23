import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { Building2, Mail, Globe, MapPin, ShieldCheck, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [form, setForm] = useState({
    company_name: user?.company_name || "",
    address: user?.address || "",
    support_email: user?.support_email || "",
    website: user?.website || "",
    epr_registration_number: user?.epr_registration_number || "",
    bis_r_number: user?.bis_r_number || "",
    iec_code: user?.iec_code || "",
    morth_manufacturer_code: user?.morth_manufacturer_code || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/auth/profile", form);
      await refreshUser();
      setMessage({ type: "success", text: "Organization profile updated" });
    } catch {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your company profile and compliance documents</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative bg-transparent border border-border rounded-none overflow-hidden">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-medium text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" /> Company Profile
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: "Company Name", icon: Building2, key: "company_name", type: "text", placeholder: "Acme Battery Co." },
              { label: "Address", icon: MapPin, key: "address", type: "textarea", placeholder: "123 Industrial Park" },
              { label: "Support Email", icon: Mail, key: "support_email", type: "email", placeholder: "support@company.com" },
              { label: "Website", icon: Globe, key: "website", type: "url", placeholder: "https://company.com" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium text-foreground">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px]" placeholder={f.placeholder} value={form[f.key as keyof typeof form]} onChange={e => setForm({...form, [f.key]: e.target.value})} />
                ) : (
                  <input type={f.type} className="mt-1 w-full h-9 px-3 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder={f.placeholder} value={form[f.key as keyof typeof form]} onChange={e => setForm({...form, [f.key]: e.target.value})} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="relative bg-transparent border border-border rounded-none overflow-hidden">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" /><span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-medium text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> India Compliance
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: "EPR Registration Number", key: "epr_registration_number", placeholder: "EPR/B/2024/XXXX" },
              { label: "BIS R-Number (IS 16046)", key: "bis_r_number", placeholder: "R-12345678" },
              { label: "IEC Code", key: "iec_code", placeholder: "AAACT1234A" },
              { label: "MoRTH Manufacturer Code", key: "morth_manufacturer_code", placeholder: "NKY" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium text-foreground">{f.label}</label>
                {f.key === "morth_manufacturer_code" ? (
                  <input type="text" maxLength={3} className="mt-1 w-full h-9 px-3 py-1 text-sm border border-border rounded-md bg-background font-mono uppercase focus:outline-none focus:ring-1 focus:ring-ring" placeholder={f.placeholder} value={form[f.key as keyof typeof form]} onChange={e => setForm({...form, [f.key]: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")})} />
                ) : (
                  <input type="text" className="mt-1 w-full h-9 px-3 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder={f.placeholder} value={form[f.key as keyof typeof form]} onChange={e => setForm({...form, [f.key]: e.target.value})} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border -mx-6 px-6 py-4 mt-6 flex items-center justify-between">
          {message && <p className={`text-sm ${message.type === "success" ? "text-emerald-500" : "text-red-500"}`}>{message.text}</p>}
          <div className="ml-auto">
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
