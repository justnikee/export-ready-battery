"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { queryKeys, useBatteryModel } from "@/hooks/use-queries";
import {
  batteryModelError, createBatteryModelDraft, releaseBatteryModelDraft, saveBatteryModelDraft,
  type BatteryModelRevision, type IntendedBatteryPart, type ModelRevisionSpecs,
} from "@/lib/api/battery-models";
import { canWrite } from "@/lib/rbac";
import { ModelPagination } from "./battery-models-page";

const categories: Record<string, string> = {
  EV: "Electric vehicle",
  LMT: "Light means of transport",
  INDUSTRIAL: "Industrial",
  PORTABLE: "Portable",
  SLI: "Starting, lighting and ignition",
};

export function BatteryModelDetail({ modelId }: { modelId: string }) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const writable = canWrite(user?.role);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();
  const detail = useBatteryModel(tenantId, modelId, page);
  const data = detail.data;
  const selected = data?.revisions.find((revision) => revision.id === selectedId) ?? data?.revisions[0];
  const hasDraft = page === 1 && data?.revisions.some((revision) => !revision.released_at);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.batteryModel(tenantId, modelId) });
  }

  async function newDraft() {
    setCreating(true);
    try {
      const revision = await createBatteryModelDraft(modelId);
      setSelectedId(revision.id);
      await refresh();
    } catch (error) {
      toast.error(batteryModelError(error, "Could not create the next draft."));
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <Link href="/dashboard/models" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Battery models
      </Link>
      {detail.isPending && <p role="status" className="text-sm text-muted-foreground">Loading model…</p>}
      {detail.isError && (
        <p role="alert" className="text-sm text-destructive">
          {batteryModelError(detail.error, "Could not load this model.")}
          <Button variant="link" onClick={() => void detail.refetch()}>Try again</Button>
        </p>
      )}
      {data && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-semibold tracking-tight">{data.model.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{data.model.code}</p>
            </div>
            {writable && page === 1 && !hasDraft && data.revisions.length > 0 && (
              <Button onClick={newDraft} disabled={creating}><Plus aria-hidden="true" /> {creating ? "Creating…" : "Create next draft"}</Button>
            )}
          </div>

          <div className="grid items-start gap-5 md:grid-cols-[minmax(12rem,1fr)_minmax(0,3fr)]">
            <nav aria-label="Revision history" className="space-y-3 rounded-md border bg-card p-3">
              <h2 className="px-1 text-sm font-semibold">Revisions</h2>
              {data.revisions.length === 0 && <p className="px-1 text-sm text-muted-foreground">No revisions on this page.</p>}
              {data.revisions.map((revision) => (
                <Button
                  key={revision.id}
                  type="button"
                  variant={selected?.id === revision.id ? "secondary" : "ghost"}
                  aria-current={selected?.id === revision.id ? "true" : undefined}
                  className="w-full justify-between"
                  onClick={() => setSelectedId(revision.id)}
                >
                  Revision {revision.revision_number}
                  <Badge variant={revision.released_at ? "default" : "outline"}>{revision.released_at ? "Released" : "Draft"}</Badge>
                </Button>
              ))}
              <ModelPagination
                page={page}
                hasMore={data.has_more}
                onChange={(nextPage) => { setSelectedId(undefined); setPage(nextPage); }}
              />
            </nav>
            {selected && (
              <RevisionPanel key={`${tenantId}:${selected.id}:${selected.version}`} revision={selected} writable={writable} refresh={refresh} />
            )}
          </div>
        </>
      )}
    </section>
  );
}

function RevisionPanel({ revision, writable, refresh }: {
  revision: BatteryModelRevision;
  writable: boolean;
  refresh: () => Promise<void>;
}) {
  const [specs, setSpecs] = useState(revision.specs);
  const [working, setWorking] = useState<"save" | "release" | null>(null);
  const [error, setError] = useState("");
  const editable = writable && !revision.released_at;
  const dirty = JSON.stringify(specs) !== JSON.stringify(revision.specs);
  const complete = Boolean(revision.specs.chemistry && revision.specs.voltage && revision.specs.capacity);
  const parts = specs.intended_bom ?? [];
  const updateSpecs = (changes: Partial<ModelRevisionSpecs>) => setSpecs({ ...specs, ...changes });
  const updatePart = (index: number, changes: Partial<IntendedBatteryPart>) => updateSpecs({
    intended_bom: parts.map((part, at) => at === index ? { ...part, ...changes } : part),
  });

  async function write(action: "save" | "release") {
    setWorking(action);
    setError("");
    try {
      if (action === "save") {
        await saveBatteryModelDraft(revision, specs);
        toast.success("Draft saved");
      } else {
        await releaseBatteryModelDraft(revision);
        toast.success("Revision released");
      }
      await refresh();
    } catch (err) {
      setError(batteryModelError(err, action === "save" ? "Could not save the draft." : "Could not release the revision."));
    } finally {
      setWorking(null);
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dirty && !working) void write("save");
  }

  return (
    <section className="min-w-0 space-y-5 rounded-md border bg-card p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">Revision {revision.revision_number} specifications</h2>
        {revision.released_at && (
          <p className="mt-1 text-sm text-muted-foreground">
            Released <time dateTime={revision.released_at}>{new Date(revision.released_at).toLocaleDateString()}</time>.
            Create the next draft to make changes.
          </p>
        )}
      </div>

      {editable ? (
        <form onSubmit={save} className="space-y-5">
          <fieldset disabled={working !== null} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="revision-chemistry">Chemistry</Label><Input id="revision-chemistry" maxLength={80} placeholder="LFP" value={specs.chemistry ?? ""} onChange={(e) => updateSpecs({ chemistry: e.target.value })} /></div>
            <div className="space-y-2">
              <Label htmlFor="revision-category">Battery category (optional)</Label>
              <select id="revision-category" value={specs.battery_category || ""} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" onChange={(e) => updateSpecs({ battery_category: e.target.value })}>
                <option value="">Select a category</option>
                {Object.entries(categories).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label htmlFor="revision-voltage">Nominal voltage</Label><Input id="revision-voltage" maxLength={32} placeholder="48 V" value={specs.voltage ?? ""} onChange={(e) => updateSpecs({ voltage: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="revision-capacity">Rated capacity</Label><Input id="revision-capacity" maxLength={32} placeholder="30 Ah" value={specs.capacity ?? ""} onChange={(e) => updateSpecs({ capacity: e.target.value })} /></div>
          </fieldset>
          <fieldset disabled={working !== null} className="space-y-3 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Intended bill of materials</h3>
              <Button type="button" size="sm" variant="outline" disabled={parts.length >= 100} onClick={() => updateSpecs({ intended_bom: [...parts, { part_number: "", name: "", quantity: 1 }] })}>Add part</Button>
            </div>
            {parts.map((part, index) => (
              <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end">
                <div className="space-y-1"><Label htmlFor={`part-number-${index}`}>Part number</Label><Input id={`part-number-${index}`} value={part.part_number} maxLength={80} required onChange={(e) => updatePart(index, { part_number: e.target.value })} /></div>
                <div className="space-y-1"><Label htmlFor={`part-name-${index}`}>Part name</Label><Input id={`part-name-${index}`} value={part.name} maxLength={160} required onChange={(e) => updatePart(index, { name: e.target.value })} /></div>
                <div className="space-y-1"><Label htmlFor={`part-quantity-${index}`}>Quantity</Label><Input id={`part-quantity-${index}`} type="number" min={1} max={1000000} step={1} required value={part.quantity || ""} onChange={(e) => updatePart(index, { quantity: Number(e.target.value) })} /></div>
                <Button type="button" variant="ghost" onClick={() => updateSpecs({ intended_bom: parts.filter((_, at) => at !== index) })}>Remove</Button>
              </div>
            ))}
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error} <Button type="button" variant="link" onClick={() => void refresh()}>Reload revision</Button></p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="outline" disabled={!dirty || working !== null}>{working === "save" ? "Saving…" : "Save draft"}</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button type="button" disabled={working !== null || dirty || !complete}>{working === "release" ? "Releasing…" : "Release revision"}</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Release revision {revision.revision_number}?</AlertDialogTitle>
                  <AlertDialogDescription>Its specifications and intended parts will be locked. Future changes go into the next revision.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void write("release")}>Release revision</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {!complete && <p className="text-xs text-muted-foreground">Save chemistry, nominal voltage and rated capacity to enable release.</p>}
        </form>
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Chemistry", specs.chemistry],
              ["Battery category", categories[specs.battery_category ?? ""]],
              ["Nominal voltage", specs.voltage],
              ["Rated capacity", specs.capacity],
            ].map(([label, value]) => (
              <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm font-medium">{value || "—"}</dd></div>
            ))}
          </dl>
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-semibold">Intended bill of materials</h3>
            {parts.length === 0 ? <p className="text-sm text-muted-foreground">No parts recorded.</p> : (
              <ul className="divide-y rounded-md border">
                {parts.map((part, index) => (
                  <li key={index} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm">
                    <span className="break-all">{part.name} <span className="text-muted-foreground">({part.part_number})</span></span>
                    <span className="tabular-nums">× {part.quantity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
