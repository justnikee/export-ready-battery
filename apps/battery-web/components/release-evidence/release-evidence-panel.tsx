"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/hooks/use-queries";
import { appendReleaseEvidence, downloadReleaseEvidence, listReleaseEvidence, type ReleaseEvidence } from "@/lib/api/release-evidence";
import { getApiErrorMessage } from "@/lib/utils";

type PanelProps = {
  workspace: string;
  kind: "batch" | "pack";
  id: string;
  writable?: boolean;
};

function ReleaseEvidenceForm({ workspace, batchId, previous, close, saved }: {
  workspace: string;
  batchId: string;
  previous: ReleaseEvidence | null;
  close: () => void;
  saved: () => void;
}) {
  const fieldId = useId();
  const [scope, setScope] = useState<ReleaseEvidence["scope"]>(previous?.scope ?? "batch");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (form: FormData) => appendReleaseEvidence(batchId, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.releaseEvidence(workspace) });
      saved();
    },
    onError: async (failure) => {
      setError(await getApiErrorMessage(failure, "Could not save release evidence."));
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (file instanceof File && file.size > 5 * 1024 * 1024) {
      setError("PDF must be 5 MiB or smaller.");
      return;
    }
    form.set("expected_revision", String(previous?.revision ?? 0));
    mutation.mutate(form);
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-md border bg-background p-4">
      <h3 className="font-medium">{previous ? `Add revision for ${previous.record_ref}` : "Attach a release record"}</h3>
      <fieldset disabled={mutation.isPending} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Label className="flex-col items-start gap-2">Source system<Input name="source_system" defaultValue={previous?.source_system} readOnly={!!previous} maxLength={120} required /></Label>
          <Label className="flex-col items-start gap-2">Record ID<Input name="record_ref" defaultValue={previous?.record_ref} readOnly={!!previous} maxLength={120} required /></Label>
          <Label className="flex-col items-start gap-2">Source revision<Input name="source_revision" maxLength={80} required /></Label>
          <Label className="flex-col items-start gap-2">Record date<Input name="recorded_on" type="date" required /></Label>
          <Label className="flex-col items-start gap-2">Disposition<Input name="disposition" defaultValue={previous?.disposition} maxLength={120} required /></Label>
          <Label className="flex-col items-start gap-2">Reviewer<Input name="reviewer" defaultValue={previous?.reviewer} maxLength={120} required /></Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${fieldId}-scope`}>Record scope</Label>
          <select id={`${fieldId}-scope`} name="scope" value={scope}
            onChange={(event) => setScope(event.target.value === "batch" ? "batch" : "sampled_packs")}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="batch">Entire batch</option>
            <option value="sampled_packs">Sampled packs</option>
          </select>
        </div>
        {scope === "sampled_packs" && (
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-serials`}>Sampled pack serials</Label>
            <Textarea id={`${fieldId}-serials`} aria-describedby={`${fieldId}-serial-help`} name="sample_serials"
              defaultValue={previous?.sample_serials.join("\n")} maxLength={10200} required />
            <p id={`${fieldId}-serial-help`} className="text-xs text-muted-foreground">Enter the exact serial numbers from this batch, one per line. Up to 100.</p>
          </div>
        )}
        <Label className="flex-col items-start gap-2">PDF file (up to 5 MiB)<Input name="file" type="file" accept="application/pdf,.pdf" required /></Label>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">{mutation.isPending ? "Saving…" : "Save evidence"}</Button>
          <Button type="button" variant="outline" onClick={close}>Cancel</Button>
        </div>
      </fieldset>
    </form>
  );
}

export function ReleaseEvidencePanel({ workspace, kind, id, writable = false }: PanelProps) {
  const [page, setPage] = useState(0);
  const [form, setForm] = useState<{ previous: ReleaseEvidence | null }>();
  const [notice, setNotice] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState("");
  const activeDownload = useRef<AbortController | null>(null);
  const query = useQuery({
    queryKey: queryKeys.releaseEvidence(workspace, kind, id, page),
    queryFn: ({ signal }) => listReleaseEvidence(kind, id, page, signal),
  });

  useEffect(() => () => activeDownload.current?.abort(), []);

  async function download(revision: ReleaseEvidence) {
    setDownloadError("");
    setDownloading(revision.id);
    const controller = new AbortController();
    activeDownload.current = controller;
    try {
      const blob = await downloadReleaseEvidence(revision.id, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = revision.file_name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      if (!controller.signal.aborted) {
        setDownloadError(await getApiErrorMessage(error, "Could not download release evidence."));
      }
    } finally {
      if (!controller.signal.aborted) setDownloading("");
    }
  }

  return (
    <section aria-label="Release evidence" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Release evidence</h2>
        {writable && !form && <Button size="sm" onClick={() => { setNotice(""); setForm({ previous: null }); }}>Attach evidence</Button>}
      </div>
      {notice && <p role="status" className="text-sm">{notice}</p>}
      {form && (
        <ReleaseEvidenceForm workspace={workspace} batchId={id} previous={form.previous} close={() => setForm(undefined)}
          saved={() => { setForm(undefined); setPage(0); setNotice("Release evidence saved."); }} />
      )}
      {query.isPending && <p role="status" className="text-sm">Loading release evidence…</p>}
      {query.isError && (
        <div className="flex items-center gap-2">
          <p role="alert" className="text-sm text-destructive">Could not load release evidence.</p>
          <Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button>
        </div>
      )}
      {downloadError && <p role="alert" className="text-sm text-destructive">{downloadError}</p>}
      {query.isSuccess && (
        <>
          {!query.data.items.length && <p className="text-sm text-muted-foreground">No release evidence is recorded for this {kind}.</p>}
          <ul className="space-y-2">
            {query.data.items.map((revision) => (
              <li key={revision.id} className="space-y-2 rounded-md border bg-background p-3">
                <p className="break-words font-medium">{revision.record_ref} · Revision {revision.revision} · {revision.current ? "Current" : "Historical"}</p>
                <p className="break-words text-sm text-muted-foreground">{revision.source_system} · Source revision {revision.source_revision} · {revision.recorded_on}</p>
                <p className="break-words text-sm">{revision.disposition} · Reviewed by {revision.reviewer}</p>
                <p className="break-words text-sm">{revision.scope === "batch" ? "Entire batch" : `Sampled packs: ${revision.sample_serials.join(", ")}`}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" aria-label={`Download ${revision.record_ref} revision ${revision.revision}`}
                    disabled={!!downloading} onClick={() => void download(revision)}>
                    {downloading === revision.id ? "Downloading…" : "Download PDF"}
                  </Button>
                  {writable && !form && revision.current && (
                    <Button size="sm" variant="outline" onClick={() => { setNotice(""); setForm({ previous: revision }); }}>Add revision</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {(page > 0 || query.data.has_more) && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={!page} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={!query.data.has_more} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
