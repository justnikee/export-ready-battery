import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import {
  Package,
  Zap,
  AlertCircle,
  QrCode,
  FolderPlus,
  MoreHorizontal,
  ArrowRight,
  Trash2,
  Shield,
  Upload,
  FileDown,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState, useEffect, useCallback } from "react";

interface DashboardStats {
  total_passports: number;
  total_batches: number;
  quota_used: number;
  quota_limit: number;
  passports_this_week: number;
  active_batches: number;
  scans_today: number;
}

interface RecentBatch {
  id: string;
  name: string;
  status: string;
  created_at: string;
  passport_count: number;
}

interface ActivityItem {
  id: string;
  action: string;
  passport_id: string;
  batch_name: string;
  time: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBatches, setRecentBatches] = useState<RecentBatch[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const [statsRes, batchesRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/batches?limit=10"),
      ]);
      setStats(statsRes.data);
      setRecentBatches((batchesRes.data.batches || []).slice(0, 5));

      const acts: ActivityItem[] = (batchesRes.data.batches || []).slice(0, 5).map((b: RecentBatch) => ({
        id: b.id,
        action: "Batch created",
        passport_id: b.id,
        batch_name: b.name,
        time: new Date(b.created_at).toLocaleDateString(),
      }));
      setActivities(acts);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const deleteBatch = async (id: string) => {
    try {
      await api.delete(`/batches/${id}`);

      setRecentBatches(prev => prev.filter(b => b.id !== id));
      toast.success("Batch deleted");
    } catch {
      toast.error("Failed to delete batch");
    } finally {
      setBatchToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user?.company_name || user?.email}
          </p>
        </div>
        <Link to="/dashboard/batches" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90">
          <FolderPlus className="h-4 w-4" /> New Batch
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Passports", value: stats?.total_passports?.toLocaleString() || "0", icon: Package, color: "text-blue-500" },
          { label: "Active Batches", value: stats?.active_batches?.toLocaleString() || "0", icon: Zap, color: "text-emerald-500" },
          { label: "Scans Today", value: stats?.scans_today?.toLocaleString() || "0", icon: QrCode, color: "text-amber-500" },
          { label: "Quota Used", value: `${stats?.quota_used || 0} / ${stats?.quota_limit || 0}`, icon: Shield, color: "text-purple-500" },
        ].map(item => (
          <div key={item.label} className="relative bg-transparent border border-border rounded-none p-5"><div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <span className="text-xl font-semibold text-foreground tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="relative bg-transparent border border-border rounded-none overflow-hidden"><div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Recent Batches</h3>
              <Link to="/dashboard/batches" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-6 py-3 font-medium">Batch Name</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Created</th>
                    <th className="text-left px-6 py-3 font-medium">Passports</th>
                    <th className="text-right px-6 py-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentBatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No batches yet</p>
                        <Link to="/dashboard/batches" className="text-xs text-blue-500 hover:underline mt-1 inline-block">Create your first batch</Link>
                      </td>
                    </tr>
                  ) : (
                    recentBatches.map(batch => (
                      <tr key={batch.id} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/dashboard/batches/${batch.id}`)}>
                        <td className="px-6 py-3 font-medium text-foreground">{batch.name}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            batch.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" :
                            batch.status === "CREATED" ? "bg-blue-500/10 text-blue-500" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {batch.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground hidden md:table-cell">
                          {new Date(batch.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 tabular-nums">{batch.passport_count}</td>
                        <td className="px-6 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <button className="p-1 hover:bg-accent rounded"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/dashboard/batches/${batch.id}`); }}>
                                <Package className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); setBatchToDelete(batch.id); }} className="cursor-pointer text-red-500 hover:bg-red-500/15 focus:bg-red-500/15 focus:text-red-500">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="relative bg-transparent border border-border rounded-none"><div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-2">
            {[
              { label: "Create Batch", icon: FolderPlus, to: "/dashboard/batches" },
              { label: "Scan Passport", icon: QrCode, to: "/dashboard/dispatch" },
              { label: "Check Compliance", icon: Shield, to: "/dashboard/compliance" },
              { label: "Export Reports", icon: FileDown, to: "/dashboard/exports" },
              { label: "Upload CSV", icon: Upload, to: "/dashboard/batches" },
            ].map(action => (
              <Link key={action.label} to={action.to} className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                <action.icon className="h-4 w-4" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {activities.length > 0 && (
        <div className="relative bg-transparent border border-border rounded-none"><div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
          </div>
          <div className="divide-y divide-border">
            {activities.map(act => (
              <div key={act.id} className="px-6 py-3 flex items-center gap-3 text-sm">
                <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{act.action}</span>
                <span className="text-muted-foreground">— {act.batch_name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!batchToDelete}
        onOpenChange={(open: boolean) => !open && setBatchToDelete(null)}
        title="Delete Batch"
        description="Are you sure you want to delete this batch? All associated passports will also be deleted. This action cannot be undone."
        confirmText="Delete"
        destructive
        onConfirm={() => batchToDelete && deleteBatch(batchToDelete)}
      />
    </div>
  );
}
