"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Layers3, Package, Settings, Shirt, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import type { Batch } from "@/lib/types";
import { dashboardPathFromPathname } from "@/lib/routes";
import { textileStageLabel } from "@/lib/textile-profile";
import { Button } from "@/components/ui/button";
import { CreateTextileLotDialog } from "@/components/textile/create-textile-lot-dialog";

interface BatchesResponse {
  batches?: Batch[];
}

function statusTone(status?: string) {
  if (status === "ACTIVE") return "bg-emerald-500/10 text-emerald-500";
  if (status === "ARCHIVED") return "bg-amber-500/10 text-amber-500";
  return "bg-muted text-muted-foreground";
}

export function TextileBatchesPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const templatesHref = dashboardPathFromPathname(pathname, "templates");
  const lifecycleHref = dashboardPathFromPathname(pathname, "lifecycle");
  const settingsHref = dashboardPathFromPathname(pathname, "settings");

  const fetchLots = useCallback(async () => {
    if (!user?.tenant_id) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.get<BatchesResponse>(
        `/batches?tenant_id=${user.tenant_id}&limit=100&product_type=TEXTILE`,
      );
      setBatches(response.data.batches || []);
    } catch (error) {
      console.error("Failed to load textile lots:", error);
      toast.error("Failed to load production lots");
    } finally {
      setLoading(false);
    }
  }, [user?.tenant_id]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_340px]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-600">
              Textile operations
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Production lots
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Textile workspaces should not inherit the battery batch language
              or controls. Create lots here using textile-specific terminology
              while the shared backend batch model remains in place.
            </p>
            <div className="mt-4">
              <Button onClick={() => setCreateOpen(true)}>
                Create textile lot
              </Button>
            </div>
          </div>

          <div className="border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-600" />
              <h2 className="text-sm font-medium text-foreground">
                Next lot actions
              </h2>
            </div>
            <div className="space-y-2 text-sm">
              <Link
                href={templatesHref}
                className="block text-blue-500 hover:underline"
              >
                Prepare textile templates
              </Link>
              <Link
                href={lifecycleHref}
                className="block text-blue-500 hover:underline"
              >
                Open supply-chain operations
              </Link>
              <Link
                href={settingsHref}
                className="block text-blue-500 hover:underline"
              >
                Review workspace defaults
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total lots
            </p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {batches.length}
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active lots
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-500">
              {batches.filter((batch) => batch.status === "ACTIVE").length}
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Draft or archived
            </p>
            <p className="mt-2 text-3xl font-semibold text-amber-500">
              {batches.filter((batch) => batch.status !== "ACTIVE").length}
            </p>
          </div>
        </div>

        <div className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-medium text-foreground">
                Current lot records
              </h2>
              <p className="text-sm text-muted-foreground">
                Shared batch records, presented as textile lots.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchLots}
              className="text-sm font-medium text-blue-500 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">
              Loading lots...
            </div>
          ) : batches.length === 0 ? (
            <div className="p-8 text-center">
              <Shirt className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-base font-medium text-foreground">
                No textile lots yet
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start the first textile lot from this page and keep the workflow
                separate from battery batch intake.
              </p>
              <div className="mt-4">
                <Button onClick={() => setCreateOpen(true)}>
                  Create first lot
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.5fr)_140px_160px_120px] md:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers3 className="h-4 w-4 text-cyan-600" />
                      <p className="font-medium text-foreground">
                        {batch.batch_name}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {batch.model_name || "No style / SKU name yet"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Material:{" "}
                      {batch.specs.material_profile ||
                        batch.specs.chemistry ||
                        "Not set"}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusTone(batch.status)}`}
                    >
                      {batch.status || "DRAFT"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {batch.specs.lot_size ||
                      batch.specs.capacity ||
                      `${batch.total_passports || 0} records`}
                    <div className="mt-1 text-xs text-muted-foreground">
                      {textileStageLabel(batch.specs.production_stage)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(batch.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href={templatesHref}
            className="border border-border bg-card p-5 transition-colors hover:border-cyan-500/40"
          >
            <Package className="h-5 w-5 text-cyan-600" />
            <h3 className="mt-3 text-sm font-medium text-foreground">
              Textile templates
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Review reusable lot presets and prepare the next schema-backed
              form.
            </p>
          </Link>
          <Link
            href={lifecycleHref}
            className="border border-border bg-card p-5 transition-colors hover:border-cyan-500/40"
          >
            <Layers3 className="h-5 w-5 text-cyan-600" />
            <h3 className="mt-3 text-sm font-medium text-foreground">
              Supply-chain operations
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Track the textile workflow without inheriting battery lifecycle
              labels.
            </p>
          </Link>
          <Link
            href={settingsHref}
            className="border border-border bg-card p-5 transition-colors hover:border-cyan-500/40"
          >
            <Settings className="h-5 w-5 text-cyan-600" />
            <h3 className="mt-3 text-sm font-medium text-foreground">
              Workspace defaults
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep team, visibility, and workspace setup aligned to textile
              workflows.
            </p>
          </Link>
        </div>

        <CreateTextileLotDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onLotCreated={fetchLots}
        />
      </div>
    </div>
  );
}
