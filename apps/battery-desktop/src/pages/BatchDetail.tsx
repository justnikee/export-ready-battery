import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { ArrowLeft, Package, Globe, CheckCircle, Battery } from "lucide-react";
import { toast } from "sonner";

interface Batch {
  id: string; batch_name: string; status: string; market_region: string;
  total_passports: number; pli_compliant: boolean; domestic_value_add: number;
  specs?: { chemistry?: string; voltage?: string; capacity?: string };
  created_at: string; updated_at: string;
}

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    api.get(`/batches/${id}`).then(res => { setBatch(res.data.batch); }).catch(() => toast.error("Failed to load batch")).finally(() => setLoading(false));
  }, [id, user]);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" /></div>;
  if (!batch) return <div className="text-center py-12 text-muted-foreground">Batch not found</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/dashboard/batches")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Batches</button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl text-foreground tracking-tight">{batch.batch_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Batch ID: {batch.id}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
          batch.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
        }`}>{batch.status || "DRAFT"}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Total Passports", value: (batch.total_passports||0).toLocaleString() },
          { icon: Globe, label: "Market", value: batch.market_region || "Global" },
          { icon: Battery, label: "Chemistry", value: batch.specs?.chemistry || "N/A" },
          { icon: CheckCircle, label: "Created", value: new Date(batch.created_at).toLocaleDateString() },
        ].map(s => (
          <div key={s.label} className="relative bg-transparent border border-border rounded-none p-4">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><s.icon className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">{s.label}</span></div>
            <p className="text-lg text-foreground font-medium">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative bg-transparent border border-border rounded-none p-6">
        <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
        <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
        <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
        <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
        <h3 className="text-base font-medium text-foreground mb-4">Specifications</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Chemistry", batch.specs?.chemistry],
            ["Voltage", batch.specs?.voltage ? `${batch.specs.voltage}V` : undefined],
            ["Capacity", batch.specs?.capacity],
            ["PLI Eligible", batch.pli_compliant ? "Yes" : "No"],
          ].map(([l, v]) => (
            <div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="text-sm text-foreground">{v || "—"}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}
