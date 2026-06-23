import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { Package, Search, Zap, ArrowRight, ChevronLeft, ChevronRight, Globe, Battery } from "lucide-react";
import { toast } from "sonner";interface Batch {
  id: string; batch_name: string; status: string; market_region: string;
  total_passports: number; pli_compliant: boolean; domestic_value_add: number;
  created_at: string;
}
type FilterType = "ALL" | "DRAFT" | "ACTIVE" | "ARCHIVED";
interface BatchesResponse { batches: Batch[]; total?: number; total_pages?: number; }
const ITEMS_PER_PAGE = 50;

export default function BatchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBatches = useCallback(async (page = 1) => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await api.get<BatchesResponse>(`/batches?tenant_id=${user.tenant_id}&page=${page}&limit=${ITEMS_PER_PAGE}`);
      setBatches(data.batches || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch { toast.error("Failed to load batches"); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchBatches(currentPage); }, [currentPage, fetchBatches]);

  const filteredBatches = batches.filter(b => {
    if (filter !== "ALL" && (b.status || "DRAFT") !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return b.batch_name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground tracking-tight">Production Batches</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage battery production runs and passport generation</p>
        </div>
        <Link to="/dashboard/batches" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Package className="h-4 w-4" /> Create Batch
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Package, label: "Total Batches", value: totalCount },
          { icon: Zap, label: "Active", value: batches.filter(b => b.status === 'ACTIVE').length, color: "emerald" },
          { icon: Battery, label: "Drafts", value: batches.filter(b => b.status !== 'ACTIVE').length },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${s.color ? "bg-emerald-500/10" : "bg-muted"} flex items-center justify-center`}>
              <s.icon className={`h-5 w-5 ${s.color ? "text-emerald-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input className="w-full pl-10 h-9 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Search batches..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
        </div>
        <div className="flex items-center gap-2">
          {["ALL", "DRAFT", "ACTIVE", "ARCHIVED"].map(f => (
            <button key={f} onClick={() => { setFilter(f as FilterType); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs rounded-md border ${filter === f ? "border-foreground bg-muted text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" /></div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Batch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Market</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Passports</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBatches.length === 0 ? (
                <tr><td colSpan={5} className="h-48 text-center text-muted-foreground">No batches found</td></tr>
              ) : filteredBatches.map(batch => (
                <tr key={batch.id} className="hover:bg-accent cursor-pointer" onClick={() => navigate(`/dashboard/batches/${batch.id}`)}>
                  <td className="px-4 py-4">
                    <div className="font-medium text-foreground">{batch.batch_name}</div>
                    <code className="text-xs text-muted-foreground font-mono">{batch.id.substring(0, 14)}...</code>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                      batch.market_region === 'INDIA' ? "bg-orange-500/10 text-orange-700" :
                      batch.market_region === 'EU' ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
                    }`}>
                      <Globe className="h-3 w-3" /> {batch.market_region || "Global"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">{(batch.total_passports || 0).toLocaleString()} units</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                      batch.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      batch.status === 'ARCHIVED' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      "bg-muted text-muted-foreground border-border"
                    }`}>{batch.status || "DRAFT"}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={e => { e.stopPropagation(); navigate(`/dashboard/batches/${batch.id}`); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {((currentPage-1)*ITEMS_PER_PAGE)+1}-{Math.min(currentPage*ITEMS_PER_PAGE, totalCount)} of {totalCount}</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage===1} onClick={() => setCurrentPage(p => p-1)} className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage>=totalPages} onClick={() => setCurrentPage(p => p+1)} className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
