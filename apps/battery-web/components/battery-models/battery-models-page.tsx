"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { queryKeys, useBatteryModels } from "@/hooks/use-queries";
import { batteryModelError, createBatteryModel } from "@/lib/api/battery-models";
import { canWrite } from "@/lib/rbac";

export function BatteryModelsPage() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const models = useBatteryModels(tenantId, page);
  const queryClient = useQueryClient();
  const router = useRouter();

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const model = await createBatteryModel(code, name);
      void queryClient.invalidateQueries({ queryKey: queryKeys.batteryModels(tenantId) });
      setOpen(false);
      router.push(`/dashboard/models/${model.id}`);
    } catch (error) {
      setFormError(batteryModelError(error, "Could not create the model. Try again."));
    } finally {
      setSaving(false);
    }
  }

  function toggleDialog(next: boolean) {
    if (saving) return;
    setOpen(next);
    if (next) {
      setCode("");
      setName("");
      setFormError("");
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Battery models</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage specifications and revision history for each model.</p>
        </div>
        {canWrite(user?.role) && (
          <Button onClick={() => toggleDialog(true)}><Plus aria-hidden="true" /> New model</Button>
        )}
      </div>

      {models.isPending && <p role="status" className="text-sm text-muted-foreground">Loading models…</p>}
      {models.isError && <p role="alert" className="text-sm text-destructive">Could not load models. <Button variant="link" onClick={() => void models.refetch()}>Try again</Button></p>}
      {models.data && (
        <>
          {models.data.models.length === 0 ? (
            <p className="rounded-md border bg-card p-6 text-sm text-muted-foreground">No battery models on this page.</p>
          ) : (
            <ul className="divide-y rounded-md border bg-card">
              {models.data.models.map((model) => (
                <li key={model.id}>
                  <Link href={`/dashboard/models/${model.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50">
                    <span className="break-all text-sm font-medium">{model.name}</span>
                    <span className="break-all text-xs text-muted-foreground">{model.code}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <ModelPagination page={page} hasMore={models.data.has_more} onChange={setPage} />
        </>
      )}

      <Dialog open={open} onOpenChange={toggleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New battery model</DialogTitle>
            <DialogDescription>The model code must be unique in this workspace. The model starts with a draft revision.</DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="model-code">Model code</Label><Input id="model-code" value={code} maxLength={80} required onChange={(e) => setCode(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="model-name">Model name</Label><Input id="model-name" value={name} maxLength={160} required onChange={(e) => setName(e.target.value)} /></div>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create model"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function ModelPagination({ page, hasMore, onChange }: { page: number; hasMore: boolean; onChange: (page: number) => void }) {
  if (page === 1 && !hasMore) return null;
  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <Button size="sm" variant="outline" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</Button>
      <span>Page {page}</span>
      <Button size="sm" variant="outline" disabled={!hasMore} onClick={() => onChange(page + 1)}>Next</Button>
    </div>
  );
}
